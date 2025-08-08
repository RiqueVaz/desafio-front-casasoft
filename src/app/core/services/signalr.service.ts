import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { ChamadoService } from './chamado.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection?: HubConnection;
  private readonly hubUrl = environment.signalrHub;
  

  private broadcastMessageSubject = new Subject<any>();
  public broadcastMessage$ = this.broadcastMessageSubject.asObservable();


  private connectionStatusSubject = new Subject<boolean>();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor(
    private authService: AuthService,
    private chamadoService: ChamadoService
  ) {}

  public async startConnection(): Promise<void> {
    try {
      const token = this.authService.getToken();
      
      if (!token) {
        console.error('Token não encontrado para conexão SignalR');
        return;
      }


      this.hubConnection = new HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .build();


      this.setupEventListeners();


      await this.hubConnection.start();
      console.log('Conexão SignalR estabelecida com sucesso');
      this.connectionStatusSubject.next(true);

    } catch (error) {
      console.error('Erro ao conectar com SignalR:', error);
      this.connectionStatusSubject.next(false);
      

      setTimeout(() => {
        this.startConnection();
      }, 5000);
    }
  }


  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
        console.log('Conexão SignalR encerrada');
        this.connectionStatusSubject.next(false);
      } catch (error) {
        console.error('Erro ao encerrar conexão SignalR:', error);
      }
    }
  }


  public isConnected(): boolean {
    return this.hubConnection?.state === 'Connected';
  }


  public async sendMessage(method: string, ...args: any[]): Promise<void> {
    if (this.hubConnection && this.isConnected()) {
      try {
        await this.hubConnection.invoke(method, ...args);
      } catch (error) {
        console.error(`Erro ao enviar mensagem ${method}:`, error);
      }
    } else {
      console.warn('Conexão SignalR não está ativa');
    }
  }


  private setupEventListeners(): void {
    if (!this.hubConnection) {
      return;
    }


    this.hubConnection.on('BroadcastMessage', (message: any) => {
      console.log('Mensagem recebida via SignalR:', message);
      

      this.broadcastMessageSubject.next(message);
      

      this.chamadoService.updateChamadosList();
    });


    this.hubConnection.on('ChamadoAtualizado', (chamadoId: number) => {
      console.log(`Chamado ${chamadoId} foi atualizado`);
      this.chamadoService.updateChamadosList();
    });

    this.hubConnection.on('NovoChamado', (chamado: any) => {
      console.log('Novo chamado criado:', chamado);
      this.chamadoService.updateChamadosList();
    });


    this.hubConnection.onclose((error) => {
      console.log('Conexão SignalR fechada:', error);
      this.connectionStatusSubject.next(false);
      

      setTimeout(() => {
        this.startConnection();
      }, 3000);
    });

    this.hubConnection.onreconnecting((error) => {
      console.log('Tentando reconectar SignalR...', error);
      this.connectionStatusSubject.next(false);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR reconectado. ID:', connectionId);
      this.connectionStatusSubject.next(true);
    });
  }


  public addListener(eventName: string, callback: (...args: any[]) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on(eventName, callback);
    }
  }

  public removeListener(eventName: string): void {
    if (this.hubConnection) {
      this.hubConnection.off(eventName);
    }
  }


  public getBroadcastMessages(): Observable<any> {
    return this.broadcastMessage$;
  }


  public getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$;
  }


  public async forceReconnect(): Promise<void> {
    await this.stopConnection();
    await this.startConnection();
  }
}