import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { Permission } from '../models/auth.model';

export const authenticatedGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (!user) {
    return true;
  }

  if (authService.hasPermission('products.read')) {
    return router.parseUrl('/products');
  }
  return router.parseUrl(user.roleId === 'client' ? '/customer-access' : '/access-denied');
};

export const permissionGuard: CanActivateFn = route => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (!user) {
    return router.parseUrl('/login');
  }

  const roles = route.data['roles'] as readonly string[] | undefined;
  const permission = route.data['permission'] as Permission | undefined;
  if ((!roles || authService.hasRole(roles)) && (!permission || authService.hasPermission(permission))) {
    return true;
  }

  return router.parseUrl(user.roleId === 'client' ? '/customer-access' : '/access-denied');
};
