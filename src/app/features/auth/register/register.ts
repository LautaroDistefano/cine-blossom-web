import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { email, password } = this.registerForm.value;

    try {
      const { data, error } = await this.authService.signUp(email!, password!);
      if (error) throw error;
      
      // Si la confirmación de email está activa en Supabase, avisamos
      if (data.user?.identities?.length === 0) {
          this.errorMessage.set('Este email ya está registrado.');
      } else {
          this.successMessage.set('¡Registro exitoso! Por favor verifica tu email o inicia sesión.');
          this.registerForm.reset();
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al registrarse');
    } finally {
      this.isLoading.set(false);
    }
  }
}
