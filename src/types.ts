import type { Lang } from './i18n.types';

export type RegionId = string;

export interface RegionGeometry {
  rings: [number, number][][];
  center: [number, number];
  city: string;
  cityAt: [number, number];
  neighbors: RegionId[];
}

export interface Region {
  id: RegionId;
  name: string;
  rajyaName?: string;
  rings: [number, number][][];
  center: [number, number];
  city: string;
  cityAt: [number, number];
  neighbors: RegionId[];
  popM: number;
  wealth: number;
  urban: number;
  hindu: number;
  muslim: number;
  other: number;
  swarna: number;
  unrest: number;
  loyalty: number;
  royalist: number;
  separatist: number;
  reservationHeat: number;
  landHeat: number;
  curfew: boolean;
  kingdom: boolean;
  army: boolean;
}

export type FactionId =
  | 'swaraj'
  | 'kangress'
  | 'swarna'
  | 'bahujan'
  | 'kisan'
  | 'rajwada'
  | 'dravida'
  | 'media'
  | 'army'
  | 'milli';

export interface Faction {
  id: FactionId;
  name: string;
  short: string;
  leader: string;
  power: number;
  mood: number;
}

export type AvatarHat =
  | 'none'
  | 'pagdi'
  | 'cap'
  | 'crown'
  | 'armycap'
  | 'muffler'
  | 'topknot'
  | 'saffronhood'
  | 'coiffure'
  | 'whitestreak'
  | 'scarf';

export interface AvatarSpec {
  skin: string;
  kurta: string;
  hat: AvatarHat;
  hatColor: string;
  beard: 'none' | 'white' | 'dark' | 'stubble';
  glasses: boolean;
  tilak: boolean;
  female: boolean;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  faction: FactionId | 'player';
  persona: string;
  avatar: AvatarSpec;
  alive: boolean;
  mood: number;
}

export type PlayerRoleId = 'strategist' | 'agitator' | 'royalist' | 'oligarch';

export interface PlayerRole {
  id: PlayerRoleId;
  name: string;
  tagline: string;
  winText: string;
  influenceStart: number;
}

export type Movement = 'swarna' | 'bahujan' | 'kisan' | 'students' | 'minority' | 'majority' | 'mixed';

export type WorldOp =
  | { op: 'unrest'; region: RegionId; delta: number; reason?: string }
  | { op: 'loyalty'; region: RegionId; delta: number; reason?: string }
  | { op: 'royalist'; region: RegionId; delta: number; reason?: string }
  | { op: 'separatist'; region: RegionId; delta: number; reason?: string }
  | { op: 'reservationHeat'; region: RegionId; delta: number; reason?: string }
  | { op: 'landHeat'; region: RegionId; delta: number; reason?: string }
  | { op: 'factionPower'; faction: FactionId; delta: number; reason?: string }
  | { op: 'treasury'; delta: number; reason?: string }
  | { op: 'legitimacy'; delta: number; reason?: string }
  | { op: 'curfew'; region: RegionId; on: boolean }
  | { op: 'riot'; region: RegionId; severity: number }
  | { op: 'protest'; region: RegionId; size: number; movement: Movement }
  | { op: 'armyMove'; from: RegionId; to: RegionId }
  | { op: 'restoreroyal'; region: RegionId; king?: string }
  | { op: 'election'; region: RegionId; winner: FactionId }
  | { op: 'character'; id: string; moodDelta?: number; kill?: boolean }
  | { op: 'trust'; id: string; delta: number }
  | { op: 'headline'; text: string };

export interface DialogueLine {
  char: string;
  line: string;
}

export interface Dilemma {
  text: string;
  options: { label: string; ops: WorldOp[] }[];
}

export interface BeatResult {
  beat: string;
  ticker: string[];
  dialogue: DialogueLine[];
  ops: WorldOp[];
  dilemma?: Dilemma;
  source: 'llm' | 'rescue' | 'fallback' | 'system';
  rescueTier?: number;
}

export interface GameEvent {
  turn: number;
  week: number;
  headline: string;
  beat: string;
  kind: 'beat' | 'dialogue' | 'decision' | 'week' | 'headline' | 'ending';
  dialogue?: DialogueLine[];
  ops?: string[];
}

export interface PlayerActionDef {
  id: string;
  label: string;
  icon: string;
  cost: number;
  /** Week-band this action unlocks in (see PHASE_START). Omitted = available from the start. */
  phase?: number;
  usesInfluence?: boolean;
  desc: string;
}

export interface GameState {
  turn: number;
  week: number;
  year: number;
  eta: number;
  role: PlayerRoleId;
  influence: number;
  treasury: number;
  legitimacy: number;
  stability: number;
  regions: Record<RegionId, Region>;
  factions: Record<FactionId, Faction>;
  characters: Record<string, Character>;
  eventLog: GameEvent[];
  pendingDilemma: Dilemma | null;
  trust: Record<string, number>;
  edictLastUsed: Record<string, number>;
  ending: { id: string; title: string; text: string } | null;
  royalPopPct: number;
  nextElectionTurn: number;
}

export type Screen =
  | 'title'
  | 'disclaimer'
  | 'setup'
  | 'game'
  | 'settings'
  | 'codex'
  | 'chronicle'
  | 'ending';

export type Provider = 'anthropic' | 'gemini' | 'openai-compat' | 'offline';

export interface LLMSettings {
  lang: Lang;
  provider: Provider;
  anthropicKey: string;
  anthropicModel: string;
  geminiKey: string;
  geminiModel: string;
  compatBaseUrl: string;
  compatKey: string;
  compatModel: string;
  compatKey2: string;
  compatModel2: string;
  flashModel: string;
  language: string;
  gmDirective: string;
  personaOverrides: Record<string, string>;
  nameOverrides: Record<string, string>;
  customCharacters: Character[];
  rescue: boolean;
}

export interface RescueLogEntry {
  turn: number;
  tier: number;
  originalRequest: string;
  note: string;
}

export interface MapFx {
  id: number;
  kind: 'protest' | 'riot' | 'army' | 'crown' | 'curfew' | 'election';
  region: RegionId;
  from?: RegionId;
  size?: number;
  born: number;
}

export interface ActionOutcome {
  ok: boolean;
  headline: string;
  ops: WorldOp[];
  odds: number;
}

export interface FreeMovePrompt {
  kind: 'confirm' | 'vague';
  text: string;
  cost: number;
  odds: number;
  region: string;
  reason?: 'short' | 'noaction' | 'generic';
}
