import { Component, input } from '@angular/core';
import { Movie } from '../../../core/models/movie.interface';

@Component({
  imports: [],
  selector: 'app-movie-card',
  styleUrl: './movie-card.css',
  templateUrl: './movie-card.html',
})
export class MovieCard {
  pelicula = input.required<Movie>();
}
