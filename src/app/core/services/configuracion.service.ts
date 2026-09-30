import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Configuracion } from '../models/configuracion.interface';

interface ConfiguracionRow {
    id: number;
    descuento_bienvenida: number;
    puntos_por_entrada: number;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
    private supabase = inject(SupabaseService).client;

    private configuracionSignal = signal<Configuracion>({ descuentoBienvenida: 20, puntosPorEntrada: 3000 });
    cargando = signal(false);

    configuracion = computed(() => this.configuracionSignal());

    constructor() {
        this.cargarConfiguracion();
    }

    async cargarConfiguracion(): Promise<void> {
        this.cargando.set(true);

        const { data, error } = await this.supabase
            .from('configuracion')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Error al cargar configuración:', error);
            this.cargando.set(false);
            return;
        }

        const row = data as ConfiguracionRow;
        this.configuracionSignal.set({
            descuentoBienvenida: row.descuento_bienvenida,
            puntosPorEntrada: row.puntos_por_entrada
        });
        this.cargando.set(false);
    }

    async actualizarDescuento(nuevoValor: number): Promise<boolean> {
        const { error } = await this.supabase
            .from('configuracion')
            .update({ descuento_bienvenida: nuevoValor })
            .eq('id', 1);

        if (error) {
            console.error('Error al actualizar configuración:', error);
            return false;
        }

        await this.cargarConfiguracion();
        return true;
    }

    // Cambia cuántos puntos cuesta canjear una entrada (lo usa el admin)
    async actualizarPuntosPorEntrada(nuevoValor: number): Promise<boolean> {
        const { error } = await this.supabase
            .from('configuracion')
            .update({ puntos_por_entrada: nuevoValor })
            .eq('id', 1);

        if (error) {
            console.error('Error al actualizar puntos por entrada:', error);
            return false;
        }

        await this.cargarConfiguracion();
        return true;
    }
}