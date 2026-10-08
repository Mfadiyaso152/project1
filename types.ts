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
  ABOUT = 'ABOUT',
  AUTH = 'AUTH',
  SURVEY = 'SURVEY',
  UPLOAD = 'UPLOAD',
  EDITOR = 'EDITOR',
  ACCOUNT = 'ACCOUNT',
  ASSETS = 'ASSETS'
}

export type ThemePreference = 'default-light' | 'space-dark' | 'snap-yellow';

export interface SavedAssets {
  template: string | null;
  stamp: string | null;
  signature: string | null;
}

export interface SurveyData {
  howDidYouHear: string;
  dob: string;
  phone: string;
  usageType: string;
  completedAt: string;
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
  surveyCompleted?: boolean;
  surveyData?: SurveyData;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  googleUsers: number;
}
