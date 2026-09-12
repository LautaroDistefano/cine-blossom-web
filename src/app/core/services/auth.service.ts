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

    constructor() {
        this.initAuthSession();
    }

    // Inicializa la sesión y escucha cambios (login, logout, token refresh)
    private initAuthSession() {
        // Obtener sesión inicial
        this.supabase.auth.getSession().then(({ data: { session } }) => {
        this.currentSession.set(session);
        this.currentUser.set(session?.user ?? null);
        });

        // Escuchar cambios de estado en la autenticación
        this.supabase.auth.onAuthStateChange((_event, session) => {
        this.currentSession.set(session);
        this.currentUser.set(session?.user ?? null);
        });
    }

    // Registrar un nuevo usuario (retorna una promesa con la respuesta de Supabase)
    async signUp(email: string, password: string) {
        return this.supabase.auth.signUp({ email, password });
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