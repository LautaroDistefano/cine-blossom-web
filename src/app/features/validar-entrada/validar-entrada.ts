// validar-entrada.ts
import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EntradaService, ResultadoValidacion } from '../../core/services/entrada.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { MovieService } from '../../core/services/movie.service';

@Component({
    selector: 'app-validar-entrada',
    imports: [DatePipe],
    templateUrl: './validar-entrada.html',
    styleUrl: './validar-entrada.css',
})
export class ValidarEntrada {
    private entradaService = inject(EntradaService);
    private funcionesService = inject(FuncionesService);
    private movieService = inject(MovieService);

    codigo = signal('');
    validando = signal(false);
    resultado = signal<ResultadoValidacion | null>(null);

    async validar() {
        // Si no escribió nada, no hacemos nada
        if (!this.codigo().trim()) return;

        this.validando.set(true);
        const respuesta = await this.entradaService.validarCodigo(this.codigo());
        this.resultado.set(respuesta);
        this.validando.set(false);

        // Si salió bien, limpiamos el campo para el próximo código
        if (respuesta.estado === 'valida') {
            this.codigo.set('');
        }
    }

    // Busca la película de una función para mostrar su nombre
    nombrePelicula(funcionId: string): string {
        const funcion = this.funcionesService.funciones().find(f => f.id === funcionId);
        if (!funcion) return '—';
        return this.movieService.peliculas().find(p => p.id === funcion.peliculaId)?.nombre ?? '—';
    }

    horarioFuncion(funcionId: string): string | undefined {
        return this.funcionesService.funciones().find(f => f.id === funcionId)?.horario;
    }
}