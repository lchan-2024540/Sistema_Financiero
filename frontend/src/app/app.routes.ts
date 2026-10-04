import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { rolGuard } from './core/guards/rol.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'clientes' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/registro/registro.component').then((m) => m.RegistroComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'clientes',
        canActivate: [rolGuard('administrador', 'cajero')],
        loadComponent: () =>
          import('./features/clientes/clientes-lista/clientes-lista.component').then(
            (m) => m.ClientesListaComponent
          ),
      },
      {
        path: 'clientes/nuevo',
        canActivate: [rolGuard('administrador', 'cajero')],
        loadComponent: () =>
          import('./features/clientes/cliente-form/cliente-form.component').then(
            (m) => m.ClienteFormComponent
          ),
      },
      {
        path: 'cuentas',
        loadComponent: () =>
          import('./features/cuentas/cuentas-lista/cuentas-lista.component').then(
            (m) => m.CuentasListaComponent
          ),
      },
      {
        path: 'cuentas/nueva',
        canActivate: [rolGuard('administrador', 'cajero')],
        loadComponent: () =>
          import('./features/cuentas/cuenta-form/cuenta-form.component').then(
            (m) => m.CuentaFormComponent
          ),
      },
      {
        path: 'depositos',
        canActivate: [rolGuard('administrador', 'cajero')],
        data: { tipo: 'deposito' },
        loadComponent: () =>
          import('./features/operaciones/operacion.component').then((m) => m.OperacionComponent),
      },
      {
        path: 'retiros',
        canActivate: [rolGuard('administrador', 'cajero')],
        data: { tipo: 'retiro' },
        loadComponent: () =>
          import('./features/operaciones/operacion.component').then((m) => m.OperacionComponent),
      },
      {
        path: 'transferencias',
        loadComponent: () =>
          import('./features/transferencias/transferencias.component').then(
            (m) => m.TransferenciasComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'clientes' },
];
