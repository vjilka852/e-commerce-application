export type UserRole = string;

export type Permission =
  | 'products.read'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'categories.read'
  | 'categories.create'
  | 'categories.update'
  | 'categories.delete';

export interface PermissionOption {
  id: Permission;
  label: string;
  module: string;
}

export const AVAILABLE_PERMISSIONS: readonly PermissionOption[] = [
  { id: 'products.read', label: 'View products', module: 'Products' },
  { id: 'products.create', label: 'Add products', module: 'Products' },
  { id: 'products.update', label: 'Edit products', module: 'Products' },
  { id: 'products.delete', label: 'Delete products', module: 'Products' },
  { id: 'categories.read', label: 'View categories', module: 'Categories' },
  { id: 'categories.create', label: 'Add categories', module: 'Categories' },
  { id: 'categories.update', label: 'Edit categories', module: 'Categories' },
  { id: 'categories.delete', label: 'Delete categories', module: 'Categories' }
];

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  protected: boolean;
}

export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  roleId: UserRole;
  active: boolean;
}

export interface StoredAuthUser extends AuthUser {
  passwordSalt: string;
  passwordHash: string;
}

export interface UserInput {
  displayName: string;
  email: string;
  password: string;
  roleId: string;
  active: boolean;
}

export interface RoleInput {
  name: string;
  description: string;
  permissions: Permission[];
}

export interface StoredLegacyUser extends Omit<StoredAuthUser, 'roleId' | 'active'> {
  role: string;
}

export const INITIAL_ROLES: RoleDefinition[] = [
  {
    id: 'admin',
    name: 'System Administrator',
    description: 'Full access to all product and category operations and account administration.',
    permissions: AVAILABLE_PERMISSIONS.map(permission => permission.id),
    protected: true
  },
  {
    id: 'user',
    name: 'Internal Staff',
    description: 'Can view, add, and edit products and categories.',
    permissions: [
      'products.read', 'products.create', 'products.update',
      'categories.read', 'categories.create', 'categories.update'
    ],
    protected: false
  },
  {
    id: 'client',
    name: 'Client / Customer',
    description: 'Purchasing and account features will be available in a future phase.',
    permissions: [],
    protected: false
  }
];

export const INITIAL_USERS: StoredAuthUser[] = [
  {
    id: 'demo-admin',
    displayName: 'System Admin',
    email: 'admin@ecommerce.local',
    roleId: 'admin',
    active: true,
    passwordSalt: 'ecommerce-local-demo-admin-v1',
    passwordHash: 'bw1SFdWtONTcFns07/nY5xe7AGgyfUhlx6PEajJ+aBY='
  },
  {
    id: 'demo-user',
    displayName: 'Store Staff',
    email: 'staff@ecommerce.local',
    roleId: 'user',
    active: true,
    passwordSalt: 'ecommerce-local-demo-staff-v1',
    passwordHash: 'LyVy5EenRxejH03/Xw306+AK0tijwe8L+GI/GXL1/og='
  },
  {
    id: 'demo-client',
    displayName: 'Demo Customer',
    email: 'customer@ecommerce.local',
    roleId: 'client',
    active: true,
    passwordSalt: 'ecommerce-local-demo-customer-v1',
    passwordHash: 'giQJZtZsS+woTXVqD1RBIc+a5OBwf6D/GVxMfVK6CaA='
  }
];
