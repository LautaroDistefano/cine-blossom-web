import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

interface EntradaRow {
    id: string;
    funcion_id: string;
    usuario_id: string | null;
    butacas: string[];
    candy_bar: any;
    precio_total: number;
    codigo_qr: string | null;
    created_at: string;
}

export interface Entrada {
    id: string;
    funcionId: string;
    usuarioId: string | null;
    butacas: string[];
    precioTotal: number;
}

@Injectable({ providedIn: 'root' })
export class EntradaService {
    private supabase = inject(SupabaseService).client;
    private authService = inject(AuthService);

    private entradasSignal = signal<Entrada[]>([]);
    entradas = computed(() => this.entradasSignal());

    constructor() {
        this.cargarEntradas();
    }

    async cargarEntradas(): Promise<void> {
        const { data, error } = await this.supabase.from('entradas').select('*');

        if (error) {
            console.error('Error al cargar entradas:', error);
            return;
        }

        const entradas = (data as EntradaRow[]).map(row => ({
            id: row.id,
            funcionId: row.funcion_id,
            usuarioId: row.usuario_id,
            butacas: row.butacas,
            precioTotal: row.precio_total
        }));

        this.entradasSignal.set(entradas);
    }

    async reservar(funcionId: string, butacas: string[], candyBar: any[], precioTotal: number): Promise<{ exito: boolean; codigoQr?: string }> {
        const usuarioId = this.authService.currentUser()?.id ?? null;
        const codigoQr = crypto.randomUUID();

        const { error } = await this.supabase.from('entradas').insert({
            funcion_id: funcionId,
            usuario_id: usuarioId,
            butacas: butacas,
            candy_bar: candyBar,
            precio_total: precioTotal,
            codigo_qr: codigoQr
        });

        if (error) {
            console.error('Error al reservar:', error);
            return { exito: false };
        }

        await this.cargarEntradas(); // refrescamos para que "mas vendidas" se actualice
        return { exito: true, codigoQr };
    }

    async esPrimeraCompra(usuarioId: string): Promise<boolean> {
        const { count, error } = await this.supabase
            .from('entradas')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuarioId);

        if (error) {
            console.error('Error al verificar compras previas:', error);
            return false; // ante la duda, no aplicar descuento
        }

        return count === 0;
    }
}