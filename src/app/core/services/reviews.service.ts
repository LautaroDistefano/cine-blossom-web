// core/services/review.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Review } from '../models/reviews.interface'

interface ReviewRow {
    id: string;
    usuario_id: string;
    pelicula_id: string;
    estrellas: number;
    comentario: string | null;
    created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
    private supabase = inject(SupabaseService).client;
    private authService = inject(AuthService);

    private reviewsSignal = signal<Review[]>([]);
    cargando = signal(false);

    reviews = computed(() => this.reviewsSignal());

    constructor() {
        this.cargarReviews();
    }

    async cargarReviews(): Promise<void> {
        this.cargando.set(true);

        const { data, error } = await this.supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar reviews:', error);
            this.cargando.set(false);
            return;
        }

        const reviews = (data as ReviewRow[]).map(row => this.mapearFila(row));
        this.reviewsSignal.set(reviews);
        this.cargando.set(false);
    }

    private mapearFila(row: ReviewRow): Review {
        return {
            id: row.id,
            usuarioId: row.usuario_id,
            peliculaId: row.pelicula_id,
            estrellas: row.estrellas,
            comentario: row.comentario,
            createdAt: row.created_at
        };
    }

    // Todas las reviews de una película puntual (para mostrar en MovieDetail)
    getReviewsDePelicula(peliculaId: string) {
        return computed(() =>
            this.reviewsSignal().filter(r => r.peliculaId === peliculaId)
        );
    }

    // Promedio de estrellas de una película, calculado en el momento
    getPromedioDePelicula(peliculaId: string) {
        return computed(() => {
            const reviews = this.reviewsSignal().filter(r => r.peliculaId === peliculaId);
            if (reviews.length === 0) return 0;
            const suma = reviews.reduce((acc, r) => acc + r.estrellas, 0);
            return Number((suma / reviews.length).toFixed(1));
        });
    }

    // La review del usuario actual para una película, si ya dejó una
    getMiReviewDePelicula(peliculaId: string) {
        return computed(() => {
            const usuario = this.authService.currentUser();
            if (!usuario) return null;
            return this.reviewsSignal().find(
                r => r.peliculaId === peliculaId && r.usuarioId === usuario.id
            ) ?? null;
        });
    }

    // Todas las reviews que dejó el usuario actual (para "Mis películas")
    misReviews = computed(() => {
        const usuario = this.authService.currentUser();
        if (!usuario) return [];
        return this.reviewsSignal().filter(r => r.usuarioId === usuario.id);
    });

    // Crea o actualiza la review del usuario para una película (por el unique constraint)
    async guardarReview(peliculaId: string, estrellas: number, comentario: string): Promise<boolean> {
        const usuario = this.authService.currentUser();
        if (!usuario) return false;

        const { error } = await this.supabase
            .from('reviews')
            .upsert({
                usuario_id: usuario.id,
                pelicula_id: peliculaId,
                estrellas,
                comentario: comentario || null
            }, { onConflict: 'usuario_id,pelicula_id' });

        if (error) {
            console.error('Error al guardar review:', error);
            return false;
        }

        await this.cargarReviews();
        return true;
    }

    async eliminarReview(reviewId: string): Promise<boolean> {
        const { error } = await this.supabase.from('reviews').delete().eq('id', reviewId);

        if (error) {
            console.error('Error al eliminar review:', error);
            return false;
        }

        await this.cargarReviews();
        return true;
    }
}