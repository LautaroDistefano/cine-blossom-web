export interface Movie {
    id: string;
    nombre: string;
    sinopsis: string;
    duracion: number; // minutos
    imagen: string;
    generos: string[];
    restriccionEdad: 13 | 18 | null;
    fechaEstreno: string; // ISO date
    preventa?: {
        activa: boolean;
        fechaInicio: string;
        precioEspecial: number;
    };
}
