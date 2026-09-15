// sala.interface.ts
export type CategoriaButaca = 'normal' | 'accesible' | 'vip';

export interface FilaSala {
    fila: string;              // 'A', 'B', ..., 'T'
    categoria: CategoriaButaca;
    bloques: number[];         // [4, 20, 4] o [2, 10, 2]
}

export interface Butaca {
    codigo: string;   // "A5", "J3", etc
    fila: string;
    categoria: CategoriaButaca;
    ocupada: boolean;
}