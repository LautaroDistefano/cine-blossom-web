// puntos.service.ts
import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Canje {
    id: string;
    descripcion: string;
    puntosGastados: number;
    fecha: string;
}

interface CanjeRow {
    id: string;
    descripcion: string;
    puntos_gastados: number;
    created_at: string;
}

@Injectable({ providedIn: 'root' })
export class PuntosService {
    private supabase = inject(SupabaseService).client;
    private authService = inject(AuthService);

    // Puntos ganados: 1 por cada peso pagado en sus entradas
    puntosGanados = signal(0);
    // Puntos que ya gastó en canjes
    puntosGastados = signal(0);
    // Historial de canjes (RF04)
    canjes = signal<Canje[]>([]);
    creditosDisponibles = signal(0);

    constructor() {
        // Cada vez que cambia el usuario (login o logout), se recalculan los puntos
        effect(() => {
            this.authService.currentUser();
            this.cargarPuntos();
        });
    }

    // Lo que puede usar ahora
    puntosDisponibles = computed(() => Math.max(0, this.puntosGanados() - this.puntosGastados()));

    async cargarPuntos(): Promise<void> {
        // 1. Tenemos usuario?, si no hay entonces dejamos todo en cero y salimos
        const usuarioId = this.authService.currentUser()?.id;

        if (!usuarioId) {
            this.puntosGanados.set(0);
            this.puntosGastados.set(0);
            this.creditosDisponibles.set(0);
            this.canjes.set([]);
            return;
        }

        // 2. Realizamos una consulta a supabase para traernos las compras de este usuario.
        // Una sola consulta sirve para calcular los puntos Y los créditos.
        const { data: entradas, error: errorEntradas } = await this.supabase
            .from('entradas')
            .select('precio_total, creditos_usados, cancelada')
            .eq('usuario_id', usuarioId);

        if (errorEntradas) {
            console.error('Error al cargar entradas del usuario:', errorEntradas);
            return;
        }

        // 3. Tres acumuladores, que arrancan en cero:
        let ganados = 0;     // PUNTOS: pesos pagados en compras que NO se cancelaron
        let recuperado = 0;  // CRÉDITOS: total de las compras que SÍ se cancelaron
        let usado = 0;       // CRÉDITOS: lo que ya se gastó pagando compras con créditos

        // 4. Recorremos las compras una por una
        for (const e of entradas ?? []) {
            const total = Number(e.precio_total);        // total de la compra
            const creditos = Number(e.creditos_usados);  // cuánto se pagó con créditos
            usado += creditos;                           // esto vale para TODAS las compras

            if (e.cancelada) {
                // Compra cancelada: su total se devuelve como crédito
                recuperado += total;
            } else {
                // Compra activa: suma puntos, pero solo por lo que se pagó en pesos
                // (al total le sacamos lo que se pagó con créditos)
                ganados += Math.floor(total - creditos); // Redondea al entero menor ej: (5.9 -> 5)
            }
        }

        // 5. Ahora pedimos los canjes del usuario (los puntos que ya gastó)
        const { data: canjes, error: errorCanjes } = await this.supabase
            .from('canjes')
            .select('*')
            .eq('usuario_id', usuarioId)
            .order('created_at', { ascending: false });

        if (errorCanjes) {
            console.error('Error al cargar canjes:', errorCanjes);
            return;
        }

        // 6. Convertimos las filas de la base de datos al formato que usa la app
        const lista = (canjes as CanjeRow[]).map(row => ({
            id: row.id,
            descripcion: row.descripcion,
            puntosGastados: row.puntos_gastados,
            fecha: row.created_at
        }));

        // 7. Guardamos los resultados en los signals, y la pantalla se actualiza sola
        this.puntosGanados.set(ganados);                 // puntos ganados
        this.creditosDisponibles.set(recuperado - usado); // CRÉDITOS = recuperado - usado
        this.canjes.set(lista);                          // historial de canjes
        this.puntosGastados.set(lista.reduce((suma, c) => suma + c.puntosGastados, 0)); // puntos gastados
        // Los puntos disponibles (ganados - gastados) los calcula otro signal, puntosDisponibles
    }

    // Registra un canje. Devuelve false si no alcanzan los puntos o si hubo un error.
    async canjear(descripcion: string, puntos: number): Promise<boolean> {
        const usuarioId = this.authService.currentUser()?.id;
        if (!usuarioId || puntos <= 0) return false;

        // Si no le alcanzan los puntos, no seguimos
        if (puntos > this.puntosDisponibles()) return false;

        const { error } = await this.supabase.from('canjes').insert({
            usuario_id: usuarioId,
            descripcion,
            puntos_gastados: puntos
        });

        if (error) {
            console.error('Error al registrar el canje:', error);
            return false;
        }

        await this.cargarPuntos();
        return true;
    }
}