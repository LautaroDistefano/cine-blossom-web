import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Movie } from '../../core/models/movie.interface';
import { MovieService } from '../../core/services/movie.service';
import { FuncionesService } from '../../core/services/funciones.service';

@Component({
  imports: [],
  selector: 'app-movie-detail',
  styleUrl: './movie-detail.css',
  templateUrl: './movie-detail.html',
})
export class MovieDetail {
  movieService = inject(MovieService);
  funcionesService = inject(FuncionesService);
  
  mostrarFunciones = signal(false);

  id = input.required<string>();

  pelicula = computed(() => {
    return this.movieService.peliculas().find(p => p.id === this.id());
  });

  funcionesPelicula = computed(() => 
    this.funcionesService.funciones().filter(f => f.peliculaId === this.id())
  );

  toggleFunciones() {
      this.mostrarFunciones.set(!this.mostrarFunciones());
  }

  constructor(private router: Router) {}

  volverHome() {
    this.router.navigate(['/home']);
  }

  irAReservar(IdPelicula: string){
    this.router.navigate(['/reservar', IdPelicula]);
  }
}