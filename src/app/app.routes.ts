import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { MovieDetail } from './features/movie-detail/movie-detail';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Sala } from './features/sala/sala';
import { adminGuard } from './core/guards/admin-guard';
import { AdminPeliculas } from './features/admin-peliculas/admin-peliculas';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: Home },
    { path: 'pelicula/:id', component: MovieDetail },
    { path: 'pelicula/:id/reservar/:funcionId', component: Sala },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    {
        path: 'admin',
        canMatch: [adminGuard],
        children: [
            { path: '', redirectTo: 'peliculas', pathMatch: 'full' },
            { path: 'peliculas', component: AdminPeliculas }
        ]
    },
    { path: '**', redirectTo: 'home' }
];