import { computed, inject, Injectable, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Funcion } from '../models/funcion.interface';

interface FuncionRow {
    id: string;
    pelicula_id: string;
    sala_id: number;
    horario: string;
    formato: '2D' | '3D' | '4D' | '5D';
    idioma: 'castellano' | 'subtitulada';
}

@Injectable({providedIn:'root'})
export class FuncionesService {
    private supabase = inject(SupabaseService).client;

    private funcionesSignal = signal<Funcion[]>([]);

    funciones = computed(() => this.funcionesSignal())
    error = signal<string | null>(null);

    constructor(){
        this.cargarFunciones();
    }

    // --
    async cargarFunciones(){
        // consulta
        const {data, error} = await this.supabase
        .from('funciones')
        .select('*')
        .order('horario')

        // Manejo caso error
        if(error){
            console.error('Error al cargar funciones desde Supabase:', error);
            this.error.set(error.message);
            return;
        }
        // Manejo caso exito
        const funciones = (data as FuncionRow[]).map(row => this.mapearFila(row))
        this.funcionesSignal.set(funciones)
        console.log(`Se cargaron ${funciones.length} funciones desde mi Supabase`);
        // Accion
    }

    private mapearFila(row: FuncionRow): Funcion{
        return{
            id: row.id,
            peliculaId: row.pelicula_id,
            salaId: row.sala_id,
            horario: row.horario,
            formato: row.formato,
            idioma: row.idioma
        }
    }

    getFuncionesPorPelicula(peliculaId: string){
        return computed(() => 
            this.funcionesSignal().filter(f => f.peliculaId === peliculaId)
        );
    }
}
