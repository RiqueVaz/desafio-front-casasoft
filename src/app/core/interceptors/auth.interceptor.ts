import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  

  const token = authService.getToken();
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }


  return next(req).pipe(
    catchError((error) => {
      
  
      if (error.status === 401) {
        console.log('Token expirado ou inválido. Redirecionando para login...');
        authService.logout();
      }


      if (error.status === 403) {
        console.log('Acesso negado. Usuário sem permissão.');
      }


      if (error.status === 0) {
        console.error('Erro de rede. Verifique sua conexão.');
      }

      return throwError(() => error);
    })
  );
};