import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { INITIAL_ROLES, INITIAL_USERS } from '../models/auth.model';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('ecommerce_users');
    localStorage.removeItem('ecommerce_roles');
    localStorage.removeItem('ecommerce_session');
    localStorage.removeItem('ecommerce_remote_session');
    localStorage.setItem('ecommerce_session', 'demo-user');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem('ecommerce_users');
    localStorage.removeItem('ecommerce_roles');
    localStorage.removeItem('ecommerce_session');
    localStorage.removeItem('ecommerce_remote_session');
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

  it('authenticates DummyJSON users and stores a least-privileged session', async () => {
    localStorage.removeItem('ecommerce_session');
    const login = service.login('emilys', 'emilyspass');
    const request = httpTesting.expectOne('https://dummyjson.com/auth/login');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      username: 'emilys',
      password: 'emilyspass',
      expiresInMins: 30
    });
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      id: 1,
      username: 'emilys',
      email: 'emily.johnson@x.dummyjson.com',
      firstName: 'Emily',
      lastName: 'Johnson',
      accessToken: 'access-token',
      refreshToken: 'refresh-token'
    });

    const user = await login;
    expect(user).toEqual({
      id: 'dummyjson:1',
      displayName: 'Emily Johnson',
      email: 'emily.johnson@x.dummyjson.com',
      roleId: 'client',
      active: true
    });
    expect(service.currentUser()).toEqual(user);
    expect(service.accessToken()).toBe('access-token');
    expect(localStorage.getItem('ecommerce_session')).toBe('dummyjson:1');

    httpTesting.verify();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
    expect(service.currentUser()).toEqual(user);
    expect(service.accessToken()).toBe('access-token');

    expect(service.logout()).toBe(true);
    expect(localStorage.getItem('ecommerce_remote_session')).toBeNull();
    expect(service.accessToken()).toBeNull();
  });

  it('returns null when DummyJSON rejects the credentials', async () => {
    service.logout();
    localStorage.removeItem('ecommerce_session');
    const login = service.login('unknown-user', 'wrong-password');
    httpTesting.expectOne('https://dummyjson.com/auth/login').flush(
      { message: 'Invalid credentials' },
      { status: 400, statusText: 'Bad Request' }
    );

    await expect(login).resolves.toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('does not allow staff to manage users or roles', () => {
    expect(service.createRole({ name: 'Manager', description: '', permissions: ['products.read'] })).toBeUndefined();
    expect(service.deleteUser('demo-client')).toBe(false);
    expect(service.deleteRole('client')).toBe(false);
  });

  it('recognizes a role named Admin for the administration menu and guards', () => {
    service.logout();
    const remappedRoles = INITIAL_ROLES.map(role => role.id === 'admin'
      ? { ...role, id: 'store-admin', name: 'Admin' }
      : role);
    const remappedUsers = INITIAL_USERS.map(user => user.roleId === 'admin'
      ? { ...user, roleId: 'store-admin' }
      : user);
    localStorage.setItem('ecommerce_roles', JSON.stringify(remappedRoles));
    localStorage.setItem('ecommerce_users', JSON.stringify(remappedUsers));
    localStorage.setItem('ecommerce_session', 'demo-admin');

    httpTesting.verify();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);

    expect(service.currentRole()?.name).toBe('Admin');
    expect(service.isAdmin()).toBe(true);
    expect(service.hasRole(['admin'])).toBe(true);
    expect(service.createRole({ name: 'Operations', description: '', permissions: [] })).toBeDefined();
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
