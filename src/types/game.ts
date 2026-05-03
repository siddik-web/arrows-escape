export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Vector {
  dx: number;
  dy: number;
  angle: number;
}

export interface Arrow {
  id: number;
  x: number;
  y: number;
  dir: Direction;
  color: string;
  type: 'normal' | 'bomb' | 'ice' | 'lock' | 'key' | 'stone';
  status: 'active' | 'leaving';
  animProgress: number;
  blocked: boolean;
  shakeStart: number;
  isSpinning: boolean;
  spinAngle: number;
  forceUnblocked: boolean;
  isHinted?: boolean;
  tapsRequired?: number; // for ice arrows
  locked?: boolean;      // for lock arrows
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  scale: number;
  vy: number;
}

export interface Theme {
  name: string;
  bg: string;
  colors: string[];
}

export interface PlayerState {
  maxUnlockedLevel: number;
  shards: number;
  unlockedSkins: string[];
  equippedSkin: string;
  unlockedTrails: string[];
  equippedTrail: string;
}
