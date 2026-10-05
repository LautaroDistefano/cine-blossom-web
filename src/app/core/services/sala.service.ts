// sala.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Butaca, FilaSala, CategoriaButaca } from '../models/sala.interface';
import { RealtimeChannel } from '@supabase/supabase-js';

const LETRAS = 'ABCDEFGHIJKLMNOPQRST'.split('');

@Injectable({ providedIn: 'root' })
export class SalaService {
    private supabase = inject(SupabaseService).client;

    private canal: RealtimeChannel | null = null;

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
        .eq('funcion_id', funcionId)
        .eq('cancelada', false);

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

    // Se queda escuchando los cambios de la tabla "entradas" para una función en particular.
    // Lo usa la pantalla de la sala para que las butacas se actualicen sin recargar.
    escucharButacas(funcionId: string) {
        // 1. Si ya había una conexión abierta (por ejemplo de otra función), la cerramos primero
        this.dejarDeEscuchar();

        // 2. Creamos un "canal": una conexión por WebSocket con Supabase.
        //    Le ponemos un nombre único por función para no mezclar funciones distintas.
        this.canal = this.supabase
            .channel(`butacas-${funcionId}`)

            // 3. PRIMER AVISO: alguien confirmó una compra (se INSERTA una fila nueva en "entradas")
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',// solo filas nuevas
                    schema: 'public',
                    table: 'entradas',
                    filter: `funcion_id=eq.${funcionId}`// solo las de ESTA función
                },
                (payload) => {
                    // payload.new es la fila que se acaba de crear
                    const nuevas = payload.new['butacas'] as string[];

                    // Sumamos esas butacas a las ocupadas. Como es un signal,
                    // el mapa de la sala se redibuja solo.
                    this.butacasOcupadasSignal.update(actuales => [...actuales, ...nuevas]);
                }
            )

            // 4. SEGUNDO AVISO: se MODIFICÓ una fila de "entradas"
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE', // solo modificaciones
                    schema: 'public',
                    table: 'entradas',
                    filter: `funcion_id=eq.${funcionId}`
                },
                (payload) => {
                    // Una fila también se modifica al validar el QR (campo "validada"),
                    // y eso no libera nada. Solo nos interesan las cancelaciones.
                    if (payload.new['cancelada']) {
                        const liberadas = payload.new['butacas'] as string[];

                        // Sacamos esas butacas de las ocupadas: vuelven a estar libres
                        this.butacasOcupadasSignal.update(actuales =>
                            actuales.filter(b => !liberadas.includes(b))
                        );
                    }
                }
            )

            // 5. Abrimos la conexión. Sin este paso, no se escucha nada.
            .subscribe((estado) => {
                // Para ver si conectó bien: tiene que decir SUBSCRIBED
                console.log('Estado de Realtime:', estado);
            });
    }

    // Deja de escuchar (hay que llamarlo al salir de la pantalla)
    dejarDeEscuchar() {
        if (this.canal) {
            this.supabase.removeChannel(this.canal);
            this.canal = null;
        }
    }
}

