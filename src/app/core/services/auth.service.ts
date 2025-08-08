import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiAuth;
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'user_data';
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Realiza o login do usuário
   */
  login(email: string, senha: string): Observable<AuthResponse> {
    const loginData = { email, senha };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap((response: AuthResponse) => {
          if (response?.data?.accessToken) {
            this.setTokenData(response.data);
            this.isAuthenticatedSubject.next(true);
            
            // Redireciona para a URL guardada ou dashboard
            const redirectUrl = localStorage.getItem('redirectUrl') || '/dashboard';
            localStorage.removeItem('redirectUrl');
            this.router.navigate([redirectUrl]);
          }
        })
      );
  }

  /**
   * Realiza o logout do usuário
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('redirectUrl');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  /**
   * Retorna o token de acesso
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Retorna os dados do usuário
   */
  getUserData() {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Verifica se possui token válido
   */
  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    
    if (!token) {
      return false;
    }

    try {
      // Decodifica o JWT para verificar expiração
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return false;
    }
  }

  /**
   * Armazena os dados do token e usuário
   */
  private setTokenData(data: any): void {
    localStorage.setItem(this.TOKEN_KEY, data.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.userToken));
  }

  /**
   * Atualiza o token (se necessário para refresh)
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap((response: AuthResponse) => {
          if (response?.data?.accessToken) {
            this.setTokenData(response.data);
          }
        })
      );
  }
}