import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Chamado } from '../models/chamado.model';

interface PaginatedResponse {
  data: {
    pagina: number;
    tamanho: number;
    total: number;
    resultado: Chamado[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChamadoService {
  private readonly getChamadosUrl = environment.apiChamado + '/api/v1/chamados/pesquisa';

  private chamadosSubject = new BehaviorSubject<Chamado[]>([]);
  public chamados$ = this.chamadosSubject.asObservable();

  private paginaAtual = 1;
  private maximoPorPagina = 10;
  private filtroTitulo = '';
  private filtroDescricao = '';
  private totalChamados = 0;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getChamados(
    pagina: number = 1,
    maximo: number = 10,
    titulo: string = '',
    descricao: string = ''
  ): Observable<PaginatedResponse> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('maximo', maximo.toString());

    if (titulo) params = params.set('titulo', titulo);
    if (descricao) params = params.set('descricao', descricao);

    return this.http
      .get<PaginatedResponse>(this.getChamadosUrl, {
        headers: this.getAuthHeaders(),
        params
      })
      .pipe(
        tap(res => {
          this.paginaAtual = res.data.pagina;
          this.maximoPorPagina = res.data.tamanho;
          this.totalChamados = res.data.total;
          this.filtroTitulo = titulo;
          this.filtroDescricao = descricao;
          this.chamadosSubject.next(res.data.resultado);
        }),
        catchError(this.handleError)
      );
  }

  refreshChamados(): void {
    this.getChamados(this.paginaAtual, this.maximoPorPagina, this.filtroTitulo, this.filtroDescricao).subscribe({
      next: () => console.log('✅ Lista de chamados atualizada.'),
      error: err => console.error('❌ Erro ao atualizar a lista de chamados:', err)
    });
  }

  getPaginaAtual(): number {
    return this.paginaAtual;
  }

  getMaximoPorPagina(): number {
    return this.maximoPorPagina;
  }

  getTotalChamados(): number {
    return this.totalChamados;
  }

  setFiltros(titulo: string, descricao: string): void {
    this.filtroTitulo = titulo;
    this.filtroDescricao = descricao;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private handleError(error: any) {
    console.error('❌ Ocorreu um erro na API de Chamados', error);
    return throwError(() => new Error('Erro no serviço de chamados.'));
  }
}
