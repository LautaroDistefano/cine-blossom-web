import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Movie } from '../../core/models/movie.interface';
import { MovieService } from '../../core/services/movie.service';

@Component({
  imports: [],
  selector: 'app-movie-detail',
  styleUrl: './movie-detail.css',
  templateUrl: './movie-detail.html',
})
export class MovieDetail {
  movieService = inject(MovieService);

  id = input.required<string>();

  pelicula = computed(() => {
    return this.movieService.peliculas().find(p => p.id === this.id());
  });

  constructor(private router: Router) {}

  volverHome() {
    this.router.navigate(['/home']);
  }
}
