import { Injectable, signal, computed, inject } from '@angular/core';
import { Movie } from '../models/movie.interface';
import { SupabaseService } from './supabase.service';

// Forma en la que Supabase devuelve cada fila (snake_case, tal cual la tabla)
interface PeliculaRow {
    id: string;
    nombre: string;
    sinopsis: string;
    duracion: number;
    imagen: string;
    generos: string[];
    restriccion_edad: 13 | 18 | null;
    rating_promedio: number;
    fecha_estreno: string;
    formato: string;
    idioma: string;
}

@Injectable({ providedIn: 'root' })
export class MovieService {
    private supabase = inject(SupabaseService).client;

    private peliculasSignal = signal<Movie[]>([]);
    cargando = signal(false);
    error = signal<string | null>(null);

    peliculas = computed(() => this.peliculasSignal());

    constructor() {
        this.cargarPeliculas();
    }

    async cargarPeliculas(): Promise<void> {
        this.cargando.set(true);
        this.error.set(null);

        const { data, error } = await this.supabase
            .from('peliculas')
            .select('*')
            .order('fecha_estreno', { ascending: false });

        if (error) {
            console.error('Error al cargar películas desde Supabase:', error);
            this.error.set(error.message);
            this.cargando.set(false);
            return;
        }

        const peliculas = (data as PeliculaRow[]).map(row => this.mapearFila(row));
        this.peliculasSignal.set(peliculas);
        this.cargando.set(false);
        console.log(`Se cargaron ${peliculas.length} películas desde mi Supabase`);
    }

    // snake_case (Supabase) -> camelCase (tu interfaz Movie)
    private mapearFila(row: PeliculaRow): Movie {
        return {
            id: row.id,
            nombre: row.nombre,
            sinopsis: row.sinopsis,
            duracion: row.duracion,
            imagen: row.imagen,
            generos: row.generos,
            restriccionEdad: row.restriccion_edad,
            ratingPromedio: row.rating_promedio,
            fechaEstreno: row.fecha_estreno
        };
    }

    getPeliculaPorId(id: string) {
        return computed(() => this.peliculasSignal().find(p => p.id === id));
    }

    // --- Operaciones de escritura (para el admin, RF06) ---

    async agregarPelicula(pelicula: Omit<Movie, 'id'>): Promise<boolean> {
        const { error } = await this.supabase.from('peliculas').insert({
            nombre: pelicula.nombre,
            sinopsis: pelicula.sinopsis,
            duracion: pelicula.duracion,
            imagen: pelicula.imagen,
            generos: pelicula.generos,
            restriccion_edad: pelicula.restriccionEdad,
            rating_promedio: pelicula.ratingPromedio,
            fecha_estreno: pelicula.fechaEstreno
        });

        if (error) {
            console.error('Error al agregar película:', error);
            return false;
        }

        await this.cargarPeliculas(); // refrescamos el signal local
        return true;
    }

    async eliminarPelicula(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('peliculas').delete().eq('id', id);

        if (error) {
            console.error('Error al eliminar película:', error);
            return false;
        }

        await this.cargarPeliculas();
        return true;
    }
}