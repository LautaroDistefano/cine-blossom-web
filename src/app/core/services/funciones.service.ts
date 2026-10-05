import { computed, inject, Injectable, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Funcion } from '../models/funcion.interface';
import { CANTIDAD_SALAS } from '../models/sala.interface';

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

    // CRUD
    async agregarFuncion(funcion: Omit<Funcion, 'id'>): Promise<boolean> {
        const { error } = await this.supabase.from('funciones').insert({
            pelicula_id: funcion.peliculaId,
            sala_id: funcion.salaId,
            horario: funcion.horario,
            formato: funcion.formato,
            idioma: funcion.idioma
        });

        if (error) {
            console.error('Error al agregar función:', error);
            return false;
        }

        await this.cargarFunciones();
        return true;
    }

    async editarFuncion(id: string, cambios: Omit<Funcion, 'id'>): Promise<boolean> {
        const { error } = await this.supabase.from('funciones').update({
            pelicula_id: cambios.peliculaId,
            sala_id: cambios.salaId,
            horario: cambios.horario,
            formato: cambios.formato,
            idioma: cambios.idioma
        }).eq('id', id);

        if (error) {
            console.error('Error al editar función:', error);
            return false;
        }

        await this.cargarFunciones();
        return true;
    }

    async eliminarFuncion(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('funciones').delete().eq('id', id);

        if (error) {
            console.error('Error al eliminar función:', error);
            return false;
        }

        await this.cargarFunciones();
        return true;
    }

    // Verifica si programar una función en salaId a horarioISO (con esa duración) choca
    // con alguna función existente, respetando la diferencia de los 30 minutos.
    hayConflictoDeHorario(salaId: number, horarioISO: string, duracionMinutos: number, duracionesPorPelicula: Map<string, number>, funcionIdExcluir?: string): boolean {
        /* 
            SalaId: El id de nuestra sala a evaluar
            HorarioISO: Horario de la nueva funcion (lo convertiremos a milisegundos para poder trabajar con ellos)
            duracionMinutos: Lo recibimos de afuera, es la duracion en minutos de la funcion que queremos programar
            duracionesPorPelicula: Duracion de esa funcion existente, usamos MAP porque cada funcion tiene distinta duracion
            funcionIdExcluir
        */
        const inicioNuevo = new Date(horarioISO).getTime();
        const finNuevoConBuffer = inicioNuevo + (duracionMinutos + 30) * 60000;

        return this.funciones().some(f => {
            if (f.salaId !== salaId) return false;
            if (funcionIdExcluir && f.id === funcionIdExcluir) return false;

            const duracionExistente = duracionesPorPelicula.get(f.peliculaId) ?? 0;
            const inicioExistente = new Date(f.horario).getTime();
            const finExistenteConBuffer = inicioExistente + (duracionExistente + 30) * 60000;

            // Se solapan si el nuevo empieza antes de que termine (con buffer) el existente,
            // Y el existente empieza antes de que termine (con buffer) el nuevo.
            return inicioNuevo < finExistenteConBuffer && inicioExistente < finNuevoConBuffer;
        });
    }

    asignarSalaLibre(
        horarioISO: string, duracionMinutos: number, duracionesPorPelicula: Map<string, number>, funcionIdExcluir?: string): number | null {
        // Probamos las salas de la 1 a la 5, en orden
        for (let sala = 1; sala <= CANTIDAD_SALAS; sala++) {
            const hayConflicto = this.hayConflictoDeHorario(
                sala,
                horarioISO,
                duracionMinutos,
                duracionesPorPelicula,
                funcionIdExcluir
            );

            // La primera sala sin conflicto es la que usamos
            if (!hayConflicto) {
                return sala;
            }
        }

        // Si ninguna sala sirvió, devolvemos null
        return null;
    }
}
