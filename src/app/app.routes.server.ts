import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Client
  },
  {
    path: 'customer-access',
    renderMode: RenderMode.Client
  },
  {
    path: 'access-denied',
    renderMode: RenderMode.Client
  },
  {
    path: 'edit/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'products',
    renderMode: RenderMode.Client
  },
  {
    path: 'categories',
    renderMode: RenderMode.Client
  },
  {
    path: 'categories/create',
    renderMode: RenderMode.Client
  },
  {
    path: 'categories/:id/edit',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/users',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/users/new',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/users/:id/edit',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/roles',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/roles/new',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/roles/:id/edit',
    renderMode: RenderMode.Client
  },
  {
    path: '',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
