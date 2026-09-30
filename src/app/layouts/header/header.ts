import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

  async cerrarSesion(){
    this.authService.signOut()
  }
}
