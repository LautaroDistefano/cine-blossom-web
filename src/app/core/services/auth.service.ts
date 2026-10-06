import { inject, Injectable, signal} from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

@Injectable({
    providedIn:'root',
})
export class AuthService {
    private supabase = inject(SupabaseService).client;
    private router = inject(Router);

    // Estado reactivo de autenticación, consumido por guards y componentes
    currentUser = signal<User | null>(null);
    currentSession = signal<Session | null>(null); //Contiene nuestro token JWT
    rolActual = signal<'cliente' | 'admin' | 'empleado' | null>(null);
    fechaNacimiento = signal<string | null>(null);

    constructor() {
        this.initAuthSession();
    }

    private initAuthSession() {
        // Sesión inicial al cargar la app (por ej. al refrescar la página)
        this.supabase.auth.getSession().then(({ data: { session } }) => {
            this.currentSession.set(session);
            this.currentUser.set(session?.user ?? null);
            if (session?.user) this.cargarPerfil(session.user.id);
        });

        // Listener de cambios de sesión (login, logout, refresh de token)
        this.supabase.auth.onAuthStateChange((_event, session) => {
            this.currentSession.set(session);
            this.currentUser.set(session?.user ?? null);
            if (session?.user) {
                this.cargarPerfil(session.user.id);
            } else {
                // Sin sesión: se resetean los datos derivados del perfil
                this.rolActual.set(null);
                this.fechaNacimiento.set(null);
            }
        });
    }

    // Trae rol y fecha de nacimiento desde la tabla "perfiles" 
    private async cargarPerfil(userId: string) {
        const { data, error } = await this.supabase
            .from('perfiles')
            .select('rol, fecha_nacimiento')
            .eq('id', userId)
            .single();

        if (!error && data) {
            this.rolActual.set(data.rol as 'cliente' | 'admin' | 'empleado');
            this.fechaNacimiento.set(data.fecha_nacimiento);
        }
    }

    // El perfil (rol "cliente" por defecto) se crea solo via trigger de la base
    async signUp(email: string, password: string, nombre: string, apellido: string, fechaNacimiento: string) {
        return this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nombre, apellido, fechaNacimiento }
            }
        });
    }

    async signIn(email: string, password: string) {
        return this.supabase.auth.signInWithPassword({ email, password });
    }

    async signOut() {
        return this.supabase.auth.signOut();
    }
}