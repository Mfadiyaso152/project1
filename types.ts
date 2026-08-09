export interface DocumentFileItem {
  id: string;
  name: string;
  pages: string[];
}

export interface DocumentState {
  original: string | null;
  originalPages: string[];
  files: DocumentFileItem[];
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
  UPLOAD = 'UPLOAD',
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW'
}
