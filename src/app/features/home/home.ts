import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MovieService } from '../../core/services/movie.service';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import { SearchBar } from '../../shared/components/search-bar/search-bar';

@Component({
  imports: [MovieCard, SearchBar],
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
