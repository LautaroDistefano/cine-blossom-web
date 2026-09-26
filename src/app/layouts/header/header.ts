import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DatePipe } from '@angular/common';
@Component({
  imports: [RouterLink, RouterLinkActive, DatePipe],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  protected authService = inject(AuthService)

  async cerrarSesion(){
    this.authService.signOut()
  }
}
