import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class EntradaService {
    private supabase = inject(SupabaseService).client;
    private authService = inject(AuthService);

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

        return { exito: true, codigoQr };
    }
}