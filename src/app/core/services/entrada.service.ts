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
    validada: boolean | null;
    cancelada: boolean;
    creditos_usados: number;
}

export interface Entrada {
    id: string;
    funcionId: string;
    usuarioId: string | null;
    butacas: string[];
    precioTotal: number;
}

export interface EntradaValidada {
    funcionId: string;
    butacas: string[];
    candyBar: { nombre: string; cantidad: number }[];
}

export interface ResultadoValidacion {
    estado: 'valida' | 'ya_usada' | 'inexistente' | 'cancelada' | 'error';
    entrada?: EntradaValidada;
}

export interface Compra {
    id: string;
    funcionId: string;
    butacas: string[];
    precioTotal: number;
    validada: boolean;
    cancelada: boolean;
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
        const { data, error } = await this.supabase.from('entradas').select('*').eq('cancelada', false);

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

    async reservar(funcionId: string, butacas: string[], candyBar: any[], precioTotal: number, creditosUsados = 0): Promise<{ exito: boolean; codigoQr?: string }> {
        const usuarioId = this.authService.currentUser()?.id ?? null;
        const codigoQr = crypto.randomUUID().slice(0, 8).toUpperCase();

        const { error } = await this.supabase.from('entradas').insert({
            funcion_id: funcionId,
            usuario_id: usuarioId,
            butacas: butacas,
            candy_bar: candyBar,
            precio_total: precioTotal,
            creditos_usados: creditosUsados,
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
            .eq('usuario_id', usuarioId)
            .eq('cancelada', false);

        if (error) {
            console.error('Error al verificar compras previas:', error);
            return false; // ante la duda, no aplicar descuento
        }

        return count === 0;
    }

    async validarCodigo(codigo: string): Promise<ResultadoValidacion> {
        // 1. Buscamos la entrada con ese código
        const { data, error } = await this.supabase
            .from('entradas')
            .select('*')
            .eq('codigo_qr', codigo.trim())
            .maybeSingle();

        if (error) {
            console.error('Error al buscar la entrada:', error);
            return { estado: 'error' };
        }

        // 2. Si no existe, avisamos
        if (!data) {
            return { estado: 'inexistente' };
        }

        // 3. Si cancela la compra, modificamos el estado
        if (data.cancelada) {
            return { estado: 'cancelada' };
        }

        const entrada: EntradaValidada = {
            funcionId: data.funcion_id,
            butacas: data.butacas,
            candyBar: data.candy_bar ?? []
        };

        // 3. Si ya se usó, no se puede volver a usar
        if (data.validada) {
            return { estado: 'ya_usada', entrada };
        }

        // 4. Si está libre, la marcamos como usada
        const { data: actualizadas, error: errorUpdate } = await this.supabase
            .from('entradas')
            .update({ validada: true })
            .eq('id', data.id)
            .select();

        // Si no se actualizó ninguna fila, casi seguro falta la política de Supabase (ver paso 5)
        if (errorUpdate || !actualizadas || actualizadas.length === 0) {
            console.error('No se pudo marcar la entrada como usada:', errorUpdate);
            return { estado: 'error' };
        }

        return { estado: 'valida', entrada };
    }

    async obtenerMisCompras(): Promise<Compra[]> {
        const usuarioId = this.authService.currentUser()?.id;
        if (!usuarioId) return [];

        const { data, error } = await this.supabase
            .from('entradas')
            .select('*')
            .eq('usuario_id', usuarioId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar mis compras:', error);
            return [];
        }

        return (data as EntradaRow[]).map(row => ({
            id: row.id,
            funcionId: row.funcion_id,
            butacas: row.butacas,
            precioTotal: row.precio_total,
            validada: !!row.validada,
            cancelada: row.cancelada
        }));
    }

    async cancelarCompra(entradaId: string): Promise<boolean> {
        const usuarioId = this.authService.currentUser()?.id;
        if (!usuarioId) return false;

        // Solo se cancela si es del usuario y todavía no estaba cancelada
        const { data, error } = await this.supabase
            .from('entradas')
            .update({ cancelada: true })
            .eq('id', entradaId)
            .eq('usuario_id', usuarioId)
            .eq('cancelada', false)
            .select();

        if (error || !data || data.length === 0) {
            console.error('Error al cancelar la compra:', error);
            return false;
        }

        await this.cargarEntradas();
        return true;
    }
}