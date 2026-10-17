import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import {
  AuthUser,
  AVAILABLE_PERMISSIONS,
  INITIAL_ROLES,
  INITIAL_USERS,
  Permission,
  RoleDefinition,
  RoleInput,
  StoredAuthUser,
  UserInput
} from '../models/auth.model';

const USERS_STORAGE_KEY = 'ecommerce_users';
const ROLES_STORAGE_KEY = 'ecommerce_roles';
const SESSION_STORAGE_KEY = 'ecommerce_session';
const PASSWORD_ITERATIONS = 120_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly usersState = signal<StoredAuthUser[]>([]);
  private readonly rolesState = signal<RoleDefinition[]>([]);
  private readonly currentUserState = signal<AuthUser | null>(null);

  readonly users = computed(() => this.usersState().map(this.toAuthUser));
  readonly roles = this.rolesState.asReadonly();
  readonly currentUser = this.currentUserState.asReadonly();
  readonly currentRole = computed(() => {
    const roleId = this.currentUserState()?.roleId;
    return roleId ? this.rolesState().find(role => role.id === roleId) ?? null : null;
  });
  readonly storageError = signal('');
  readonly permissionOptions = AVAILABLE_PERMISSIONS;

  constructor() {
    if (this.isBrowser) {
      this.restoreLocalState();
    }
  }

  async login(email: string, password: string): Promise<AuthUser | null> {
    if (this.storageError()) {
      throw new Error(this.storageError());
    }

    const normalizedEmail = email.trim().toLocaleLowerCase();
    const account = this.usersState().find(user => user.email.toLocaleLowerCase() === normalizedEmail);
    if (!account || !account.active || !(await this.verifyPassword(password, account))) {
      return null;
    }

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, account.id);
    } catch (error) {
      console.error('Unable to persist the signed-in user.', error);
      throw new Error('Your browser could not save the sign-in session. Check local storage settings and try again.');
    }

    const user = this.toAuthUser(account);
    this.currentUserState.set(user);
    return user;
  }

  logout(): boolean {
    this.currentUserState.set(null);
    if (!this.isBrowser) {
      return true;
    }

    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Unable to clear the saved sign-in session.', error);
      return false;
    }
  }

  hasPermission(permission: Permission): boolean {
    const roleId = this.currentUserState()?.roleId;
    return roleId !== undefined
      && (this.rolesState().find(role => role.id === roleId)?.permissions.includes(permission) ?? false);
  }

  hasRole(roleIds: readonly string[]): boolean {
    const roleId = this.currentUserState()?.roleId;
    return roleId !== undefined && roleIds.includes(roleId);
  }

  roleLabel(roleId: string): string {
    return this.rolesState().find(role => role.id === roleId)?.name ?? 'Unassigned role';
  }

  async createUser(input: UserInput): Promise<AuthUser | undefined> {
    const normalized = this.normalizeUserInput(input);
    if (!this.isSystemAdmin()
      || !normalized.password
      || !this.isValidUser(normalized)
      || this.hasDuplicateEmail(normalized.email)) {
      return undefined;
    }

    const { password, ...userFields } = normalized;
    const passwordDetails = await this.hashPassword(password);
    const user: StoredAuthUser = {
      id: this.createId(),
      ...userFields,
      ...passwordDetails
    };
    this.saveUsers([...this.usersState(), user]);
    return this.toAuthUser(user);
  }

  async updateUser(userId: string, input: UserInput): Promise<boolean> {
    const existing = this.usersState().find(user => user.id === userId);
    const normalized = this.normalizeUserInput(input);
    if (!this.isSystemAdmin()
      || !existing
      || !this.isValidUser(normalized)
      || this.hasDuplicateEmail(normalized.email, userId)
      || (existing.id === this.currentUserState()?.id
        && (normalized.roleId !== existing.roleId || !normalized.active))
      || this.wouldRemoveLastAdmin(existing, normalized.roleId, normalized.active)) {
      return false;
    }

    const { password, ...userFields } = normalized;
    const updatedUser: StoredAuthUser = password
      ? { ...existing, ...userFields, ...(await this.hashPassword(password)) }
      : { ...existing, ...userFields };
    this.saveUsers(this.usersState().map(user => user.id === userId ? updatedUser : user));

    if (this.currentUserState()?.id === userId) {
      this.currentUserState.set(this.toAuthUser(updatedUser));
    }
    return true;
  }

  deleteUser(userId: string): boolean {
    const user = this.usersState().find(candidate => candidate.id === userId);
    if (!this.isSystemAdmin()
      || !user
      || user.id === this.currentUserState()?.id
      || this.wouldRemoveLastAdmin(user, '', false)) {
      return false;
    }

    this.saveUsers(this.usersState().filter(candidate => candidate.id !== userId));
    return true;
  }

  createRole(input: RoleInput): RoleDefinition | undefined {
    const normalized = this.normalizeRoleInput(input);
    if (!this.isSystemAdmin() || !this.isValidRole(normalized) || this.hasDuplicateRoleName(normalized.name)) {
      return undefined;
    }

    const role: RoleDefinition = {
      id: this.createId(),
      ...normalized,
      protected: false
    };
    this.saveRoles([...this.rolesState(), role]);
    return role;
  }

  updateRole(roleId: string, input: RoleInput): boolean {
    const existing = this.rolesState().find(role => role.id === roleId);
    const normalized = this.normalizeRoleInput(input);
    if (!this.isSystemAdmin()
      || !existing
      || existing.protected
      || !this.isValidRole(normalized)
      || this.hasDuplicateRoleName(normalized.name, roleId)) {
      return false;
    }

    this.saveRoles(this.rolesState().map(role => role.id === roleId ? { ...existing, ...normalized } : role));
    return true;
  }

  deleteRole(roleId: string): boolean {
    const role = this.rolesState().find(candidate => candidate.id === roleId);
    if (!this.isSystemAdmin()
      || !role
      || role.protected
      || this.usersState().some(user => user.roleId === roleId)) {
      return false;
    }

    this.saveRoles(this.rolesState().filter(candidate => candidate.id !== roleId));
    return true;
  }

  private restoreLocalState(): void {
    try {
      const storedRoles = localStorage.getItem(ROLES_STORAGE_KEY);
      const roles = storedRoles === null ? INITIAL_ROLES : this.parseRoles(storedRoles);
      if (storedRoles === null) {
        this.persist(ROLES_STORAGE_KEY, roles);
      }
      this.rolesState.set(roles);

      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      const users = storedUsers === null ? INITIAL_USERS : this.parseUsers(storedUsers);
      if (storedUsers === null || this.containsLegacyUsers(storedUsers)) {
        this.persist(USERS_STORAGE_KEY, users);
      }
      this.usersState.set(users);

      const sessionUserId = localStorage.getItem(SESSION_STORAGE_KEY);
      const sessionUser = users.find(user => user.id === sessionUserId && user.active);
      if (sessionUser && roles.some(role => role.id === sessionUser.roleId)) {
        this.currentUserState.set(this.toAuthUser(sessionUser));
      } else if (sessionUserId !== null) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Unable to restore local authentication data.', error);
      this.storageError.set('Local user or role data could not be loaded. Clear the ecommerce_users, ecommerce_roles, and ecommerce_session local storage entries, then reload.');
    }
  }

  private parseUsers(serialized: string): StoredAuthUser[] {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      throw new Error('Saved user data must be an array.');
    }
    return parsed.map(user => this.migrateUser(user));
  }

  private migrateUser(value: unknown): StoredAuthUser {
    if (typeof value !== 'object' || value === null) {
      throw new Error('Saved user data is invalid.');
    }
    const user = value as Record<string, unknown>;
    const roleId = user['roleId'] ?? user['role'];
    const active = user['active'] ?? true;
    if (typeof user['id'] !== 'string'
      || typeof user['displayName'] !== 'string'
      || typeof user['email'] !== 'string'
      || typeof user['passwordSalt'] !== 'string'
      || typeof user['passwordHash'] !== 'string'
      || typeof roleId !== 'string'
      || typeof active !== 'boolean') {
      throw new Error('Saved user data is invalid.');
    }

    return {
      id: user['id'],
      displayName: user['displayName'],
      email: user['email'],
      roleId,
      active,
      passwordSalt: user['passwordSalt'],
      passwordHash: user['passwordHash']
    };
  }

  private parseRoles(serialized: string): RoleDefinition[] {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed) || !parsed.every(role => this.isStoredRole(role))) {
      throw new Error('Saved role data is invalid.');
    }
    return parsed;
  }

  private isStoredRole(value: unknown): value is RoleDefinition {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const role = value as Record<string, unknown>;
    return typeof role['id'] === 'string'
      && typeof role['name'] === 'string'
      && typeof role['description'] === 'string'
      && typeof role['protected'] === 'boolean'
      && Array.isArray(role['permissions'])
      && role['permissions'].every(permission => this.isPermission(permission));
  }

  private isPermission(value: unknown): value is Permission {
    return AVAILABLE_PERMISSIONS.some(permission => permission.id === value);
  }

  private containsLegacyUsers(serialized: string): boolean {
    const parsed: unknown = JSON.parse(serialized);
    return Array.isArray(parsed) && parsed.some(user =>
      typeof user === 'object' && user !== null && 'role' in user && !('roleId' in user)
    );
  }

  private normalizeUserInput(input: UserInput): UserInput {
    return {
      displayName: input.displayName.trim(),
      email: input.email.trim().toLocaleLowerCase(),
      password: input.password,
      roleId: input.roleId,
      active: input.active
    };
  }

  private isValidUser(input: UserInput): boolean {
    return input.displayName.length > 0
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)
      && (input.password.length === 0 || input.password.length >= 8)
      && this.rolesState().some(role => role.id === input.roleId);
  }

  private normalizeRoleInput(input: RoleInput): RoleInput {
    return {
      name: input.name.trim(),
      description: input.description.trim(),
      permissions: [...new Set(input.permissions)]
    };
  }

  private isValidRole(input: RoleInput): boolean {
    return input.name.length > 0 && input.permissions.every(permission => this.isPermission(permission));
  }

  private hasDuplicateEmail(email: string, excludingId?: string): boolean {
    return this.usersState().some(user =>
      user.id !== excludingId && user.email.toLocaleLowerCase() === email
    );
  }

  private hasDuplicateRoleName(name: string, excludingId?: string): boolean {
    return this.rolesState().some(role =>
      role.id !== excludingId && role.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    );
  }

  private isSystemAdmin(): boolean {
    return this.currentUserState()?.roleId === 'admin';
  }

  private wouldRemoveLastAdmin(user: StoredAuthUser, nextRoleId: string, nextActive: boolean): boolean {
    if (!user.active || user.roleId !== 'admin' || (nextRoleId === 'admin' && nextActive)) {
      return false;
    }
    return this.usersState().filter(account => account.active && account.roleId === 'admin').length <= 1;
  }

  private saveUsers(users: StoredAuthUser[]): void {
    this.persist(USERS_STORAGE_KEY, users);
    this.usersState.set(users);
  }

  private saveRoles(roles: RoleDefinition[]): void {
    this.persist(ROLES_STORAGE_KEY, roles);
    this.rolesState.set(roles);
  }

  private persist(key: string, value: unknown): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Unable to save ${key}.`, error);
      throw new Error('Browser storage could not save your changes. Check local storage availability and try again.');
    }
  }

  private async hashPassword(password: string): Promise<Pick<StoredAuthUser, 'passwordSalt' | 'passwordHash'>> {
    if (!password) {
      throw new Error('A password is required for a new user.');
    }
    const cryptoApi = globalThis.crypto;
    if (!cryptoApi?.subtle) {
      throw new Error('Secure password verification is unavailable in this browser.');
    }

    const salt = cryptoApi.getRandomValues(new Uint8Array(16));
    const key = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const derivedBits = await cryptoApi.subtle.deriveBits({
      name: 'PBKDF2',
      salt,
      iterations: PASSWORD_ITERATIONS,
      hash: 'SHA-256'
    }, key, 256);
    return {
      passwordSalt: this.toBase64(salt),
      passwordHash: this.toBase64(new Uint8Array(derivedBits))
    };
  }

  private async verifyPassword(password: string, user: StoredAuthUser): Promise<boolean> {
    const cryptoApi = globalThis.crypto;
    if (!cryptoApi?.subtle) {
      throw new Error('Secure password verification is unavailable in this browser.');
    }
    const key = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const derivedBits = await cryptoApi.subtle.deriveBits({
      name: 'PBKDF2',
      salt: this.passwordSaltBuffer(user.passwordSalt),
      iterations: PASSWORD_ITERATIONS,
      hash: 'SHA-256'
    }, key, 256);
    return this.toBase64(new Uint8Array(derivedBits)) === user.passwordHash;
  }

  private toBase64(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  private fromBase64(value: string): Uint8Array {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  private passwordSaltBuffer(value: string): ArrayBuffer {
    const bytes = value.includes('-')
      ? new TextEncoder().encode(value)
      : this.fromBase64(value);
    const buffer = new ArrayBuffer(bytes.length);
    new Uint8Array(buffer).set(bytes);
    return buffer;
  }

  private createId(): string {
    return globalThis.crypto.randomUUID();
  }

  private toAuthUser(user: StoredAuthUser): AuthUser {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      roleId: user.roleId,
      active: user.active
    };
  }
}
