export type Effect = 'none' | 'crossfade' | 'blur' | 'zoom';
export type Filter = 'none' | 'intense' | 'cool';
export type SortMode = 'name' | 'color' | 'added' | 'custom';
export type ShuffleMode = 'off' | 'random' | 'evenColor' | 'gradient';
export type PipRatio = 'fit' | 'half-full' | 'full' | 'dynamic';
export type Theme = 'dark' | 'light';
export type Temp = 'warm' | 'cool' | 'neutral';

export interface Frame {
  id: string;
  name: string;
  groupName: string;
  hue: number;
  temp: Temp;
  starred?: boolean;
  order?: number;
  addedAt: number;
  src?: string;
  blob?: Blob;
}

export interface Album {
  id: string;
  name: string;
  frames: Frame[];
  settings?: Partial<PlayerSettings>;
  audioId?: string | null;
  coverFrameId?: string;
}

export interface PlayerSettings {
  speedMs: number;
  effect: Effect;
  filter: Filter;
  sort: SortMode;
  shuffle: ShuffleMode;
  ambient: boolean;
  scaleCover: boolean;
}

export interface PipSettings {
  ratioMode: PipRatio;
  syncZoom: boolean;
  showInfo: boolean;
}

export interface AppSettings {
  player: PlayerSettings;
  pip: PipSettings;
  theme: Theme;
  masterZoom: number;
  uiIdleMs: number;
}
