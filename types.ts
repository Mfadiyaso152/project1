export interface DocumentState {
  original: string | null;
  template: string | null;
  stamp: string | null;
}

export interface StampPosition {
  x: number;
  y: number;
  size: number;
}

export enum Step {
  UPLOAD = 'UPLOAD',
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW'
}
