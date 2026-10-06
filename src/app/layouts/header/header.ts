import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DatePipe } from '@angular/common';
import { PuntosService } from '../../core/services/puntos.service';
@Component({
  imports: [RouterLink, RouterLinkActive, DatePipe],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  protected authService = inject(AuthService)
  puntosService = inject(PuntosService);
  private router = inject(Router);

  async cerrarSesion(){
    this.authService.signOut();
    this.router.navigate(['/home']);
  }
}
