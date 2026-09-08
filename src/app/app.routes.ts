import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { MovieDetail } from './features/movie-detail/movie-detail';
import { Catalogo } from './features/catalogo/catalogo';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    {
        path: 'home',
        component: Home,
        children:[
            {
                path:'pelicula/:id',
                component:MovieDetail
            }
        ]
    },
    {
        path: 'pelicula/:id',
        component: MovieDetail
    },
    {
        path: 'catalogo',
        component: Catalogo
    },
    { path: '**', redirectTo: 'home' }
];