import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { enviornment } from '../../environments/environment';
import {
  DummyJsonUser,
  DummyJsonUserInput,
  DummyJsonUserRole,
  DummyJsonUsersResponse
} from '../models/dummyjson-user.model';

@Injectable({ providedIn: 'root' })
export class DummyJsonUserService {
  private readonly http = inject(HttpClient);
  private readonly api = `${enviornment.apiUrl}/users`;
  private readonly usersState = signal<DummyJsonUser[]>([]);
  private readonly totalState = signal(0);
  private readonly hasLoadedState = signal(false);

  readonly users = this.usersState.asReadonly();
  readonly total = this.totalState.asReadonly();

  async loadUsers(force = false): Promise<void> {
    if (this.hasLoadedState() && !force) {
      return;
    }

    let response: DummyJsonUsersResponse;
    try {
      response = await firstValueFrom(
        this.http.get<DummyJsonUsersResponse>(`${this.api}?limit=0`)
      );
    } catch (error) {
      console.error('Unable to load users from DummyJSON.', error);
      throw this.toUserError(error, 'Users could not be loaded.');
    }

    if (!this.isUsersResponse(response)) {
      throw new Error('The users service returned an invalid response.');
    }
    this.usersState.set(response.users.map(user => this.toSafeUser(user)));
    this.totalState.set(response.total);
    this.hasLoadedState.set(true);
  }

  async searchUsers(query: string, key = ''): Promise<DummyJsonUser[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return this.usersState();
    }

    const url = key
      ? `${this.api}/filter?key=${encodeURIComponent(key)}&value=${encodeURIComponent(normalizedQuery)}`
      : `${this.api}/search?q=${encodeURIComponent(normalizedQuery)}`;
    let response: DummyJsonUsersResponse;
    try {
      response = await firstValueFrom(this.http.get<DummyJsonUsersResponse>(url));
    } catch (error) {
      console.error('Unable to search DummyJSON users.', error);
      throw this.toUserError(error, 'Users could not be searched.');
    }

