import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { MovieDetail } from './features/movie-detail/movie-detail';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Sala } from './features/sala/sala';

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
    { path: 'pelicula/:id/reservar/:funcionId', component: Sala },
    { path: '**', redirectTo: 'home' }
];