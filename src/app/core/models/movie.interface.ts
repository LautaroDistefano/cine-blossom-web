export interface Movie {
    id: string;
    nombre: string;
    sinopsis: string;
    duracion: number; // minutos
    imagen: string;
    generos: string[];
    restriccionEdad: 13 | 18 | null;
    ratingPromedio: number; // 0 a 5
    fechaEstreno: string; // ISO date
    preventa?: {
        activa: boolean;
        fechaInicio: string;
        precioEspecial: number;
    };
}
