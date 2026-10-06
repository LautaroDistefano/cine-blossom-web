import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Venta {
    id: string;
    funcionId: string;
    butacas: string[];
    candyBar: { nombre: string; cantidad: number; precioUnitario: number }[];
    precioTotal: number;
    fecha: Date;
}

interface VentaRow {
    id: string;
    funcion_id: string;
    butacas: string[];
    candy_bar: { nombre: string; cantidad: number; precioUnitario: number }[] | null;
    precio_total: number;
    created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
    private supabase = inject(SupabaseService).client;

    // desde y hasta llegan como 'YYYY-MM-DD'. Devuelve null si hubo un error.
    async cargarVentas(desde: string, hasta: string): Promise<Venta[] | null> {
        const inicio = new Date(`${desde}T00:00:00`).toISOString();
        const fin = new Date(`${hasta}T23:59:59.999`).toISOString();

        const { data, error } = await this.supabase
            .from('entradas')
            .select('id, funcion_id, butacas, candy_bar, precio_total, created_at')
            .eq('cancelada', false)      // las canceladas no cuentan como facturación
            .gte('created_at', inicio)
            .lte('created_at', fin)
            .order('created_at');

        if (error) {
            console.error('Error al cargar ventas:', error);
            return null;
        }

        return (data as VentaRow[]).map(row => ({
            id: row.id,
            funcionId: row.funcion_id,
            butacas: row.butacas,
            candyBar: row.candy_bar ?? [],
            precioTotal: Number(row.precio_total),
            fecha: new Date(row.created_at)
        }));
    }
}