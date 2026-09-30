// empleado-guard.ts
import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Solo deja entrar a los usuarios con rol "empleado"
export const empleadoGuard: CanMatchFn = () => {
    const authService = inject(AuthService);
    return authService.rolActual() === 'empleado';
};