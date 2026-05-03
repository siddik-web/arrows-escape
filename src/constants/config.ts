import type { Direction, Vector, Theme } from '../types/game';

export const DIRECTIONS: Record<Direction, Vector> = {
  UP: { dx: 0, dy: -1, angle: -Math.PI / 2 },
  DOWN: { dx: 0, dy: 1, angle: Math.PI / 2 },
  LEFT: { dx: -1, dy: 0, angle: Math.PI },
  RIGHT: { dx: 1, dy: 0, angle: 0 },
};

export const THEMES: Theme[] = [
  {
    name: "NEON",
    bg: "#000000",
    colors: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#A855F7"],
  },
  {
    name: "PASTEL",
    bg: "#0F172A",
    colors: ["#93C5FD", "#FCA5A5", "#86EFAC", "#FDE047", "#D8B4FE"],
  },
  {
    name: "MONO",
    bg: "#18181B",
    colors: ["#FFFFFF", "#D4D4D8", "#A1A1AA", "#71717A", "#E4E4E7"],
  },
];

export const SHOP_ITEMS = {
  skins: [
    { id: "classic", name: "CLASSIC", cost: 0, desc: "Original shape." },
    { id: "stealth", name: "STEALTH", cost: 1000, desc: "Swept wings." },
    { id: "dot", name: "NEON DOT", cost: 2500, desc: "Minimalist core." },
  ],
  trails: [
    { id: "basic", name: "BASIC", cost: 0, desc: "Colored sparks." },
    { id: "inferno", name: "INFERNO", cost: 1500, desc: "Fire mix." },
    { id: "rainbow", name: "PRISM", cost: 3500, desc: "RGB cycling." },
  ],
};

export const REVIVE_COST = 500;
export const COMBO_TIMEOUT = 2000;
export const TOTAL_LEVELS = 100;

export const ARROW_TYPES_CONFIG = {
  BOMB: { color: '#EF4444' },
  ICE: { color: '#A5F3FC', taps: 2 },
  STONE: { color: '#78716C' },
  LOCK: { color: '#F59E0B' },
  KEY: { color: '#FBBF24' },
};

export const CHALLENGE_THRESHOLDS = {
  BOMB: 3,
  ICE: 5,
  STONE: 8,
  LOCK_KEY: 10,
};
