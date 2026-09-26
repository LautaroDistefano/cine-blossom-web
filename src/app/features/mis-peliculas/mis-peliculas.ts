// features/mis-peliculas/mis-peliculas.ts
import { Component, inject } from '@angular/core';
import { ReviewService } from '../../core/services/reviews.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-mis-peliculas',
  imports: [DatePipe],
  templateUrl: './mis-peliculas.html',
  styleUrl: './mis-peliculas.css',
})
export class MisPeliculas {
  reviewService = inject(ReviewService);
}