import { Component, computed, inject, input, signal, OnInit, OnDestroy } from '@angular/core';
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
import { PuntosService } from '../../core/services/puntos.service';
import { CuponService } from '../../core/services/cupon.service';
import { Cupon } from '../../core/models/cupon.interface';


@Component({
    imports: [ProductCard, RouterLink, RouterLinkActive],
    selector: 'app-sala',
    styleUrl: './sala.css',
    templateUrl: './sala.html',
})
export class Sala implements OnInit, OnDestroy {
    private salaService = inject(SalaService);
    private ticketService = inject(TicketService);
    private entradaService = inject(EntradaService);
    private funcionesService = inject(FuncionesService);
    private movieService = inject(MovieService);
    public authService = inject(AuthService);
    public candyBarService = inject(ProductoCandyBarService);
    private router = inject(Router);
    public puntosService = inject(PuntosService);
    configuracionService = inject(ConfiguracionService); 
    private cuponService = inject(CuponService);

    esPrimeraCompra = signal(false);
    mostrarCandyBar = signal(false);
    reservando = signal(false);
    carritoCandyBar = signal<Map<string, number>>(new Map());
    bannerCerrado = signal(false);
    cuponAplicado = signal<Cupon | null>(null);
    codigoCupon = signal('');

    // Productos ya pagados con puntos: no se cobran en pesos
    canjeados = signal<Map<string, number>>(new Map());

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

    descuentoBienvenida = computed(() =>
        this.esPrimeraCompra() ? this.configuracionService.configuracion().descuentoBienvenida : 0
    );

    descuentoCupon = computed(() => this.cuponAplicado()?.porcentaje ?? 0);

    // No se acumulan: se aplica el mayor
    descuentoAplicado = computed(() => Math.max(this.descuentoBienvenida(), this.descuentoCupon()));

    totalReserva = computed(() => {
        const precioPorButaca = 3000;
        const subtotal = this.butacasSeleccionadas().length * precioPorButaca + this.totalCandyBar();
        return subtotal * (1 - this.descuentoAplicado() / 100);
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

        // Los productos canjeados con puntos salen en la entrada con precio 0
        for (const [productoId, cantidad] of this.canjeados()) {
            const producto = this.candyBarService.productos().find(p => p.id === productoId)!;
            candyBarArray.push({
                productoId,
                nombre: `${producto.nombre} (canjeado)`,
                cantidad,
                precioUnitario: 0
            });
        }

        // Recién ahora se gastan los puntos marcados
        if (this.puntosEnUso() > 0) {
            const descripcion = `Canje en ${pelicula.nombre}`;
            const canjeOk = await this.puntosService.canjear(descripcion, this.puntosEnUso());

            if (!canjeOk) {
                this.reservando.set(false);
                alert('No se pudieron usar los puntos. Probá de nuevo.');
                return;
            }
        }

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
            await this.puntosService.cargarPuntos();
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

    // --- PUNTOS ---
    // Puntos que el usuario marcó para gastar, pero todavía no se gastaron
    puntosEnUso = computed(() => {
        const productos = this.candyBarService.productos();
        let total = 0;
        for (const [productoId, cantidad] of this.canjeados()) {
            const producto = productos.find(p => p.id === productoId);
            total += (producto?.costoPuntos ?? 0) * cantidad;
        }
        return total;
    });

    canjearProducto(productoId: string) {
        const producto = this.candyBarService.productos().find(p => p.id === productoId);
        if (!producto || producto.costoPuntos == null) return;

        if (!this.authService.currentUser()) {
            alert('Tenés que iniciar sesión para canjear puntos.');
            return;
        }

        // Puntos que le quedan libres, sin contar lo que ya marcó
        const libres = this.puntosService.puntosDisponibles() - this.puntosEnUso();
        if (libres < producto.costoPuntos) {
            alert('No te alcanzan los puntos para canjear este producto.');
            return;
        }

        this.canjeados.update(actual => {
            const nuevo = new Map(actual);
            nuevo.set(productoId, (nuevo.get(productoId) ?? 0) + 1);
            return nuevo;
        });
    }

    quitarCanje(productoId: string) {
        this.canjeados.update(actual => {
            const nuevo = new Map(actual);
            const cantidad = nuevo.get(productoId) ?? 0;
            if (cantidad <= 1) {
                nuevo.delete(productoId);
            } else {
                nuevo.set(productoId, cantidad - 1);
            }
            return nuevo;
        });
    }

    // --- CUPONES ---
    async aplicarCupon() {
        const codigo = this.codigoCupon().trim();
        if (!codigo) return;

        const cupon = await this.cuponService.buscar(codigo);
        if (!cupon) {
            alert('El cupón no existe o no está activo.');
            return;
        }

        // Cupón segmentado: se revisa la edad, igual que en la validación de RF19
        if (cupon.edadMinima != null) {
            const fechaNac = this.authService.fechaNacimiento();

            if (!fechaNac) {
                alert(`Este cupón es para mayores de ${cupon.edadMinima}. Iniciá sesión con tu fecha de nacimiento cargada.`);
                return;
            }
            if (calcularEdad(fechaNac) < cupon.edadMinima) {
                alert(`Este cupón es solo para mayores de ${cupon.edadMinima}.`);
                return;
            }
        }

        this.cuponAplicado.set(cupon);
    }

    quitarCupon() {
        this.cuponAplicado.set(null);
        this.codigoCupon.set('');
    }

    async ngOnInit() {
        // Primero cargamos las butacas que ya están ocupadas
        await this.salaService.cargarButacasOcupadas(this.funcionId());

        // Después nos quedamos escuchando las compras nuevas
        this.salaService.escucharButacas(this.funcionId());

        const usuario = this.authService.currentUser();
        if (usuario) {
            const primera = await this.entradaService.esPrimeraCompra(usuario.id);
            this.esPrimeraCompra.set(primera);
        }
    }

    ngOnDestroy() {
    // Al salir de la pantalla, cortamos la conexión
    this.salaService.dejarDeEscuchar();
    }

    volverHome() {
        this.router.navigate(['/home']);
    }
}