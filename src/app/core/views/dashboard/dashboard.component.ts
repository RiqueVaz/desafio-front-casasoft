import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service'; // Ajuste o caminho se necessário
import { ChamadoService } from '../../../core/services/chamado.service'; // Ajuste o caminho se necessário
import { SignalRService } from '../../../core/services/signalr.service'; // Ajuste o caminho se necessário
import { Chamado, StatusChamado } from '../../models/chamado.model'; // Ajuste o caminho se necessário

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  public chamados$: Observable<Chamado[]>;
  public isLoading = true;
  public isSignalRConnected = false;
  public userData: any = null;
  public errorMessage = '';
  
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private chamadoService: ChamadoService,
    private signalRService: SignalRService
  ) {
    // Initialize the observable in constructor
    this.chamados$ = this.chamadoService.chamados$;
  }

  ngOnInit(): void {
    this.userData = this.authService.getUserData();
    
    this.loadInitialChamados();
    this.setupSignalRListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.signalRService.stopConnection();
  }

  private loadInitialChamados(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const chamadosSub = this.chamadoService.getChamados().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Falha ao carregar os chamados. Verifique sua conexão ou token.';
        console.error(err);
        if (err?.status === 401) {
          this.authService.logout();
        }
      }
    });
    this.subscriptions.add(chamadosSub);
  }

  private setupSignalRListeners(): void {
    this.signalRService.startConnection();

    const statusSub = this.signalRService.getConnectionStatus().subscribe(isConnected => {
      this.isSignalRConnected = isConnected;
    });

    const broadcastSub = this.signalRService.getBroadcastMessages().subscribe(() => {
      this.showNotification('A lista de chamados foi atualizada em tempo real!', 'success');
    });

    this.subscriptions.add(statusSub);
    this.subscriptions.add(broadcastSub);
  }

  // ===== FUNÇÃO ADICIONADA AQUI =====
  /**
   * Tenta reconectar manualmente ao SignalR.
   */
  public reconnectSignalR(): void {
    console.log('Tentando reconectar o SignalR manualmente...');
    this.showNotification('Tentando reconectar...', 'info');
    this.signalRService.startConnection();
  }
  // ===================================

  public refreshChamados(): void {
    this.isLoading = true;
    this.chamadoService.refreshChamados();
    setTimeout(() => this.isLoading = false, 500);
  }

  public logout(): void {
    this.authService.logout();
  }

  public getStatusClass(status: StatusChamado): string {
    const statusMap: { [key in StatusChamado]: string } = {
      ABERTO: 'status-aberto',
      EM_ANDAMENTO: 'status-em-andamento',
      FECHADO: 'status-fechado'
    };
    return statusMap[status] || 'status-default';
  }

  public getStatusText(status: StatusChamado): string {
    const statusTextMap: { [key in StatusChamado]: string } = {
      ABERTO: 'Aberto',
      EM_ANDAMENTO: 'Em Andamento',
      FECHADO: 'Fechado'
    };
    return statusTextMap[status] || status.replace('_', ' ');
  }

  public formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    console.log(`NOTIFICAÇÃO (${type}): ${message}`);
  }

  public trackByChamado(index: number, chamado: Chamado): number {
    return chamado.id;
  }
}
