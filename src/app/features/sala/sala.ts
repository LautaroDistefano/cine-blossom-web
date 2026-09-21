import { Component, computed, inject, input, signal, OnInit } from '@angular/core';
import { SalaService } from '../../core/services/sala.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { MovieService } from '../../core/services/movie.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { EntradaService } from '../../core/services/entrada.service';
import { ProductoCandyBarService } from '../../core/services/producto-candybar.service';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { calcularEdad } from '../../utils/fecha.utils';


@Component({
    imports: [ProductCard, RouterLink, RouterLinkActive],
    selector: 'app-sala',
    styleUrl: './sala.css',
    templateUrl: './sala.html',
})
export class Sala implements OnInit {
    private salaService = inject(SalaService);
    private ticketService = inject(TicketService);
    private entradaService = inject(EntradaService);
    private funcionesService = inject(FuncionesService);
    private movieService = inject(MovieService);
    public authService = inject(AuthService);
    public candyBarService = inject(ProductoCandyBarService);
    private router = inject(Router);
    configuracionService = inject(ConfiguracionService); 

    esPrimeraCompra = signal(false);
    mostrarCandyBar = signal(false);
    reservando = signal(false);
    carritoCandyBar = signal<Map<string, number>>(new Map());
    bannerCerrado = signal(false);

    funcionId = input.required<string>();

    filas = this.salaService.generarFilas();


    filasConButacas = computed(() =>
        this.filas.map(fila => ({
            ...fila,
            bloques: this.salaService.generarBloquesDeFila(fila)
        }))
    );

    butacasSeleccionadas = signal<string[]>([]);

    toggleButaca(codigo: string) {
        this.butacasSeleccionadas.update(actuales =>
            actuales.includes(codigo)
                ? actuales.filter(b => b !== codigo)
                : [...actuales, codigo]
        );
    }

    // --- Candy bar ---

    cantidadDe(productoId: string): number {
        return this.carritoCandyBar().get(productoId) ?? 0;
    }

    agregarAlCarrito(productoId: string) {
        this.carritoCandyBar.update(actual => {
            const nuevo = new Map(actual);
            nuevo.set(productoId, (nuevo.get(productoId) ?? 0) + 1);
            return nuevo;
        });
    }

    quitarDelCarrito(productoId: string) {
        this.carritoCandyBar.update(actual => {
            const nuevo = new Map(actual);
            const actualCant = nuevo.get(productoId) ?? 0;
            if (actualCant <= 1) {
                nuevo.delete(productoId);
            } else {
                nuevo.set(productoId, actualCant - 1);
            }
            return nuevo;
        });
    }

    toggleCandyBar() {
        this.mostrarCandyBar.set(!this.mostrarCandyBar());
    }

    // --- Totales ---

    totalCandyBar = computed(() => {
        const carrito = this.carritoCandyBar();
        const productos = this.candyBarService.productos();
        let total = 0;
        for (const [productoId, cantidad] of carrito) {
            const producto = productos.find(p => p.id === productoId);
            if (producto) total += producto.precio * cantidad;
        }
        return total;
    });

    totalReserva = computed(() => {
        const precioPorButaca = 3000;
        const subtotal = this.butacasSeleccionadas().length * precioPorButaca + this.totalCandyBar();

        if (this.esPrimeraCompra()) {
            const descuento = this.configuracionService.configuracion().descuentoBienvenida;
            return subtotal * (1 - descuento / 100);
        }

        return subtotal;
    });

    // --- Confirmar reserva ---

    async confirmarReserva() {
        // Cargamos las butacas y retornamos en caso de que venga vacia
        const seleccion = this.butacasSeleccionadas();
        if (seleccion.length === 0) return;

        // Buscamos funcion y pelicula antes que todo porque la validacion necesita estos dos datos
        const funcion = this.funcionesService.funciones().find(f => f.id === this.funcionId())!;
        const pelicula = this.movieService.peliculas().find(p => p.id === funcion.peliculaId)!;

        // Validacion de edad(RF19) 
        if (pelicula.restriccionEdad) {
            const fechaNac = this.authService.fechaNacimiento();

            if (!fechaNac) {
                alert(`Esta película es +${pelicula.restriccionEdad}. Necesitás estar registrado y con tu fecha de nacimiento cargada para comprar.`);
                return;
            }

            const edad = calcularEdad(fechaNac);
            if (edad < pelicula.restriccionEdad) {
                alert(`Esta película es +${pelicula.restriccionEdad}. No cumplís la edad mínima para comprar esta entrada.`);
                return;
            }
        }

        this.reservando.set(true);

        const candyBarArray = Array.from(this.carritoCandyBar().entries()).map(([productoId, cantidad]) => {
            const producto = this.candyBarService.productos().find(p => p.id === productoId)!;
            return { productoId, nombre: producto.nombre, cantidad, precioUnitario: producto.precio };
        });

        const resultado = await this.entradaService.reservar(
            this.funcionId(), seleccion, candyBarArray, this.totalReserva()
        );

        this.reservando.set(false);

        if (resultado.exito && resultado.codigoQr) {
            await this.ticketService.generarPdf({
                peliculaNombre: pelicula.nombre,
                horario: funcion.horario,
                formato: funcion.formato,
                idioma: funcion.idioma,
                butacas: seleccion,
                candyBar: candyBarArray,
                total: this.totalReserva(),
                codigoQr: resultado.codigoQr
            });

            this.router.navigate(['/home']);
        } else {
            alert('Hubo un error al confirmar la reserva. Probá de nuevo.');
        }
    }

    async subirDescuento() {
        const actual = this.configuracionService.configuracion().descuentoBienvenida;
        await this.configuracionService.actualizarDescuento(Math.min(100, actual + 5));
    }

    async bajarDescuento() {
        const actual = this.configuracionService.configuracion().descuentoBienvenida;
        await this.configuracionService.actualizarDescuento(Math.max(0, actual - 5));
    }

    async ngOnInit() {
        this.salaService.cargarButacasOcupadas(this.funcionId());

        const usuario = this.authService.currentUser();
        if (usuario) {
            const primera = await this.entradaService.esPrimeraCompra(usuario.id);
            this.esPrimeraCompra.set(primera);
        }
    }

    volverHome() {
        this.router.navigate(['/home']);
    }
}