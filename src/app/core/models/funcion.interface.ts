export interface Funcion {
    id: string;
    peliculaId: string;
    salaId: number;
    horario: string;
    formato: '2D' | '3D' | '4D' | '5D';
    idioma: 'castellano' | 'subtitulada';
}
