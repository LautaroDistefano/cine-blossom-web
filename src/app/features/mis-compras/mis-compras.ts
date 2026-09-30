import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EntradaService, Compra } from '../../core/services/entrada.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { MovieService } from '../../core/services/movie.service';
import { PuntosService } from '../../core/services/puntos.service';

@Component({
    imports: [DatePipe],
    selector: 'app-mis-compras',
    templateUrl: './mis-compras.html',
    styleUrl: './mis-compras.css',
})
export class MisCompras implements OnInit {
    private entradaService = inject(EntradaService);
    private funcionesService = inject(FuncionesService);
    private movieService = inject(MovieService);
    puntosService = inject(PuntosService);

    compras = signal<Compra[]>([]);
    cargando = signal(true);

    async ngOnInit() {
        await this.cargar();
    }

    private async cargar() {
        this.compras.set(await this.entradaService.obtenerMisCompras());
        this.cargando.set(false);
    }

    nombrePelicula(funcionId: string): string {
        const funcion = this.funcionesService.funciones().find(f => f.id === funcionId);
        if (!funcion) return '—';
        return this.movieService.peliculas().find(p => p.id === funcion.peliculaId)?.nombre ?? '—';
    }

    horario(funcionId: string): string | undefined {
        return this.funcionesService.funciones().find(f => f.id === funcionId)?.horario;
    }

    // Se puede cancelar si no está cancelada, no se usó y faltan más de 2 horas (120 min)
    puedeCancelar(compra: Compra): boolean {
        if (compra.cancelada || compra.validada) return false;

        const funcion = this.funcionesService.funciones().find(f => f.id === compra.funcionId);
        if (!funcion) return false;

        const minutosRestantes = (new Date(funcion.horario).getTime() - Date.now()) / 60000;
        return minutosRestantes > 120;
    }

    motivoNoCancelable(compra: Compra): string {
        if (compra.cancelada) return 'Compra cancelada';
        if (compra.validada) return 'Ya fue usada';
        return 'Faltan menos de 2 horas para la función';
    }

    async cancelar(compra: Compra) {
        if (!this.puedeCancelar(compra)) {
            alert(this.motivoNoCancelable(compra));
            return;
        }

        const confirmar = confirm(`¿Cancelar esta compra? Vas a recibir $${compra.precioTotal} como crédito.`);
        if (!confirmar) return;

        const ok = await this.entradaService.cancelarCompra(compra.id);
        if (!ok) {
            alert('No se pudo cancelar la compra. Probá de nuevo.');
            return;
        }

        // Actualiza los créditos y los puntos que se ven en pantalla
        await this.puntosService.cargarPuntos();
        await this.cargar();
    }
}