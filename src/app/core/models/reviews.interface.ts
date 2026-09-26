export interface Review {
    id: string;
    usuarioId: string;
    peliculaId: string;
    estrellas: number;
    comentario: string | null;
    createdAt: string;
}