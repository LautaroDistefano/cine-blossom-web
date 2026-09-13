import { inject, Injectable, signal} from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn:'root',
})
export class AuthService {
    private supabase = inject(SupabaseService).client;

    // Signals para manejar el estado de autenticación
    currentUser = signal<User | null>(null);
    currentSession = signal<Session | null>(null);
    rolActual = signal<'cliente' | 'admin' | null>(null);

    constructor() {
        this.initAuthSession();
    }

    // Inicializa la sesión y escucha cambios (login, logout, token refresh)
    private initAuthSession() {
        // Obtener sesión inicial
        this.supabase.auth.getSession().then(({ data: { session } }) => {
            this.currentSession.set(session);
            this.currentUser.set(session?.user ?? null);
            if (session?.user) this.cargarPerfil(session.user.id);
        });

        this.supabase.auth.onAuthStateChange((_event, session) => {
            this.currentSession.set(session);
            this.currentUser.set(session?.user ?? null);
            if (session?.user) {
                this.cargarPerfil(session.user.id);
            } else {
                this.rolActual.set(null);
            }
        });
    }

    private async cargarPerfil(userId: string) {
        const { data, error } = await this.supabase
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (!error && data) {
            this.rolActual.set(data.rol as 'cliente' | 'admin');
        }
    }

    // Registrar un nuevo usuario (retorna una promesa con la respuesta de Supabase)
    // auth.service.ts
    async signUp(email: string, password: string, nombre: string, apellido: string) {
        return this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nombre, apellido }
            }
        });
    }

    // Iniciar sesión
    async signIn(email: string, password: string) {
        return this.supabase.auth.signInWithPassword({ email, password });
    }

    // Cerrar sesión
    async signOut() {
        return this.supabase.auth.signOut();
    }
}