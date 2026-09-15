// sala.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Butaca, FilaSala, CategoriaButaca } from '../models/sala.interface';

const LETRAS = 'ABCDEFGHIJKLMNOPQRST'.split('');

@Injectable({ providedIn: 'root' })
export class SalaService {
    private supabase = inject(SupabaseService).client;

    // Estado: qué butacas están ocupadas para la función que se está mirando ahora
    private butacasOcupadasSignal = signal<string[]>([]);
    cargando = signal(false);

    generarFilas(): FilaSala[] {
        return LETRAS.map(letra => {
            if (letra === 'J' || letra === 'K') {
                return { fila: letra, categoria: 'accesible' as CategoriaButaca, bloques: [2, 10, 2] };
            }
            if (letra === 'R' || letra === 'S' || letra === 'T') {
                return { fila: letra, categoria: 'vip' as CategoriaButaca, bloques: [4, 20, 4] };
            }
            return { fila: letra, categoria: 'normal' as CategoriaButaca, bloques: [4, 20, 4] };
        });
    }

    generarButacasDeFila(fila: FilaSala): Butaca[] {
        const ocupadas = this.butacasOcupadasSignal();
        const totalAsientos = fila.bloques.reduce((sum, n) => sum + n, 0);
        return Array.from({ length: totalAsientos }, (_, i) => {
            const codigo = `${fila.fila}${i + 1}`;
            return {
                codigo,
                fila: fila.fila,
                categoria: fila.categoria,
                ocupada: ocupadas.includes(codigo)
            };
        });
    }

    async cargarButacasOcupadas(funcionId: string): Promise<void> {
        this.cargando.set(true);

        const { data, error } = await this.supabase
            .from('entradas')
            .select('butacas')
            .eq('funcion_id', funcionId);

        if (error) {
            console.error('Error al cargar butacas ocupadas:', error);
            this.cargando.set(false);
            return;
        }

        const ocupadas = data?.flatMap(fila => fila.butacas as string[]) ?? [];
        this.butacasOcupadasSignal.set(ocupadas);
        this.cargando.set(false);
    }

    butacasOcupadas = computed(() => this.butacasOcupadasSignal());
    
    generarBloquesDeFila(fila: FilaSala): Butaca[][] {
        const ocupadas = this.butacasOcupadasSignal();
        let contador = 0;

        return fila.bloques.map(cantidadEnBloque => {
            const butacasBloque: Butaca[] = [];
            for (let i = 0; i < cantidadEnBloque; i++) {
                contador++;
                const codigo = `${fila.fila}${contador}`;
                butacasBloque.push({
                    codigo,
                    fila: fila.fila,
                    categoria: fila.categoria,
                    ocupada: ocupadas.includes(codigo)
                });
            }
            return butacasBloque;
        });
    }
}

