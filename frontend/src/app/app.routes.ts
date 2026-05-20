// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AccueilComponent } from './pages/dashboard/accueil/accueil.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { FacturesComponent } from './pages/factures/factures.component';
import { FactureComponent } from './pages/facture/facture.component';
import { ProduitsComponent } from './pages/produits/produits.component';
import { ParametresComponent } from './pages/parametres/parametres.component';
import { DeviseComponent } from './pages/devise/devise.component';

// IMPORT du Guard
// Updated Import
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Pages publiques (sans guard)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // DASHBOARD PROTÉGÉ (avec guard)
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard], // ← AJOUT INDISPENSABLE !
    children: [
      { path: '', component: AccueilComponent },
      { path: 'clients', component: ClientsComponent },
      { path: 'produits', component: ProduitsComponent },
      { path: 'factures', component: FacturesComponent },
      { path: 'factures/:id', component: FactureComponent },
      { path: 'devise', component: DeviseComponent },
      { path: 'parametres', component: ParametresComponent },
    ]
  },

  // Redirections
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];