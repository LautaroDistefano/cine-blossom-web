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
        const usuarioId = this.authService.currentUser()?.id;

        if (!usuarioId) {
            this.puntosGanados.set(0);
            this.puntosGastados.set(0);
            this.creditosDisponibles.set(0);
            this.canjes.set([]);
            return;
        }

        const { data: entradas, error: errorEntradas } = await this.supabase
            .from('entradas')
            .select('precio_total, creditos_usados, cancelada')
            .eq('usuario_id', usuarioId);

        if (errorEntradas) {
            console.error('Error al cargar entradas del usuario:', errorEntradas);
            return;
        }

        let ganados = 0;     // puntos: pesos pagados en compras no canceladas
        let recuperado = 0;  // créditos: total de las compras canceladas
        let usado = 0;       // créditos ya gastados en compras nuevas

        for (const e of entradas ?? []) {
            const total = Number(e.precio_total);
            const creditos = Number(e.creditos_usados);
            usado += creditos;

            if (e.cancelada) {
                recuperado += total;
            } else {
                ganados += Math.floor(total - creditos);
            }
        }

        const { data: canjes, error: errorCanjes } = await this.supabase
            .from('canjes')
            .select('*')
            .eq('usuario_id', usuarioId)
            .order('created_at', { ascending: false });

        if (errorCanjes) {
            console.error('Error al cargar canjes:', errorCanjes);
            return;
        }

        const lista = (canjes as CanjeRow[]).map(row => ({
            id: row.id,
            descripcion: row.descripcion,
            puntosGastados: row.puntos_gastados,
            fecha: row.created_at
        }));

        this.puntosGanados.set(ganados);
        this.creditosDisponibles.set(recuperado - usado);
        this.canjes.set(lista);
        this.puntosGastados.set(lista.reduce((suma, c) => suma + c.puntosGastados, 0));
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