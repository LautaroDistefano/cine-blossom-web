import { Component, computed, inject } from '@angular/core';
import { MovieService } from '../../core/services/movie.service';
import { MovieCard } from '../../shared/components/movie-card/movie-card';

@Component({
  imports: [MovieCard],
  selector: 'app-top-movies',
  styleUrl: './top-movies.css',
  templateUrl: './top-movies.html',
})
export class TopMovies {
  private movieService = inject(MovieService);

  peliculasMayorRating = computed(() => {
    const copia_peliculas = [...this.movieService.peliculas()]
    copia_peliculas.sort((a, b) => b.ratingPromedio - a.ratingPromedio)
    return copia_peliculas.slice(0, 3)
  })
}
