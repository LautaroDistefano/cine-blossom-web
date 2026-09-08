import { Injectable, signal } from '@angular/core';
import { Movie } from '../models/movie.interface';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn:'root'
})
export class MovieService {
    peliculas = signal<Movie[]>([
            {
        id: "m-001",
        nombre: "Inception",
        sinopsis: "Un ladrón que roba secretos corporativos a través del uso de la tecnología de compartir sueños, recibe la tarea inversa de plantar una idea en la mente de un CEO.",
        duracion: 148,
        imagen: "https://imgs.search.brave.com/8aR3-Uav_8kCLp4nW5pMY02UEHmHQf2vA7wAdNJyoOo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnJl/ZGQuaXQvNzNkbHJt/ZHo0eHRmMS5qcGVn",
        generos: ["Acción", "Ciencia F.", "Thriller"],
        restriccionEdad: 13,
        ratingPromedio: 4.8,
        fechaEstreno: "2010-07-16"
    },
    {
        id: "m-002",
        nombre: "Pulp Fiction",
        sinopsis: "Las vidas de dos mafiosos, un boxeador, la esposa de un gángster y un par de bandidos se entrelazan en cuatro historias de violencia y redención.",
        duracion: 154,
        imagen: "https://imgs.search.brave.com/nN5u61Tq9mmAD55KPl7YNo8SFY1mWZlZzC0qwHSYpm0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMucG9zdGVycy5j/ei9pbWFnZS8zNTAv/Y2FydGVsZXMtZGUt/bWV0YWwvcHVscC1m/aWN0aW9uLXVtYS1v/bi1iZWQtaTIxMjky/NS5qcGc",
        generos: ["Crimen", "Drama"],
        restriccionEdad: 18,
        ratingPromedio: 4.9,
        fechaEstreno: "1994-10-14"
    },
    {
        id: "m-003",
        nombre: "Spider-Man: Un nuevo universo",
        sinopsis: "El joven Miles Morales se convierte en el Spider-Man de su universo y debe unirse a cinco versiones alternativas de Spider-Man para detener una amenaza para todas las realidades.",
        duracion: 117,
        imagen: "https://imgs.search.brave.com/fEopyRBAfvKsVs7O_OkQnuCuqgGGVuXR4JdbPcPwFjU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/bGFoaWd1ZXJhLm5l/dC9jaW5lbWFuaWEv/cGVsaWN1bGEvODM3/Mi9zcGlkZXJfbWFu/X3VuX251ZXZvX3Vu/aXZlcnNvLWNhcnRl/bC04MjExLmpwZw",
        generos: ["Animación", "Acción", "Aventura"],
        restriccionEdad: null,
        ratingPromedio: 4.7,
        fechaEstreno: "2018-12-14"
    },
    {
        id: "m-004",
        nombre: "Dune: Parte Dos",
        sinopsis: "Paul Atreides se une a Chani y a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.",
        duracion: 166,
        imagen: "https://imgs.search.brave.com/mVN0gSPVJm6Yc4TCJgoz3zj1tV4KVIsqDU9afqpjlpw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/ZWNhcnRlbGVyYS5j/b20vY2FydGVsZXMv/MTY5MDAvMTY5MzYv/MDAzX3AuanBn",
        generos: ["Ciencia Ficción", "Aventura"],
        restriccionEdad: 13,
        ratingPromedio: 4.8,
        fechaEstreno: "2024-03-01",
        preventa: {
            activa: false,
            fechaInicio: "2024-01-15T00:00:00.000Z",
            precioEspecial: 4500
        }
    },
    {
        id: "m-005",
        nombre: "El Viaje de Chihiro",
        sinopsis: "Durante el traslado de su familia a los suburbios, una niña de 10 años de edad deambula por un mundo gobernado por dioses, brujas y espíritus.",
        duracion: 125,
        imagen: "https://imgs.search.brave.com/tN9eB2UdXLfdWh8OU2h3GdqPrtslI-rRo_1eUc7885A/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9lcy53/ZWIuaW1nMy5hY3N0/YS5uZXQvcl8xMjgw/XzcyMC9pbWcvMGEv/ZjUvMGFmNTljYTA1/MjNjMTFhOTFhNDBi/NWZlYjFmMzg4YTku/anBn",
        generos: ["Animación", "Fantasía", "Aventura"],
        restriccionEdad: null,
        ratingPromedio: 4.9,
        fechaEstreno: "2001-07-20"
    },
    {
        id: "m-006",
        nombre: "Deadpool & Wolverine",
        sinopsis: "El mercenario bocazas Deadpool se une a un reacio Wolverine para enfrentar una amenaza que podría destruir todo su universo.",
        duracion: 127,
        imagen: "https://imgs.search.brave.com/cbN_VOjQOYcAM8u_fUd-G9MjoNc9yElrI3PWGN-h9kY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9teC53/ZWIuaW1nMy5hY3N0/YS5uZXQvcl8xMjgw/XzcyMC9pbWcvODYv/MmEvODYyYWQyMTM1/MGQ5YThhMWVlNzZj/YTI5ZGRkZjBhY2Eu/anBlZw",
        generos: ["Acción", "Comedia", "Ciencia Ficción"],
        restriccionEdad: 18,
        ratingPromedio: 4.5,
        fechaEstreno: "2024-07-25",
        preventa: {
            activa: true,
            fechaInicio: "2024-06-01T10:00:00.000Z",
            precioEspecial: 5500
        }
    },
    {
        id: "m-007",
        nombre: "Oppenheimer",
        sinopsis: "La historia del científico estadounidense J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.",
        duracion: 180,
        imagen: "https://imgs.search.brave.com/PUUcoNmdeKN9OqZZdo8joc94Sdjs98Hs_ncoPrzTZUU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9lcy53/ZWIuaW1nMi5hY3N0/YS5uZXQvY18zMTBf/NDIwL3BpY3R1cmVz/LzIzLzA1LzI1LzEz/LzQxLzE4MzU0MzEu/anBn",
        generos: ["Biografía", "Drama", "Historia"],
        restriccionEdad: 13,
        ratingPromedio: 4.6,
        fechaEstreno: "2023-07-21"
    },
    {
        id: "m-008",
        nombre: "El Padrino",
        sinopsis: "El envejecido patriarca de una dinastía del crimen organizado en la ciudad de Nueva York transfiere el control de su imperio clandestino a su hijo menor.",
        duracion: 175,
        imagen: "https://imgs.search.brave.com/egexsJICXbrBDrfy8mOEQoiO8s4jMi5jGeqasKbL3-k/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9lcy53/ZWIuaW1nMy5hY3N0/YS5uZXQvcl8xMjgw/XzcyMC9tZWRpYXMv/bm1lZGlhLzE4LzM1/LzU3LzczLzE4NjYw/NzE2LmpwZw",
        generos: ["Crimen", "Drama"],
        restriccionEdad: 18,
        ratingPromedio: 5.0,
        fechaEstreno: "1972-03-24"
    },
    {
        id: "m-009",
        nombre: "Intensa-Mente 2",
        sinopsis: "Riley entra en la adolescencia y el Cuartel General sufre una repentina demolición para hacer sitio a algo totalmente inesperado: ¡nuevas Emociones!",
        duracion: 96,
        imagen: "https://imgs.search.brave.com/FC2onz3JNtMJEJVkkwAkbkrpXzpPt0AJpw4FaNksr1k/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9teC53/ZWIuaW1nMy5hY3N0/YS5uZXQvY18zMTBf/NDIwL3BpY3R1cmVz/LzI0LzAzLzA3LzE4/LzQ3LzU5NzU1MzEu/anBn",
        generos: ["Animación", "Comedia", "Drama"],
        restriccionEdad: null,
        ratingPromedio: 4.6,
        fechaEstreno: "2024-06-14"
    },
    {
        id: "m-010",
        nombre: "Alien, el octavo pasajero",
        sinopsis: "Después de que un buque mercante espacial recibe una transmisión desconocida como una llamada de socorro, uno de los tripulantes es atacado por una misteriosa forma de vida.",
        duracion: 117,
        imagen: "https://imgs.search.brave.com/84csC41sIj7TyfspmIpbtBPHGFN0KtogvLrirHXqkek/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/ZWNhcnRlbGVyYS5j/b20vY2FydGVsZXMv/MTAwMC8xMDQyLzAw/Mi5qcGc",
        generos: ["Terror", "Ciencia Ficción"],
        restriccionEdad: 18,
        ratingPromedio: 4.8,
        fechaEstreno: "1979-05-25"
    },
    {
        id: "m-011",
        nombre: "Gladiador",
        sinopsis: "Un ex general romano busca vengarse del emperador corrupto que asesinó a su familia y lo envió a la esclavitud.",
        duracion: 155,
        imagen: "https://imgs.search.brave.com/5aJCdP-ihDukgRdzD3wsHi1rnrwS2GS7pTlp22tjHWc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9lcy53/ZWIuaW1nMi5hY3N0/YS5uZXQvcl8xMjgw/XzcyMC9tZWRpYXMv/bm1lZGlhLzE4Lzcw/LzkyLzAyLzIwMTQ5/MDczLmpwZw",
        generos: ["Acción", "Aventura", "Drama"],
        restriccionEdad: 18,
        ratingPromedio: 4.7,
        fechaEstreno: "2000-05-05"
    },
    {
        id: "m-012",
        nombre: "Coco",
        sinopsis: "El aspirante a músico Miguel, confrontado con la prohibición ancestral de la música en su familia, entra en la Tierra de los Muertos para encontrar a su tatarabuelo.",
        duracion: 105,
        imagen: "https://i.pinimg.com/originals/8a/18/46/8a1846340fcb53936a975a89af5da696.jpg",
        generos: ["Animación", "Aventura", "Familia"],
        restriccionEdad: null,
        ratingPromedio: 4.9,
        fechaEstreno: "2017-10-27"
    },
    {
        id: "m-013",
        nombre: "The Dark Knight",
        sinopsis: "Cuando la amenaza conocida como el Joker causa estragos y caos en la ciudad de Gotham, Batman debe aceptar uno de los mayores desafíos psicológicos y físicos.",
        duracion: 152,
        imagen: "https://imgs.search.brave.com/sHpDsTqNPn0Bz1ohOpgJ4rf4UiS_SCc3bUVE_WFmCvo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9waWNz/LmZpbG1hZmZpbml0/eS5jb20vdGhlX2Rh/cmtfa25pZ2h0X3Jp/c2VzLTE0OTU0NDg4/MS1tbWVkLmpwZw",
        generos: ["Acción", "Crimen", "Drama"],
        restriccionEdad: 13,
        ratingPromedio: 4.9,
        fechaEstreno: "2008-07-18"
    },
    {
        id: "m-014",
        nombre: "Jurassic Park",
        sinopsis: "Un experto en paleontología se encuentra entre un grupo selecto elegido para recorrer un parque de diversiones con dinosaurios clonados antes de su apertura.",
        duracion: 127,
        imagen: "https://imgs.search.brave.com/hjMZcp1HzcwaenOmtkzQCOQcaH6v1KRrI6TH3DfeXWA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9lcy53/ZWIuaW1nMy5hY3N0/YS5uZXQvcl8xMjgw/XzcyMC9waWN0dXJl/cy8yMy8wOS8wOC8x/NS81MS8zMzk3MzQx/LmpwZw",
        generos: ["Aventura", "Ciencia F.", "Thriller"],
        restriccionEdad: 13,
        ratingPromedio: 4.6,
        fechaEstreno: "1993-06-11"
    },
    {
        id: "m-015",
        nombre: "Parasite",
        sinopsis: "La discriminación social se desata cuando la familia de clase baja Kim, gradualmente, se infiltra en la casa de la rica familia Park.",
        duracion: 132,
        imagen: "https://imgs.search.brave.com/9fcx5Rz6KShU3Y9TuykHOBrQL1ND7IA_Qx6BAUQuazQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS40OTUw/Njc0NTcxLjAxMDcv/ZmxhdCw3NTB4LDA3/NSxmLXBhZCw3NTB4/MTAwMCxmOGY4Zjgu/anBn",
        generos: ["Drama", "Thriller"],
        restriccionEdad: 18,
        ratingPromedio: 4.8,
        fechaEstreno: "2019-05-30"
    },
    {
        id: "m-016",
        nombre: "Barbie",
        sinopsis: "Sufrir una crisis que le hace cuestionarse su mundo y su existencia lleva a Barbie a viajar al mundo real.",
        duracion: 114,
        imagen: "https://imgs.search.brave.com/aGnE929qSfJPhcahz_RzMyD61nHQjue4zJqqJoypV6w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/bGFoaWd1ZXJhLm5l/dC9jaW5lbWFuaWEv/cGVsaWN1bGEvMTAy/OTcvYmFyYmllLWNh/cnRlbC0xMTIyMi5q/cGc",
        generos: ["Aventura", "Comedia", "Fantasía"],
        restriccionEdad: 13,
        ratingPromedio: 4.3,
        fechaEstreno: "2023-07-21"
    },
    {
        id: "m-017",
        nombre: "El Rey León",
        sinopsis: "El cachorro de león Simba es engañado por su traicionero tío para que piense que causó la muerte de su padre y huye al exilio.",
        duracion: 89,
        imagen: "https://imgs.search.brave.com/Uyf6t7hwd5jNfPO9FYoDShcQVAWv79SnbRKaA0K_2Cw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/bGFoaWd1ZXJhLm5l/dC9jaW5lbWFuaWEv/cGVsaWN1bGEvMTEx/ODUvbXVmYXNhX2Vs/X3JleV9sZW9uLWNh/cnRlbC0xMTc3MC5q/cGc",
        generos: ["Animación", "Aventura", "Drama"],
        restriccionEdad: null,
        ratingPromedio: 4.8,
        fechaEstreno: "1994-06-24"
    },
    {
        id: "m-018",
        nombre: "Matrix",
        sinopsis: "Un hacker informático aprende de misteriosos rebeldes sobre la verdadera naturaleza de su realidad y su papel en la guerra contra sus controladores.",
        duracion: 136,
        imagen: "https://imgs.search.brave.com/qDeXJyXnfTPzrW7bJDBlCadQfg7tCZ7F1Hvfv5n3j_U/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/ZWNhcnRlbGVyYS5j/b20vY2FydGVsZXMv/NDEwMC80MTA5LzAw/Mi5qcGc",
        generos: ["Acción", "Ciencia Ficción"],
        restriccionEdad: 13,
        ratingPromedio: 4.7,
        fechaEstreno: "1999-03-31"
    },
    {
        id: "m-019",
        nombre: "El Resplandor",
        sinopsis: "Una familia se dirige a un hotel aislado para pasar el invierno, donde una presencia siniestra influye en la violencia del padre.",
        duracion: 146,
        imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzVkv4Be9myAah8WHauuXgL0gA0zpY9EOxbnYL4MsJufCgE4q9sNjb4IU5&s=10",
        generos: ["Drama", "Terror"],
        restriccionEdad: 18,
        ratingPromedio: 4.5,
        fechaEstreno: "1980-05-23"
    },
    {
        id: "m-020",
        nombre: "Avatar: El camino del agua",
        sinopsis: "Jake Sully vive con su nueva familia en el planeta Pandora. Cuando una amenaza familiar regresa, Jake debe trabajar con Neytiri y el ejército de la raza Na'vi.",
        duracion: 192,
        imagen: "https://imgs.search.brave.com/GDDf9qR2YTi7jQ6eBZ6mAFySma03N_bMM1sxpOY0rqI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pMC53/cC5jb20vY2luZW1l/ZGlvcy5jb20vd3At/Y29udGVudC91cGxv/YWRzLzIwMjIvMTEv/UE9TVEVSLUFWQVRB/Ui1FTC1DQU1JTk8t/REVMLUFHVUEuanBn/P2ZpdD0yNDYsMzY1/JnNzbD0x",
        generos: ["Acción", "Aventura", "Fantasía"],
        restriccionEdad: 13,
        ratingPromedio: 4.4,
        fechaEstreno: "2022-12-16",
        preventa: {
            activa: true,
            fechaInicio: "2022-11-01T00:00:00.000Z",
            precioEspecial: 6000
        }
    }
    ])
}
