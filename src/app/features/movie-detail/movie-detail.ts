import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Movie } from '../../core/models/movie.interface';
import { MovieService } from '../../core/services/movie.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { ReviewService } from '../../core/services/reviews.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  imports: [],
  selector: 'app-movie-detail',
  styleUrl: './movie-detail.css',
  templateUrl: './movie-detail.html',
})
export class MovieDetail {
  movieService = inject(MovieService);
  funcionesService = inject(FuncionesService);
  reviewService = inject(ReviewService);
  authService = inject(AuthService);
  

  reviewsDeEstaPelicula = computed(() => this.reviewService.getReviewsDePelicula(this.id())());
  promedioEstrellas = computed(() => this.reviewService.getPromedioDePelicula(this.id())());
  miReview = computed(() => this.reviewService.getMiReviewDePelicula(this.id())());

  estrellasSeleccionadas = signal(0);
  estrellaHover = signal(0);
  comentarioTexto = signal('');
  guardandoReview = signal(false);
  mostrarFunciones = signal(false);

  id = input.required<string>();

  pelicula = computed(() => {
    return this.movieService.peliculas().find(p => p.id === this.id());
  });

  funcionesPelicula = computed(() => 
    this.funcionesService.funciones().filter(f => f.peliculaId === this.id())
  );

  constructor(private router: Router) {
      let yaInicializado = false;

      effect(() => {
          const review = this.miReview();
          if (review && !yaInicializado) {
              this.estrellasSeleccionadas.set(review.estrellas);
              this.comentarioTexto.set(review.comentario ?? '');
              yaInicializado = true;
          }
      });
  }
  seleccionarEstrella(n: number) {
      console.log('click en', n);
      this.estrellasSeleccionadas.set(n);
  }
    async enviarReview() {
        if (this.estrellasSeleccionadas() === 0) return;

        this.guardandoReview.set(true);
        await this.reviewService.guardarReview(
            this.id(),
            this.estrellasSeleccionadas(),
            this.comentarioTexto()
        );
        this.guardandoReview.set(false);
    }

  toggleFunciones() {
      this.mostrarFunciones.set(!this.mostrarFunciones());
  }

  volverHome() {
    this.router.navigate(['/home']);
  }

  irAReservar(funcionId: string) {
    this.router.navigate(['/pelicula', this.id(), 'reservar', funcionId]);
  }
}