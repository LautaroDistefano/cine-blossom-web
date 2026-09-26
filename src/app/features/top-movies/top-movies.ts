import { Component, computed, inject } from '@angular/core';
import { MovieService } from '../../core/services/movie.service';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import { ReviewService } from '../../core/services/reviews.service';

@Component({
  imports: [MovieCard],
  selector: 'app-top-movies',
  styleUrl: './top-movies.css',
  templateUrl: './top-movies.html',
})
export class TopMovies {
  private movieService = inject(MovieService);
  private reviewService = inject(ReviewService);

  peliculasMayorRating = computed(() => {
    const copia = [...this.movieService.peliculas()];
    copia.sort((a, b) => 
      this.reviewService.getPromedioDePelicula(b.id)() - this.reviewService.getPromedioDePelicula(a.id)()
    );
    return copia.slice(0, 3);
  });
}