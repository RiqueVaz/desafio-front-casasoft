import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.createForm();
  }

  ngOnInit() {
    // Se já estiver logado, redireciona para dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    
  }

  /**
   * Cria o formulário reativo
   */
  private createForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Preenche com credenciais de teste
   */
  

  /**
   * Realiza o login
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, senha } = this.loginForm.value;

    this.authService.login(email, senha).subscribe({
      next: (response) => {
        console.log('Login realizado com sucesso:', response);
        // O redirecionamento é feito automaticamente no AuthService
      },
      error: (error) => {
        console.error('Erro no login:', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'Email ou senha inválidos.';
        } else if (error.status === 0) {
          this.errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else {
          this.errorMessage = error.error?.message || 'Erro interno do servidor.';
        }
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Alterna visibilidade da senha
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Verifica se um campo específico é inválido e foi tocado
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Retorna a mensagem de erro para um campo específico
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (field?.errors?.['required']) {
      return `${this.getFieldLabel(fieldName)} é obrigatório.`;
    }
    
    if (field?.errors?.['email']) {
      return 'Email deve ter um formato válido.';
    }
    
    if (field?.errors?.['minlength']) {
      return `${this.getFieldLabel(fieldName)} deve ter pelo menos ${field.errors['minlength'].requiredLength} caracteres.`;
    }
    return '';
  }

  /**
   * Marca todos os campos do formulário como tocados
   */
  private markFormGroupTouched(): void {
    Object.values(this.loginForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  /**
   * Retorna o label do campo para mensagens de erro
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      senha: 'Senha'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Reset do formulário
   */
  resetForm(): void {
    this.loginForm.reset();
    this.errorMessage = '';
    this.isLoading = false;
  }

  /**
   * Navega para rota específica
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}