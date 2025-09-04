export interface CoreStats {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface Item {
  name: string;
  description: string;
  quantity: number;
  value: number; // Nilai dasar dalam Uang Kepeng
}

export interface Quest {
  name: string;
  description: string;
  status: 'active' | 'completed';
}

export interface Personality {
  traits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
}

export interface Reputation {
    faction: string;
    standing: number; // e.g., -100 to 100
}

export interface SurvivalStatus {
    hunger: number; // 0-100 (100 = full)
    thirst: number; // 0-100 (100 = hydrated)
    fatigue: number; // 0-100 (100 = rested)
}

export interface Character {
  name: string;
  race: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  exp: number;
  expToNextLevel: number;
  uangKepeng: number; // Mata uang dalam game
  stats: CoreStats;
  inventory: Item[];
  quests: Quest[];
  personality: Personality;
  reputation: Reputation[];
  survival: SurvivalStatus;
}

export interface RollResult {
  reason: string;
  roll: number;
  modifier: number;
  total: number;
  dc: number;
  success: boolean;
  critical: 'success' | 'failure' | 'none';
}

export interface OracleResult {
    question: string;
    roll: number; // 1-6
    answer: 'Ya' | 'Mungkin/Rumit' | 'Tidak';
    interpretation: string;
}

export interface NpcRelationship {
    name: string;
    status: string; // Misal: 'Ramah', 'Waspada', 'Bermusuhan'
}

export interface WorldState {
    knownFacts: string[];
    npcRelationships: NpcRelationship[];
}

export type TimeOfDay = 'Pagi' | 'Siang' | 'Sore' | 'Malam';

export interface GameState {
  character: Character;
  worldState: WorldState;
  narrative: string;
  location: string;
  timeOfDay: TimeOfDay;
  currentWeather: string;
  choices: string[];
  rollResult: RollResult | null;
  oracleResult: OracleResult | null;
  log: string[];
}

export enum GameStatus {
  Start,
  Creating,
  Playing,
  Error,
}