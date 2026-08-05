import { Routes } from '@angular/router';
import { Privacy } from './privacy/privacy';
import { Home } from './home/home';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'policies', component: Privacy },
];
