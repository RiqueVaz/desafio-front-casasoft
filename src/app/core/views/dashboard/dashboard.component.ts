import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ChamadoService } from '../../../core/services/chamado.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { Chamado, StatusChamado } from '../../models/chamado.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  public chamadosFiltrados: Chamado[] = [];
  public isLoading = true;
  public isSignalRConnected = false;
  public userData: any = null;
  public errorMessage = '';

  public filtroTitulo = '';
  public filtroDescricao = '';

  public paginaAtual = 1;
  public maximoPorPagina = 10;
  public totalChamados = 0; 

  private todosChamados: Chamado[] = []; 
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private chamadoService: ChamadoService,
    private signalRService: SignalRService
  ) {}

  ngOnInit(): void {
    this.userData = this.authService.getUserData();
    this.loadChamados();
    this.setupSignalRListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.signalRService.stopConnection();
  }

  loadChamados(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const sub = this.chamadoService.getChamados(this.paginaAtual, this.maximoPorPagina).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.paginaAtual = res.data.pagina;
        this.maximoPorPagina = res.data.tamanho;


        this.todosChamados = res.data.resultado;


        this.paginaAtual = 1; 
        this.aplicarFiltroEPaginacao();
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

    this.subscriptions.add(sub);
  }

  aplicarFiltroEPaginacao(): void {

    let filtrados = this.todosChamados.filter(chamado =>
      chamado.titulo.toLowerCase().includes(this.filtroTitulo.toLowerCase()) &&
      chamado.descricao.toLowerCase().includes(this.filtroDescricao.toLowerCase())
    );

 
    this.totalChamados = filtrados.length;


    const start = (this.paginaAtual - 1) * this.maximoPorPagina;
    const end = start + this.maximoPorPagina;
    this.chamadosFiltrados = filtrados.slice(start, end);
  }

  onFiltroChange(): void {
    this.paginaAtual = 1; 
    this.aplicarFiltroEPaginacao();
  }

  onPageChange(novaPagina: number): void {
    if (novaPagina < 1 || novaPagina > this.totalPaginas()) return;
    this.paginaAtual = novaPagina;
    this.aplicarFiltroEPaginacao();
  }

  totalPaginas(): number {
    return Math.ceil(this.totalChamados / this.maximoPorPagina) || 1;
  }

  setupSignalRListeners(): void {
    this.signalRService.startConnection();

    const statusSub = this.signalRService.getConnectionStatus().subscribe(isConnected => {
      this.isSignalRConnected = isConnected;
      this.showNotification(
        isConnected ? 'Conectado ao SignalR (tempo real ativado).' : 'SignalR desconectado. Fallback ativado.',
        isConnected ? 'success' : 'info'
      );
    });

    const broadcastSub = this.signalRService.getBroadcastMessages().subscribe(() => {
      this.loadChamados();
      this.showNotification('Lista de chamados atualizada em tempo real!', 'success');
    });

    this.subscriptions.add(statusSub);
    this.subscriptions.add(broadcastSub);
  }

  reconnectSignalR(): void {
    this.showNotification('Tentando reconectar...', 'info');
    this.signalRService.startConnection();
  }

  refreshChamados(): void {
    this.loadChamados();
  }

  logout(): void {
    this.authService.logout();
  }

  getStatusClass(status: StatusChamado | string): string {
    const normalized = (status || '').toString().toUpperCase();
    const statusMap: { [key: string]: string } = {
      'ABERTO': 'status-aberto',
      'EM_ATENDIMENTO': 'status-em-andamento',
      'EM_ANDAMENTO': 'status-em-andamento',
      'FINALIZADO': 'status-fechado',
      'FECHADO': 'status-fechado'
    };
    return statusMap[normalized] || 'status-default';
  }

  getStatusText(status: StatusChamado | string): string {
    const normalized = (status || '').toString().toUpperCase();
    const statusTextMap: { [key: string]: string } = {
      'ABERTO': 'Aberto',
      'EM_ATENDIMENTO': 'Em Atendimento',
      'EM_ANDAMENTO': 'Em Andamento',
      'FINALIZADO': 'Finalizado',
      'FECHADO': 'Fechado'
    };
    return statusTextMap[normalized] || normalized.replace('_', ' ');
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    console.log(`NOTIFICAÇÃO (${type}): ${message}`);
  }

  trackByChamado(index: number, chamado: Chamado): number {
    return chamado.id;
  }
}
