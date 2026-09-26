import { Component, input, inject, computed } from '@angular/core';
import { Movie } from '../../../core/models/movie.interface';
import { ReviewService } from '../../../core/services/reviews.service';

@Component({
  imports: [],
  selector: 'app-movie-card',
  styleUrl: './movie-card.css',
  templateUrl: './movie-card.html',
})
export class MovieCard {
  private reviewService = inject(ReviewService);

  pelicula = input.required<Movie>();
  variant = input<'default' | 'top'>('default');

  cantidadReviews = computed(() => this.reviewService.getReviewsDePelicula(this.pelicula().id)().length);
  promedio = computed(() => this.reviewService.getPromedioDePelicula(this.pelicula().id)());
}