    if (!this.isUsersResponse(response)) {
      throw new Error('The user search service returned an invalid response.');
    }
    return response.users.map(user => this.toSafeUser(user));
  }

  async getUser(id: number): Promise<DummyJsonUser> {
    let response: DummyJsonUser;
    try {
      response = await firstValueFrom(this.http.get<DummyJsonUser>(`${this.api}/${id}`));
    } catch (error) {
      console.error(`Unable to load user ${id} from DummyJSON.`, error);
      throw this.toUserError(error, 'User details could not be loaded.');
    }

    if (!this.isUser(response)) {
      throw new Error('The users service returned an invalid user.');
    }
    const user = this.toSafeUser(response);
    this.upsertUser(user);
    return user;
  }

  async createUser(input: DummyJsonUserInput): Promise<DummyJsonUser> {
    if (!this.hasLoadedState()) {
      await this.loadUsers();
    }
    let response: DummyJsonUser;
    try {
      response = await firstValueFrom(this.http.post<DummyJsonUser>(`${this.api}/add`, input));
    } catch (error) {
      console.error('Unable to create a user through DummyJSON.', error);
      throw this.toUserError(error, 'The user could not be created.');
    }

    if (!this.isUser(response)) {
      throw new Error('The users service returned an invalid created user.');
    }
    const user = this.toSafeUser(response);
    this.upsertUser(user);
    this.totalState.update(total => total + 1);
    return user;
  }

  async updateUser(id: number, input: DummyJsonUserInput): Promise<DummyJsonUser> {
    if (!this.hasLoadedState()) {
      await this.loadUsers();
    }
    const fields = {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      username: input.username,
      role: input.role
    };
    let response: DummyJsonUser;
    try {
      response = await firstValueFrom(this.http.patch<DummyJsonUser>(`${this.api}/${id}`, fields));
    } catch (error) {
      console.error(`Unable to update user ${id} through DummyJSON.`, error);
      throw this.toUserError(error, 'The user could not be updated.');
    }

    if (!this.isUser(response)) {
      throw new Error('The users service returned an invalid updated user.');
    }
    const user = this.toSafeUser(response);
    this.upsertUser(user);
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    if (!this.hasLoadedState()) {
      await this.loadUsers();
    }
    let response: { id: number; isDeleted?: boolean };
    try {
      response = await firstValueFrom(this.http.delete<{ id: number; isDeleted?: boolean }>(`${this.api}/${id}`));
    } catch (error) {
      console.error(`Unable to delete user ${id} through DummyJSON.`, error);
      throw this.toUserError(error, 'The user could not be deleted.');
    }

    if (response?.id !== id || response.isDeleted !== true) {
      throw new Error('The users service did not confirm the user deletion.');
    }
    this.usersState.update(users => users.filter(user => user.id !== id));
    this.totalState.update(total => Math.max(0, total - 1));
  }

  private upsertUser(user: DummyJsonUser): void {
    this.usersState.update(users => {
      const index = users.findIndex(existing => existing.id === user.id);
      if (index === -1) {
        return [user, ...users];
      }
      return users.map(existing => existing.id === user.id ? user : existing);
    });
  }

  private isUsersResponse(value: unknown): value is DummyJsonUsersResponse {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const response = value as Record<string, unknown>;
    return Array.isArray(response['users'])
      && response['users'].every(user => this.isUser(user))
      && typeof response['total'] === 'number'
      && Number.isInteger(response['total'])
      && typeof response['skip'] === 'number'
      && typeof response['limit'] === 'number';
  }

  private isUser(value: unknown): value is DummyJsonUser {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const user = value as Record<string, unknown>;
    return typeof user['id'] === 'number'
      && Number.isInteger(user['id'])
      && typeof user['firstName'] === 'string'
      && typeof user['lastName'] === 'string'
      && typeof user['email'] === 'string'
      && typeof user['username'] === 'string'
      && this.isOptionalString(user['maidenName'])
      && this.isOptionalNumber(user['age'])
      && this.isOptionalString(user['gender'])
      && (user['phone'] === undefined || typeof user['phone'] === 'string')
      && this.isOptionalString(user['birthDate'])
      && (user['image'] === undefined || typeof user['image'] === 'string')
      && this.isOptionalString(user['bloodGroup'])
      && this.isOptionalNumber(user['height'])
      && this.isOptionalNumber(user['weight'])
      && this.isOptionalString(user['eyeColor'])
      && (user['hair'] === undefined || this.isHair(user['hair']))
      && this.isOptionalString(user['ip'])
      && (user['address'] === undefined || this.isAddress(user['address']))
      && this.isOptionalString(user['macAddress'])
      && this.isOptionalString(user['university'])
      && (user['bank'] === undefined || this.isBank(user['bank']))
      && (user['company'] === undefined || this.isCompany(user['company']))
      && this.isOptionalString(user['ein'])
      && this.isOptionalString(user['ssn'])
      && this.isOptionalString(user['userAgent'])
      && (user['crypto'] === undefined || this.isCrypto(user['crypto']))
      && this.isRole(user['role']);
  }

  private isOptionalString(value: unknown): boolean {
    return value === undefined || typeof value === 'string';
  }

  private isOptionalNumber(value: unknown): boolean {
    return value === undefined || (typeof value === 'number' && Number.isFinite(value));
  }

  private isHair(value: unknown): boolean {
    return this.isRecord(value)
      && typeof value['color'] === 'string'
      && typeof value['type'] === 'string';
  }

  private isAddress(value: unknown): boolean {
    if (!this.isRecord(value) || !this.isRecord(value['coordinates'])) {
      return false;
    }
    const coordinates = value['coordinates'];
    return ['address', 'city', 'state', 'stateCode', 'postalCode', 'country']
      .every(key => typeof value[key] === 'string')
      && typeof coordinates['lat'] === 'number'
      && typeof coordinates['lng'] === 'number';
  }

  private isBank(value: unknown): boolean {
    return this.isRecord(value)
      && ['cardExpire', 'cardNumber', 'cardType', 'currency', 'iban']
        .every(key => typeof value[key] === 'string');
  }

  private isCompany(value: unknown): boolean {
    return this.isRecord(value)
      && typeof value['department'] === 'string'
      && typeof value['name'] === 'string'
      && typeof value['title'] === 'string'
      && this.isAddress(value['address']);
  }

  private isCrypto(value: unknown): boolean {
    return this.isRecord(value)
      && typeof value['coin'] === 'string'
      && typeof value['wallet'] === 'string'
      && typeof value['network'] === 'string';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isRole(value: unknown): value is DummyJsonUserRole {
    return value === 'admin' || value === 'moderator' || value === 'user';
  }

  private toSafeUser(user: DummyJsonUser): DummyJsonUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      ...(user.maidenName !== undefined ? { maidenName: user.maidenName } : {}),
      ...(user.age !== undefined ? { age: user.age } : {}),
      ...(user.gender !== undefined ? { gender: user.gender } : {}),
      ...(user.phone !== undefined ? { phone: user.phone } : {}),
      ...(user.birthDate !== undefined ? { birthDate: user.birthDate } : {}),
      ...(user.image !== undefined ? { image: user.image } : {}),
      ...(user.bloodGroup !== undefined ? { bloodGroup: user.bloodGroup } : {}),
      ...(user.height !== undefined ? { height: user.height } : {}),
      ...(user.weight !== undefined ? { weight: user.weight } : {}),
      ...(user.eyeColor !== undefined ? { eyeColor: user.eyeColor } : {}),
      ...(user.hair ? { hair: { ...user.hair } } : {}),
      ...(user.ip !== undefined ? { ip: user.ip } : {}),
      ...(user.address ? { address: { ...user.address, coordinates: { ...user.address.coordinates } } } : {}),
      ...(user.macAddress !== undefined ? { macAddress: user.macAddress } : {}),
      ...(user.university !== undefined ? { university: user.university } : {}),
      ...(user.bank ? {
        bank: {
          ...user.bank,
          cardNumber: this.maskSensitiveValue(user.bank.cardNumber),
          iban: this.maskSensitiveValue(user.bank.iban)
        }
      } : {}),
      ...(user.company ? {
        company: {
          ...user.company,
          address: { ...user.company.address, coordinates: { ...user.company.address.coordinates } }
        }
      } : {}),
      ...(user.ein !== undefined ? { ein: this.maskEin(user.ein) } : {}),
      ...(user.ssn !== undefined ? { ssn: this.maskSsn(user.ssn) } : {}),
      ...(user.userAgent !== undefined ? { userAgent: user.userAgent } : {}),
      ...(user.crypto ? {
        crypto: {
          ...user.crypto,
          wallet: this.maskSensitiveValue(user.crypto.wallet)
        }
      } : {}),
      role: user.role
    };
  }

  private maskSensitiveValue(value: string): string {
    const visibleSuffix = value.replace(/\s/g, '').slice(-4);
    return visibleSuffix ? `•••• ${visibleSuffix}` : '••••';
  }

  private maskSsn(value: string): string {
    const visibleSuffix = value.replace(/\D/g, '').slice(-4);
    return visibleSuffix ? `•••-••-${visibleSuffix}` : '•••-••-••••';
  }

  private maskEin(value: string): string {
    const visibleSuffix = value.replace(/\D/g, '').slice(-3);
    return visibleSuffix ? `••-•••${visibleSuffix}` : '••-•••••••';
  }

  private toUserError(error: unknown, fallback: string): Error {
    if (error instanceof HttpErrorResponse) {
      return new Error(error.status
        ? `${fallback} The API returned status ${error.status}.`
        : `${fallback} Check your network connection and try again.`);
    }
    return error instanceof Error ? error : new Error(fallback);
  }
}
