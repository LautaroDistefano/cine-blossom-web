import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReporteService, Venta } from '../../core/services/reporte.service';

interface VentaDia {
    fecha: Date;
    compras: number;
    entradas: number;
    facturado: number;
}

@Component({
    selector: 'app-admin-reportes',
    imports: [DatePipe],
    templateUrl: './admin-reportes.html',
    styleUrl: './admin-reportes.css',
})
export class AdminReportes implements OnInit {
    private reporteService = inject(ReporteService);

    // Por defecto: los últimos 30 días
    desde = signal(this.aInputFecha(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
    hasta = signal(this.aInputFecha(new Date()));

    ventas = signal<Venta[]>([]);
    cargando = signal(false);
    error = signal<string | null>(null);

    // Agrupa las ventas por día (llegan ordenadas de la más vieja a la más nueva)
    ventasPorDia = computed(() => {
        const dias = new Map<string, VentaDia>();

        for (const v of this.ventas()) {
            const clave = this.aInputFecha(v.fecha);
            const dia = dias.get(clave) ?? {
                fecha: new Date(v.fecha.getFullYear(), v.fecha.getMonth(), v.fecha.getDate()),
                compras: 0,
                entradas: 0,
                facturado: 0
            };

            dia.compras += 1;
            dia.entradas += v.butacas.length;  // una entrada por butaca
            dia.facturado += v.precioTotal;
            dias.set(clave, dia);
        }

        return [...dias.values()];
    });

    totalCompras = computed(() => this.ventas().length);
    totalEntradas = computed(() => this.ventas().reduce((suma, v) => suma + v.butacas.length, 0));
    totalFacturado = computed(() => this.ventas().reduce((suma, v) => suma + v.precioTotal, 0));

    async ngOnInit() {
        await this.generar();
    }

    async generar() {
        // Las fechas 'YYYY-MM-DD' se pueden comparar como texto
        if (!this.desde() || !this.hasta() || this.desde() > this.hasta()) {
            this.error.set('Elegí un rango de fechas válido.');
            return;
        }

        this.error.set(null);
        this.cargando.set(true);

        const ventas = await this.reporteService.cargarVentas(this.desde(), this.hasta());

        this.cargando.set(false);

        if (ventas === null) {
            this.error.set('No se pudo cargar el reporte. Probá de nuevo.');
            return;
        }

        this.ventas.set(ventas);
    }

    // Convierte una fecha a 'YYYY-MM-DD' en hora local
    private aInputFecha(fecha: Date): string {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
    }
}