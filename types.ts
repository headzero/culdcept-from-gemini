export enum ElementType {
  FIRE = 'FIRE',
  WATER = 'WATER',
  EARTH = 'EARTH',
  WIND = 'WIND',
  NEUTRAL = 'NEUTRAL',
}

export enum GamePhase {
  SETUP = 'SETUP',
  ROLL = 'ROLL',
  MOVE = 'MOVE',
  LAND_ACTION = 'LAND_ACTION',
  BATTLE = 'BATTLE',
  GAME_OVER = 'GAME_OVER',
}

export interface CreatureCard {
  id: string;
  name: string;
  element: ElementType;
  cost: number;
  st: number; // Strength
  hp: number; // Health
  mhp: number; // Max Health (for healing/buffs)
  description: string;
  imageUrl?: string; // Placeholder
}

export interface Tile {
  id: number;
  type: ElementType | 'START';
  ownerId: string | null; // 'player' or 'cpu' or null
  creature: CreatureCard | null;
  level: number; // 1-5, multiplies toll
  baseToll: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  mana: number;
  hand: CreatureCard[];
  deck: CreatureCard[];
  position: number; // Tile Index
  laps: number;
  isCpu: boolean;
}

export interface BattleState {
  attacker: Player;
  defender: Player;
  attackerCard: CreatureCard;
  defenderCard: CreatureCard;
  tileId: number;
  log: string[];
  phase: 'START' | 'ATTACK' | 'COUNTER' | 'END';
  result: 'WIN' | 'LOSS' | 'DRAW' | null;
}

export interface LogEntry {
  turn: number;
  message: string;
  type: 'info' | 'combat' | 'economy';
}