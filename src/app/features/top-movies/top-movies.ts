import { Component, computed, inject } from '@angular/core';
import { MovieService } from '../../core/services/movie.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { EntradaService } from '../../core/services/entrada.service';
import { MovieCard } from '../../shared/components/movie-card/movie-card';

@Component({
  imports: [MovieCard],
  selector: 'app-top-movies',
  styleUrl: './top-movies.css',
  templateUrl: './top-movies.html',
})
export class TopMovies {
  private movieService = inject(MovieService);
  private funcionesService = inject(FuncionesService);
  private entradaService = inject(EntradaService);

  peliculasMasVendidas = computed(() => {
    const entradas = this.entradaService.entradas();
    const funciones = this.funcionesService.funciones();
    const peliculas = this.movieService.peliculas();

    const conteoPorPelicula = new Map<string, number>();

    for (const entrada of entradas) {
      const funcion = funciones.find(f => f.id === entrada.funcionId);
      if (!funcion) continue;

      const actual = conteoPorPelicula.get(funcion.peliculaId) ?? 0;
      conteoPorPelicula.set(funcion.peliculaId, actual + entrada.butacas.length);
    }

    return [...conteoPorPelicula.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([peliculaId]) => peliculas.find(p => p.id === peliculaId))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
  });
}