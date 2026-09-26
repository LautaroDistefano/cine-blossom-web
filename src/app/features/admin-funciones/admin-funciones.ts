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
  imports: [ReactiveFormsModule,DatePipe],
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

  funcionForm = this.fb.group({
    peliculaId: ['', Validators.required],
    salaId: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
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

    const salaId = Number(valores.salaId);
    const horarioISO = new Date(valores.horario!).toISOString();

    const hayConflicto = this.funcionesService.hayConflictoDeHorario(
      salaId,
      horarioISO,
      pelicula.duracion,
      this.duracionesPorPelicula(),
      this.editandoId() ?? undefined
    );

    if (hayConflicto) {
      this.error.set('Esa sala ya tiene otra función que se superpone (mínimo 30 min entre funciones).');
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

    const id = this.editandoId();
    const exito = id
      ? await this.funcionesService.editarFuncion(id, funcion)
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
      salaId: funcion.salaId,
      horario: funcion.horario.slice(0, 16), // formato requerido por datetime-local
      formato: funcion.formato,
      idioma: funcion.idioma,
    });
  }

  cancelarEdicion() {
    this.editandoId.set(null);
    this.error.set(null);
    this.funcionForm.reset({ salaId: 1, formato: '2D', idioma: 'castellano' });
  }

  async eliminar(id: string) {
    const confirmar = confirm('¿Seguro que querés eliminar esta función?');
    if (!confirmar) return;
    await this.funcionesService.eliminarFuncion(id);
  }

  nombrePelicula(peliculaId: string): string {
    return this.movieService.peliculas().find(p => p.id === peliculaId)?.nombre ?? '—';
  }
}