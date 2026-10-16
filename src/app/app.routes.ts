import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/products/product-list.component')
      .then(module => module.ProductListComponent),
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/product-list.component')
      .then(module => module.ProductListComponent),
  },
  {
    path: 'create',
    loadComponent: () => import('./features/products/product-add-edit-form.component')
      .then(module => module.ProductAddEditFormComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./features/products/product-add-edit-form.component')
      .then(module => module.ProductAddEditFormComponent),
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/categories/category-list.component')
      .then(module => module.CategoryListComponent),
  },
  {
    path: 'categories/create',
    loadComponent: () => import('./features/categories/category-form.component')
      .then(module => module.CategoryFormComponent),
  },
  {
    path: 'categories/:id/edit',
    loadComponent: () => import('./features/categories/category-form.component')
      .then(module => module.CategoryFormComponent),
  },
  { path: '**', redirectTo: '' },
];
