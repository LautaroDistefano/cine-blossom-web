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

    constructor() {
        // Cada vez que cambia el usuario (login o logout), se recalculan los puntos
        effect(() => {
            this.authService.currentUser();
            this.cargarPuntos();
        });
    }

    // Lo que puede usar ahora
    puntosDisponibles = computed(() => this.puntosGanados() - this.puntosGastados());

    async cargarPuntos(): Promise<void> {
        const usuarioId = this.authService.currentUser()?.id;

        // Si no hay usuario logueado, todo queda en cero
        if (!usuarioId) {
            this.puntosGanados.set(0);
            this.puntosGastados.set(0);
            this.canjes.set([]);
            return;
        }

        // 1. Sumamos lo que pagó en sus entradas
        const { data: entradas, error: errorEntradas } = await this.supabase
            .from('entradas')
            .select('precio_total')
            .eq('usuario_id', usuarioId);

        if (errorEntradas) {
            console.error('Error al cargar entradas del usuario:', errorEntradas);
            return;
        }

        const ganados = (entradas ?? []).reduce(
            (suma, e) => suma + Math.floor(Number(e.precio_total)),
            0
        );

        // 2. Traemos sus canjes
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