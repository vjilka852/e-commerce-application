import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.removeItem('ecommerce_users');
    localStorage.removeItem('ecommerce_session');
    localStorage.setItem('ecommerce_session', 'demo-user');
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.removeItem('ecommerce_users');
    localStorage.removeItem('ecommerce_session');
    TestBed.resetTestingModule();
  });

  it('restores the signed-in user and restricts staff permissions', () => {
    expect(service.currentUser()?.roleId).toBe('user');
    expect(service.hasPermission('products.read')).toBe(true);
    expect(service.hasPermission('products.create')).toBe(true);
    expect(service.hasPermission('products.update')).toBe(true);
    expect(service.hasPermission('products.delete')).toBe(false);
    expect(service.hasPermission('categories.read')).toBe(true);
    expect(service.hasPermission('categories.delete')).toBe(false);
  });

  it('does not expose password hashes through the public user list', () => {
    expect(service.users()).toHaveLength(3);
    expect(JSON.stringify(service.users())).not.toContain('passwordHash');
    expect(JSON.stringify(service.users())).not.toContain('passwordSalt');
  });

  it('clears the persisted session when logging out', () => {
    expect(service.logout()).toBe(true);
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('ecommerce_session')).toBeNull();
  });

  it('does not allow staff to manage users or roles', () => {
    expect(service.createRole({ name: 'Manager', description: '', permissions: ['products.read'] })).toBeUndefined();
    expect(service.deleteUser('demo-client')).toBe(false);
    expect(service.deleteRole('client')).toBe(false);
  });

  it('protects the built-in Admin role', () => {
    expect(service.updateRole('admin', {
      name: 'Renamed Admin',
      description: 'Changed',
      permissions: []
    })).toBe(false);
    expect(service.deleteRole('admin')).toBe(false);
    expect(service.roles().find(role => role.id === 'admin')?.protected).toBe(true);
  });
});
