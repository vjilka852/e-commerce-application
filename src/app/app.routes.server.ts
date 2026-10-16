import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
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
    path: '',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
