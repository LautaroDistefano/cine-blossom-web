import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Cupon } from '../models/cupon.interface';

interface CuponRow {
    codigo: string;
    porcentaje: number;
    edad_minima: number | null;
    activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class CuponService {
    private supabase = inject(SupabaseService).client;

    // Busca un cupón activo por su código. Devuelve null si no existe.
    async buscar(codigo: string): Promise<Cupon | null> {
        const { data, error } = await this.supabase
            .from('cupones')
            .select('*')
            .eq('codigo', codigo.trim().toUpperCase())
            .eq('activo', true)
            .maybeSingle();

        if (error || !data) return null;

        const row = data as CuponRow;
        return { codigo: row.codigo, porcentaje: row.porcentaje, edadMinima: row.edad_minima };
    }
}