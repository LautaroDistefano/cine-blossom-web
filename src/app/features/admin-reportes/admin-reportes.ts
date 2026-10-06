import { Component, ElementRef, OnDestroy, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { ReporteService, Venta } from '../../core/services/reporte.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { MovieService } from '../../core/services/movie.service';

// La libreria de chart.js necesita, de forma explicita, una aclaracion de que graficos vamos a usar
Chart.register(...registerables);
Chart.defaults.color = '#f2e9d8'; //Refiere a los numeros del eje X e Y
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';

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
export class AdminReportes implements OnInit, OnDestroy {
    private reporteService = inject(ReporteService);
    private funcionesService = inject(FuncionesService);
    private movieService = inject(MovieService);

    // Por defecto: los últimos 30 días
    desde = signal(this.aInputFecha(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
    hasta = signal(this.aInputFecha(new Date()));

    ventas = signal<Venta[]>([]);
    cargando = signal(false);
    error = signal<string | null>(null);

    // Agrupa las ventas por día (ordenadas desde la mas vieja a la mas actual)
    ventasPorDia = computed(() => { 
        const dias = new Map<string, VentaDia>(); //Clave: 2026-10-05, valor VentaDia

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

    
    // Datos de nuestros graficos
    // Película -> entradas vendidas (las 5 primeras)
    peliculasMasVistas = computed(() => {
        const funciones = this.funcionesService.funciones();
        const peliculas = this.movieService.peliculas();
        const conteo = new Map<string, number>();

        for (const v of this.ventas()) {
            // Cada compra apunta a una función, y cada función a una película
            const funcion = funciones.find(f => f.id === v.funcionId);
            const nombre = peliculas.find(p => p.id === funcion?.peliculaId)?.nombre ?? 'Sin datos';
            conteo.set(nombre, (conteo.get(nombre) ?? 0) + v.butacas.length);
        }

        return this.topCinco(conteo);
    });

    // Producto -> unidades vendidas (los 5 primeros)
    productosMasVendidos = computed(() => {
        const conteo = new Map<string, number>();

        for (const v of this.ventas()) {
            for (const item of v.candyBar) {
                // Los canjeados con puntos se cuentan junto con el producto normal
                const nombre = item.nombre.replace(' (canjeado)', '');
                conteo.set(nombre, (conteo.get(nombre) ?? 0) + item.cantidad);
            }
        }

        return this.topCinco(conteo);
    });

    // Referencias a los tres <canvas> del HTML, donde se dibujan los gráficos
    canvasDias = viewChild<ElementRef<HTMLCanvasElement>>('canvasDias');
    canvasPeliculas = viewChild<ElementRef<HTMLCanvasElement>>('canvasPeliculas');
    canvasProductos = viewChild<ElementRef<HTMLCanvasElement>>('canvasProductos');

    // Guardamos los gráficos dibujados para poder borrarlos antes de dibujar de nuevo
    private graficos = new Map<string, Chart>();

    constructor() {
        // Se ejecuta solo cuando cambian los datos o cuando los canvas ya existen
        effect(() => {
            const dias = this.ventasPorDia();
            const peliculas = this.peliculasMasVistas();
            const productos = this.productosMasVendidos();
            const lienzoDias = this.canvasDias();
            const lienzoPeliculas = this.canvasPeliculas();
            const lienzoProductos = this.canvasProductos();

            if (!lienzoDias || !lienzoPeliculas || !lienzoProductos) return;

            this.dibujar('dias', lienzoDias.nativeElement,
                dias.map(d => d.fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })),
                dias.map(d => d.entradas),
                'Entradas');

            this.dibujar('peliculas', lienzoPeliculas.nativeElement,
                peliculas.map(p => p[0]),
                peliculas.map(p => p[1]),
                'Entradas');

            this.dibujar('productos', lienzoProductos.nativeElement,
                productos.map(p => p[0]),
                productos.map(p => p[1]),
                'Unidades');
        });
    }

    async ngOnInit() {
        await this.generar();
    }

    ngOnDestroy() {
        // Al salir de la pantalla, liberamos los gráficos
        this.graficos.forEach(grafico => grafico.destroy());
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

    // Nuestros botones de ultima semana y ultimo mes se evaluan aca
    async ultimosDias(dias: number) {
        // Se resta (dias - 1) porque el rango incluye el día de hoy
        this.desde.set(this.aInputFecha(new Date(Date.now() - (dias - 1) * 24 * 60 * 60 * 1000)));
        this.hasta.set(this.aInputFecha(new Date()));
        await this.generar();
    }

    // Ordenamos de mayor a menor y despues hacemos un slice para quedarnos con los primeros 5
    private topCinco(conteo: Map<string, number>): [string, number][] {
        return [...conteo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    }

    // Grafico de barras
    private dibujar(clave: string, canvas: HTMLCanvasElement, etiquetas: string[], datos: number[], titulo: string) {
    // clave:     nombre para encontrar este gráfico después ('dias', 'peliculas' o 'productos')
    // canvas:    el elemento <canvas> del HTML donde se va a dibujar
    // etiquetas: los textos del eje horizontal (días, nombres de películas, productos)
    // datos:     los números que definen la altura de cada barra
    // titulo:    cómo se llama la serie de datos (aparece al pasar el mouse por una barra)

        // Si ya había un gráfico en ese canvas, lo borramos primero
        this.graficos.get(clave)?.destroy();

        this.graficos.set(clave, new Chart(canvas, {
            type: 'bar',
            data: {
                labels: etiquetas,
                datasets: [{ label: titulo, 
                    data: datos, 
                    backgroundColor: '#c9a227' }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        }));
    }

    // Convierte una fecha a 'YYYY-MM-DD' en hora local
    private aInputFecha(fecha: Date): string {

        // Función auxiliar: convierte un número en string de 2 dígitos,
        // rellenando con un 0 a la izquierda si hace falta.
        // pad(5)  -> "05"
        // pad(12) -> "12"
        const pad = (n: number) => String(n).padStart(2, '0');

        return `${fecha.getFullYear()}` // Año con cuatro digitos
            + `-${pad(fecha.getMonth() + 1)}`// getMonth va de 0 a 11, por eso usamos +1
            + `-${pad(fecha.getDate())}`;// Dia del mes
    }
}