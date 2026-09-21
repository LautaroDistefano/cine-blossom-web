import { Component, inject } from '@angular/core';
import { MovieService } from '../../core/services/movie.service';
import { DatePipe } from '@angular/common';

@Component({
  imports: [DatePipe],
  selector: 'app-proximamente',
  styleUrl: './proximamente.css',
  templateUrl: './proximamente.html',
})
export class Proximamente {
  movieService = inject(MovieService)
}
