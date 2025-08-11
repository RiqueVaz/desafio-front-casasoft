import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ChamadoService } from './chamado.service';

@Injectable({
  providedIn: 'root'
})
export class SignalRService implements OnDestroy {
  private hubConnection?: signalR.HubConnection;
  private broadcastMessageSubject = new Subject<any>();
  private connectionStatusSubject = new Subject<boolean>();

  constructor(
    private auth: AuthService,
    private chamadoService: ChamadoService
  ) {}

  public async startConnection(): Promise<void> {
    const token = this.auth.getToken();
    if (!token) {
      console.error('Token não encontrado');
      this.connectionStatusSubject.next(false);
      return;
    }

    try {
      if (this.hubConnection) {
        await this.hubConnection.stop();
      }

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl('https://casasoftchamado.casasoftsig.net.br/chamado/AtualizarPesquisa', {
          accessTokenFactory: () => token,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
          timeout: 30000
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount === 0) return 0;
            if (retryContext.previousRetryCount < 3) return 2000;
            return 5000;
          }
        })
        .configureLogging(signalR.LogLevel.Debug)
        .build();

      this.setupEventHandlers();
      await this.hubConnection.start();
      console.log('SignalR Connected');
      this.connectionStatusSubject.next(true);

    } catch (error: any) {
      console.error('SignalR Connection Error:', error);
      this.connectionStatusSubject.next(false);
    }
  }

  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.onreconnecting((error) => {
      console.log('SignalR Reconnecting...', error?.message || '');
      this.connectionStatusSubject.next(false);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR Reconnected:', connectionId);
      this.connectionStatusSubject.next(true);
    });

    this.hubConnection.onclose((error) => {
      console.log('SignalR Connection closed:', error?.message || '');
      this.connectionStatusSubject.next(false);
    });

    this.hubConnection.on('BroadcastMessage', (payload: any) => {
      console.log('BroadcastMessage recebido:', payload);
      this.broadcastMessageSubject.next(payload);
      this.chamadoService.refreshChamados();
    });
  }

  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      console.log('Desconectando SignalR...');
      await this.hubConnection.stop();
      this.connectionStatusSubject.next(false);
    }
  }

  public getBroadcastMessages(): Observable<any> {
    return this.broadcastMessageSubject.asObservable();
  }

  public getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  public getConnectionInfo(): any {
    if (!this.hubConnection) return null;

    return {
      state: this.hubConnection.state,
      connectionId: this.hubConnection.connectionId,
      baseUrl: (this.hubConnection as any).baseUrl
    };
  }

  ngOnDestroy(): void {
    this.stopConnection();
  }
}
