import { Routes } from '@angular/router';
import { DependencyUpdaterComponent } from './dependency-updater/dependency-updater.component';
import { DocsLinkComponent } from './docs-link/docs-link.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
    {
        path:'home',
        component: DependencyUpdaterComponent
    },
    {
        path:'',
        redirectTo:'home',
        pathMatch: 'full'
    },
    {
        path:'kb',
        component:DocsLinkComponent
    },
    {
        path:'settings',
        component:SettingsComponent
    }
];
