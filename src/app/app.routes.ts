import { Routes } from '@angular/router';
import { authenticatedGuard, guestGuard, permissionGuard } from './guards/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component')
      .then(module => module.LoginComponent)
  },
  {
    path: 'customer-access',
    canActivate: [authenticatedGuard, permissionGuard],
    data: {
      roles: ['client'],
      title: 'Customer features are not available yet',
      message: 'Your account is signed in, but purchasing, quotations, delivery addresses, and order tracking have not been added to this app yet.'
    },
    loadComponent: () => import('./features/auth/access-message.component')
      .then(module => module.AccessMessageComponent)
  },
  {
    path: 'access-denied',
    canActivate: [authenticatedGuard],
    data: {
      roles: ['admin', 'user'],
      title: 'Access denied',
      message: 'Your account does not have permission to open this page.'
    },
    loadComponent: () => import('./features/auth/access-message.component')
      .then(module => module.AccessMessageComponent)
  },
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  {
    path: 'products',
    canActivate: [authenticatedGuard, permissionGuard],
    data: { permission: 'products.read' },
    loadComponent: () => import('./features/products/product-list.component')
      .then(module => module.ProductListComponent),
  },
  {
    path: 'create',
    canActivate: [authenticatedGuard, permissionGuard],
    data: { permission: 'products.create' },
    loadComponent: () => import('./features/products/product-add-edit-form.component')
      .then(module => module.ProductAddEditFormComponent),
  },
  {
    path: 'edit/:id',
    canActivate: [authenticatedGuard, permissionGuard],
    data: { permission: 'products.update' },
    loadComponent: () => import('./features/products/product-add-edit-form.component')
      .then(module => module.ProductAddEditFormComponent),
  },
  {
    path: 'categories',
    canActivate: [authenticatedGuard, permissionGuard],
    data: { permission: 'categories.read' },
    loadComponent: () => import('./features/categories/category-list.component')
      .then(module => module.CategoryListComponent),
  },
  {
    path: 'categories/create',
    canActivate: [authenticatedGuard, permissionGuard],
    data: { permission: 'categories.create' },
    loadComponent: () => import('./features/categories/category-form.component')
      .then(module => module.CategoryFormComponent),
  },
  {
    path: 'categories/:id/edit',
    canActivate: [authenticatedGuard, permissionGuard],
    data: { permission: 'categories.update' },
    loadComponent: () => import('./features/categories/category-form.component')
      .then(module => module.CategoryFormComponent),
  },
  {
    path: 'admin/users',
    canActivate: [authenticatedGuard, permissionGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./features/admin/users/user-list.component')
      .then(module => module.UserListComponent)
  },
  {
    path: 'admin/users/new',
    canActivate: [authenticatedGuard, permissionGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./features/admin/users/user-form.component')
      .then(module => module.UserFormComponent)
  },
  {
    path: 'admin/users/:id/edit',
    canActivate: [authenticatedGuard, permissionGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./features/admin/users/user-form.component')
      .then(module => module.UserFormComponent)
  },
  {
    path: 'admin/roles',
    canActivate: [authenticatedGuard, permissionGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./features/admin/roles/role-list.component')
      .then(module => module.RoleListComponent)
  },
  {
    path: 'admin/roles/new',
    canActivate: [authenticatedGuard, permissionGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./features/admin/roles/role-form.component')
      .then(module => module.RoleFormComponent)
  },
  {
    path: 'admin/roles/:id/edit',
    canActivate: [authenticatedGuard, permissionGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./features/admin/roles/role-form.component')
      .then(module => module.RoleFormComponent)
  },
  { path: '**', redirectTo: '' },
];
