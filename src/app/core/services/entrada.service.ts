import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class EntradaService {
    private supabase = inject(SupabaseService).client;
    private authService = inject(AuthService);

    async reservar(funcionId: string, butacas: string[], precioTotal: number): Promise<boolean> {
        const usuarioId = this.authService.currentUser()?.id ?? null; // null si es anónimo (RF03)

        const { error } = await this.supabase.from('entradas').insert({
            funcion_id: funcionId,
            usuario_id: usuarioId,
            butacas: butacas,
            precio_total: precioTotal
        });

        if (error) {
            console.error('Error al reservar:', error);
            return false;
        }

        return true;
    }
}