// movie-filter-genre.ts
import { Component, input, model } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-movie-filter-genre',
  styleUrl: './movie-filter-genre.css',
  templateUrl: './movie-filter-genre.html',
})
export class MovieFilterGenre {
  valor = model<string>('');
  generos = input.required<string[]>();
}