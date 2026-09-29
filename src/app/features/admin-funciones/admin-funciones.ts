// admin-funciones.ts
import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FuncionesService } from '../../core/services/funciones.service';
import { MovieService } from '../../core/services/movie.service';
import { Funcion } from '../../core/models/funcion.interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin-funciones',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './admin-funciones.html',
  styleUrl: './admin-funciones.css',
})
export class AdminFunciones {
  private fb = inject(FormBuilder);
  funcionesService = inject(FuncionesService);
  movieService = inject(MovieService);

  editandoId = signal<string | null>(null);
  guardando = signal(false);
  error = signal<string | null>(null);

  // La sala ya no se elige: la asigna el sistema
  funcionForm = this.fb.group({
    peliculaId: ['', Validators.required],
    horario: ['', Validators.required],
    formato: ['2D', Validators.required],
    idioma: ['castellano', Validators.required],
  });

  // Mapa película -> duración, para poder validar conflictos sin buscar una por una
  private duracionesPorPelicula = computed(() => {
    const mapa = new Map<string, number>();
    for (const p of this.movieService.peliculas()) {
      mapa.set(p.id, p.duracion);
    }
    return mapa;
  });

  async onSubmit() {
    if (this.funcionForm.invalid) return;

    this.error.set(null);
    const valores = this.funcionForm.value;
    const pelicula = this.movieService.peliculas().find(p => p.id === valores.peliculaId);

    if (!pelicula) {
      this.error.set('Seleccioná una película válida.');
      return;
    }

  const horarioISO = new Date(valores.horario!).toISOString();
  const idEditando = this.editandoId();

    // Al editar, se intenta mantener la sala que ya tenía la función
    const salaActual = idEditando
      ? this.funcionesService.funciones().find(f => f.id === idEditando)?.salaId
      : undefined;

    const salaId = this.funcionesService.asignarSalaLibre(
      horarioISO,
      pelicula.duracion,
      this.duracionesPorPelicula(),
      idEditando ?? undefined
    );

    if (salaId === null) {
      this.error.set('No hay ninguna sala libre en ese horario (se requieren 30 min entre funciones).');
      return;
    }

    this.guardando.set(true);

    const funcion: Omit<Funcion, 'id'> = {
      peliculaId: valores.peliculaId!,
      salaId,
      horario: horarioISO,
      formato: valores.formato as any,
      idioma: valores.idioma as any,
    };

    const exito = idEditando
      ? await this.funcionesService.editarFuncion(idEditando, funcion)
      : await this.funcionesService.agregarFuncion(funcion);

    this.guardando.set(false);

    if (exito) {
      this.cancelarEdicion();
    } else {
      this.error.set('Hubo un error al guardar. Probá de nuevo.');
    }
  }

  editar(funcion: Funcion) {
    this.editandoId.set(funcion.id);
    this.funcionForm.setValue({
      peliculaId: funcion.peliculaId,
      horario: this.aFormatoDatetimeLocal(funcion.horario),
      formato: funcion.formato,
      idioma: funcion.idioma,
    });
  }

  cancelarEdicion() {
    this.editandoId.set(null);
    this.error.set(null);
    this.funcionForm.reset({ formato: '2D', idioma: 'castellano' });
  }

  async eliminar(id: string) {
    const confirmar = confirm('¿Seguro que querés eliminar esta función?');
    if (!confirmar) return;
    await this.funcionesService.eliminarFuncion(id);
  }

  nombrePelicula(peliculaId: string): string {
    return this.movieService.peliculas().find(p => p.id === peliculaId)?.nombre ?? '—';
  }

  // Convierte un ISO en UTC a "YYYY-MM-DDTHH:mm" en hora local, que es lo que espera <input type="datetime-local">
  private aFormatoDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}