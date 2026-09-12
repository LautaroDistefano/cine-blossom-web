import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { MovieDetail } from './features/movie-detail/movie-detail';
import { Catalogo } from './features/catalogo/catalogo';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';

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

    // Rutas de Auth y Favoritos
    { path: 'login', component: Login },
    { path: 'register', component: Register },

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