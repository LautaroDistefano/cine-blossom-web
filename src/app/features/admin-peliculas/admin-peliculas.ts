// admin-peliculas.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MovieService } from '../../core/services/movie.service';
import { Movie } from '../../core/models/movie.interface';

@Component({
  selector: 'app-admin-peliculas',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-peliculas.html',
  styleUrl: './admin-peliculas.css',
})
export class AdminPeliculas {
  private fb = inject(FormBuilder);
  movieService = inject(MovieService);

  editandoId = signal<string | null>(null);

  guardando = signal(false);
  error = signal<string | null>(null);

  peliculaForm = this.fb.group({
    nombre: ['', Validators.required],
    sinopsis: ['', Validators.required],
    duracion: [0, [Validators.required, Validators.min(1)]],
    imagen: ['', Validators.required],
    generos: ['', Validators.required],
    restriccionEdad: [null as (13 | 18 | null)],
    fechaEstreno: ['', Validators.required],
  });

  async onSubmit() {
    if (this.peliculaForm.invalid) return;

    this.guardando.set(true);
    this.error.set(null);

    const valores = this.peliculaForm.value;
    const pelicula: Omit<Movie, 'id'> = {
      nombre: valores.nombre!,
      sinopsis: valores.sinopsis!,
      duracion: Number(valores.duracion),
      imagen: valores.imagen!,
      generos: valores.generos!.split(',').map(g => g.trim()).filter(g => g),
      restriccionEdad: valores.restriccionEdad ?? null,
      fechaEstreno: valores.fechaEstreno!,
    };

    const id = this.editandoId();
    const exito = id
      ? await this.movieService.editarPelicula(id, pelicula)
      : await this.movieService.agregarPelicula(pelicula);

    this.guardando.set(false);

    if (exito) {
      this.cancelarEdicion();
    } else {
      this.error.set('Hubo un error al guardar. Probá de nuevo.');
    }
  }

  editar(pelicula: Movie) {
    this.editandoId.set(pelicula.id);
    this.peliculaForm.setValue({
      nombre: pelicula.nombre,
      sinopsis: pelicula.sinopsis,
      duracion: pelicula.duracion,
      imagen: pelicula.imagen,
      generos: pelicula.generos.join(', '),
      restriccionEdad: pelicula.restriccionEdad,
      fechaEstreno: pelicula.fechaEstreno,
    });
  }

  cancelarEdicion() {
    this.editandoId.set(null);
    this.peliculaForm.reset({ duracion: 0, restriccionEdad: null });
  }

  async eliminar(id: string) {
    const confirmar = confirm('¿Seguro que querés eliminar esta película?');
    if (!confirmar) return;

    await this.movieService.eliminarPelicula(id);
  }
}