import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from './layouts/header/header';
import { Footer } from './layouts/footer/footer';
import { AuthService } from './core/services/auth.service';

@Component({
  imports: [RouterOutlet, Header, Footer],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('ParcialProgramacionLautaroTorresDistefano');

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
      // Si el usuario es empleado, siempre lo mandamos a la pantalla de validación
      effect(() => {
          if (this.authService.rolActual() === 'empleado' && !this.router.url.startsWith('/empleado')) {
              this.router.navigate(['/empleado']);
          }
      });
  }
}
