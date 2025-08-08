import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Chamado } from '../models/chamado.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChamadoService {
  private readonly apiUrl = environment.apiChamado;
  

  private chamadosSubject = new BehaviorSubject<Chamado[]>([]);
  public chamados$ = this.chamadosSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}


  getChamados(): Observable<Chamado[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(`${this.apiUrl}/listar`, { headers })
      .pipe(
        tap((response) => {

          const chamados = this.extractChamadosFromResponse(response);
          this.chamadosSubject.next(chamados);
        })
      );
  }


  atualizarPesquisa(): Observable<Chamado[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(`${this.apiUrl}/AtualizarPesquisa`, { headers })
      .pipe(
        tap((response) => {
          const chamados = this.extractChamadosFromResponse(response);
          this.chamadosSubject.next(chamados);
        })
      );
  }


  getChamadoById(id: number): Observable<Chamado> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers });
  }

  createChamado(chamado: Partial<Chamado>): Observable<Chamado> {
    const headers = this.getAuthHeaders();
    
    return this.http.post<any>(`${this.apiUrl}/criar`, chamado, { headers });
  }


  updateChamado(id: number, chamado: Partial<Chamado>): Observable<Chamado> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<any>(`${this.apiUrl}/${id}`, chamado, { headers });
  }


  updateChamadosList(): void {
    this.atualizarPesquisa().subscribe({
      next: () => {
        console.log('Lista de chamados atualizada via SignalR');
      },
      error: (error) => {
        console.error('Erro ao atualizar chamados via SignalR:', error);
      }
    });
  }


  getCurrentChamados(): Chamado[] {
    return this.chamadosSubject.value;
  }


  refreshChamados(): void {
    this.getChamados().subscribe({
      error: (error) => {
        console.error('Erro ao buscar chamados:', error);
      }
    });
  }


  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }


  private extractChamadosFromResponse(response: any): Chamado[] {

    if (Array.isArray(response)) {
      return response;
    }
    
 
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    

    if (response?.items && Array.isArray(response.items)) {
      return response.items;
    }
    

    if (response?.data && !Array.isArray(response.data)) {
      return [response.data];
    }
    
    console.warn('Formato de resposta não reconhecido:', response);
    return [];
  }
}