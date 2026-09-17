import { Component, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MovieService } from '../../core/services/movie.service';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import { SearchBar } from '../../shared/components/search-bar/search-bar';
import { MovieFilterGenre } from '../../shared/components/movie-filter-genre/movie-filter-genre';
import { TopMovies } from '../top-movies/top-movies';
@Component({
  imports: [MovieCard, SearchBar, MovieFilterGenre, TopMovies],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  private router = inject(Router);
  private movieService = inject(MovieService);

  filtroBarraBusqueda = signal('');
  generoSeleccionado = signal('');

  // El select de géneros disponibles lo arma MovieFilterGenre,
  // pero la lista de opciones sale de acá (ya la tenés en MovieService)
  generosDisponibles = this.movieService.generosDisponibles;

  peliculasFiltradas = computed(() => {
    const palabra = this.filtroBarraBusqueda().toLowerCase();
    const genero = this.generoSeleccionado();

    return this.movieService.peliculas().filter(pelicula => {
      const matchTexto = !palabra || pelicula.nombre.toLowerCase().includes(palabra);
      const matchGenero = !genero || pelicula.generos.includes(genero);
      return matchTexto && matchGenero;
    });
  });

  verDetalles(peliculaId: string) {
    this.router.navigate(['/pelicula', peliculaId]);
  }
}