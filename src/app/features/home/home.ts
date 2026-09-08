import { Component, computed, signal } from '@angular/core';
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
  constructor(private router:Router, private movieService:MovieService){}

  filtroBarraBusqueda = signal('')

  peliculasFiltradas = computed(() => {
    const palabra = this.filtroBarraBusqueda().toLowerCase();
    if(!palabra){
      return this.movieService.peliculas();
    }
    return this.movieService.peliculas().filter(libro => 
      libro.nombre.toLowerCase().includes(palabra) || 
      libro.nombre.toLowerCase().includes(palabra)
    )
  })

  verDetalles(libroId:string){
    this.router.navigate(["pelicula", libroId])
  }

}
