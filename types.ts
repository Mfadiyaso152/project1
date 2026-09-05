export interface DocumentState {
  original: string | null;
  originalPages: string[];
  template: string | null;
  templatePages: string[];
  stamp: string | null;
  signature: string | null;
}

export interface StampPosition {
  x: number;
  y: number;
  size: number;
  enabled: boolean;
}

export enum Step {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  UPLOAD = 'UPLOAD',
  EDITOR = 'EDITOR',
  ACCOUNT = 'ACCOUNT',
  ADMIN_USERS = 'ADMIN_USERS'
}

export type ThemePreference = 'default-light' | 'space-dark' | 'snap-yellow';

export interface SavedAssets {
  template: string | null;
  stamp: string | null;
  signature: string | null;
}

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  dob?: string;
  phone?: string;
  avatar?: string;
  authProvider: 'email' | 'google';
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
  theme: ThemePreference;
  savedAssets: SavedAssets;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  googleUsers: number;
}
