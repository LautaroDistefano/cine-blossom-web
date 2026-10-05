// validar-entrada.ts
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Html5Qrcode } from 'html5-qrcode';
import { EntradaService, ResultadoValidacion } from '../../core/services/entrada.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { MovieService } from '../../core/services/movie.service';

@Component({
    selector: 'app-validar-entrada',
    imports: [DatePipe],
    templateUrl: './validar-entrada.html',
    styleUrl: './validar-entrada.css',
})
export class ValidarEntrada implements OnDestroy {
    private entradaService = inject(EntradaService);
    private funcionesService = inject(FuncionesService);
    private movieService = inject(MovieService);

    codigo = signal('');
    validando = signal(false);
    resultado = signal<ResultadoValidacion | null>(null);

    camaraActiva = signal(false);
    private escaner: Html5Qrcode | null = null;

    async validar() {
        // Si no escribió nada, no hacemos nada
        if (!this.codigo().trim()) return;

        this.validando.set(true);
        this.resultado.set(null)
        const respuesta = await this.entradaService.validarCodigo(this.codigo());
        this.resultado.set(respuesta);
        this.validando.set(false);

        // Si salió bien, limpiamos el campo para el próximo código
        if (respuesta.estado === 'valida') {
            this.codigo.set('');
        }
    }

    // --- Cámara ---

    async activarCamara() {
        this.camaraActiva.set(true);
        this.escaner = new Html5Qrcode('lector-qr');

        try {
            await this.escaner.start(
                { facingMode: 'environment' }, // cámara trasera en el celular
                { fps: 10, qrbox: 250 },
                async (texto) => {
                    // Si ya leyó un código, ignora las lecturas repetidas
                    if (!this.camaraActiva()) return;

                    await this.detenerCamara();
                    this.codigo.set(texto);   // el texto del QR es el código de la entrada
                    await this.validar();     // se usa la misma validación de siempre
                },
                () => {} // se llama en cada imagen sin QR, no hace falta hacer nada
            );
        } catch (error) {
            console.error('No se pudo abrir la cámara:', error);
            this.camaraActiva.set(false);
            this.escaner = null;
            alert('No se pudo acceder a la cámara. Revisá los permisos del navegador.');
        }
    }

    async detenerCamara() {
        this.camaraActiva.set(false);
        if (this.escaner) {
            try {
                await this.escaner.stop();
                this.escaner.clear();
            } catch (error) {
                console.error('Error al cerrar la cámara:', error);
            }
            this.escaner = null;
        }
    }

    // Si el empleado cambia de pantalla, apagamos la cámara
    ngOnDestroy() {
        this.detenerCamara();
    }

    // --- Datos para mostrar ---

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