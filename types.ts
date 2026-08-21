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
  ADMIN_REQUESTS = 'ADMIN_REQUESTS',
  ADMIN_REVENUE = 'ADMIN_REVENUE',
  ADMIN_CODES = 'ADMIN_CODES',
  ADMIN_USERS = 'ADMIN_USERS'
}

export type PlanType = 'basic' | 'pro' | null;
export type SubscriptionStatus = 'none' | 'pending' | 'active' | 'cancelled';
export type ThemePreference = 'default-light' | 'space-dark' | 'snap-yellow';

export interface SavedAssets {
  template: string | null;
  stamp: string | null;
  signature: string | null;
}

export interface User {
  redeemedCodesHistory?: Array<{ code: string; plan: string; startDate: string; expiryDate: string }>;
  id: string;
  email: string;
  passwordHash: string; // Stored locally
  name: string;
  dob: string;
  phone: string;
  role: 'admin' | 'user';
  plan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: string | null; // ISO string
  createdAt: string;
  theme: ThemePreference;
  savedAssets: SavedAssets;
}

export interface SubscriptionRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  plan: 'basic' | 'pro';
  createdAt: string;
  status: 'pending' | 'completed' | 'rejected';
}

export interface RedemptionCode {
  code: string;
  plan: 'basic' | 'pro';
  durationDays: number;
  createdAt: string;
  isUsed: boolean;
  usedByEmail: string | null;
  usedAt: string | null;
}

export interface SystemStats {
  totalRevenue: number;
}

