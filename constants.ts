import { CreatureCard, ElementType } from './types';

export const BOARD_SIZE = 20;
export const INITIAL_MANA = 500;
export const MAX_HAND_SIZE = 6;
export const LAP_BONUS = 300;
export const WIN_MANA_TARGET = 2000;

export const ELEMENT_COLORS: Record<ElementType | 'START', string> = {
  [ElementType.FIRE]: 'text-red-500 border-red-500 bg-red-900/20',
  [ElementType.WATER]: 'text-blue-500 border-blue-500 bg-blue-900/20',
  [ElementType.EARTH]: 'text-green-500 border-green-500 bg-green-900/20',
  [ElementType.WIND]: 'text-yellow-500 border-yellow-500 bg-yellow-900/20',
  [ElementType.NEUTRAL]: 'text-gray-400 border-gray-400 bg-gray-900/20',
  'START': 'text-purple-500 border-purple-500 bg-purple-900/20',
};

export const FALLBACK_DECK: Omit<CreatureCard, 'id'>[] = [
  { name: "Flame Wisp", element: ElementType.FIRE, cost: 30, st: 20, hp: 20, mhp: 20, description: "A small ball of fire." },
  { name: "Goblin Fighter", element: ElementType.EARTH, cost: 40, st: 30, hp: 30, mhp: 30, description: "Scrappy fighter." },
  { name: "Water Sprite", element: ElementType.WATER, cost: 30, st: 10, hp: 40, mhp: 40, description: "Hard to hit." },
  { name: "Wind Eagle", element: ElementType.WIND, cost: 50, st: 35, hp: 25, mhp: 25, description: "Strikes from above." },
  { name: "Magma Golem", element: ElementType.FIRE, cost: 80, st: 50, hp: 50, mhp: 50, description: "Heavy hitter." },
  { name: "Ice Wall", element: ElementType.WATER, cost: 60, st: 0, hp: 60, mhp: 60, description: "Pure defense." },
  { name: "Tree Ent", element: ElementType.EARTH, cost: 90, st: 40, hp: 70, mhp: 70, description: "Deep roots." },
  { name: "Storm Djinn", element: ElementType.WIND, cost: 100, st: 55, hp: 40, mhp: 40, description: "Master of storms." },
  { name: "Skeleton", element: ElementType.NEUTRAL, cost: 20, st: 20, hp: 10, mhp: 10, description: "Weak but cheap." },
  { name: "Dragon Hatchling", element: ElementType.FIRE, cost: 120, st: 60, hp: 50, mhp: 50, description: "Growing power." },
];