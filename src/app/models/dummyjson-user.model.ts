export type DummyJsonUserRole = 'admin' | 'moderator' | 'user';

export interface DummyJsonCoordinates {
  lat: number;
  lng: number;
}

export interface DummyJsonAddress {
  address: string;
  city: string;
  state: string;
  stateCode: string;
  postalCode: string;
  coordinates: DummyJsonCoordinates;
  country: string;
}

export interface DummyJsonHair {
  color: string;
  type: string;
}

export interface DummyJsonBank {
  cardExpire: string;
  cardNumber: string;
  cardType: string;
  currency: string;
  iban: string;
}

export interface DummyJsonCompany {
  department: string;
  name: string;
  title: string;
  address: DummyJsonAddress;
}

export interface DummyJsonCrypto {
  coin: string;
  wallet: string;
  network: string;
}

export interface DummyJsonUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  maidenName?: string;
  age?: number;
  gender?: string;
  phone?: string;
  birthDate?: string;
  image?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  eyeColor?: string;
  hair?: DummyJsonHair;
  ip?: string;
  address?: DummyJsonAddress;
  macAddress?: string;
  university?: string;
  bank?: DummyJsonBank;
  company?: DummyJsonCompany;
  ein?: string;
  ssn?: string;
  userAgent?: string;
  crypto?: DummyJsonCrypto;
  role: DummyJsonUserRole;
}

export interface DummyJsonUsersResponse {
  users: DummyJsonUser[];
  total: number;
  skip: number;
  limit: number;
}

export interface DummyJsonUserInput {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password?: string;
  role: DummyJsonUserRole;
}

export interface ManagedUserRow {
  id: string;
  displayName: string;
  email: string;
  roleName: string;
  active: boolean;
  source: 'local' | 'api';
}
