import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Log {
    id: string;
    usuarioEmail: string;
    accion: string;
    detalle: string;
    fecha: Date;
}

interface LogRow {
    id: string;
    usuario_email: string | null;
    accion: string;
    detalle: string | null;
    created_at: string;
}

@Injectable({ providedIn: 'root' })
export class LogService {
    private supabase = inject(SupabaseService).client;
    private authService = inject(AuthService);

    // Guarda quién hizo qué. Si falla, no frena la acción original.
    async registrar(accion: string, detalle: string): Promise<void> {
        const usuario = this.authService.currentUser();
        if (!usuario) return;

        const { error } = await this.supabase.from('logs').insert({
            usuario_id: usuario.id,
            usuario_email: usuario.email,
            accion,
            detalle
        });

        if (error) {
            console.error('No se pudo registrar el log:', error);
        }
    }

    // Trae los últimos 200 registros, del más nuevo al más viejo (null si hubo error)
    async cargar(): Promise<Log[] | null> {
        const { data, error } = await this.supabase
            .from('logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) {
            console.error('Error al cargar logs:', error);
            return null;
        }

        return (data as LogRow[]).map(row => ({
            id: row.id,
            usuarioEmail: row.usuario_email ?? '—',
            accion: row.accion,
            detalle: row.detalle ?? '',
            fecha: new Date(row.created_at)
        }));
    }
}