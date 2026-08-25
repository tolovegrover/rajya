import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState } from './types';
import { t } from './i18n';
import { scoreOf } from './engine/score';

const KEY = 'rajya_save_v1';
/** Bump when GameState changes shape; an older save is dropped rather than crashing. */
export const SAVE_VERSION = 1;

export interface SaveMeta {
  name: string;
  subtitle: string;
  savedAt: number;
}

interface SaveFile {
  v: number;
  state: GameState;
  ticker: string[];
  meta: SaveMeta;
}

/** A human line for the save slot: who you are, and where the campaign stands. */
export function describe(s: GameState): SaveMeta {
  const hottest = Object.values(s.regions).sort((a, b) => b.unrest - a.unrest)[0];
  const crowns = Object.values(s.regions).filter((r) => r.kingdom).length;
  const bits = [
    `${t('stat.week')} ${s.week} · ${s.year}`,
    `${hottest.name} ${Math.round(hottest.unrest)}%`,
    crowns > 0 ? `♛ ${crowns}` : '',
    `${t('stat.score')} ${scoreOf(s)}`,
  ].filter(Boolean);
  return {
    name: t(`role.${s.role}.name`, {}, s.role),
    subtitle: bits.join(' · '),
    savedAt: Date.now(),
  };
}

export async function saveGame(state: GameState, ticker: string[]): Promise<SaveMeta | null> {
  if (state.ending) return clearGame().then(() => null);
  const meta = describe(state);
  const file: SaveFile = { v: SAVE_VERSION, state, ticker: ticker.slice(0, 12), meta };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(file));
    return meta;
  } catch {
    return null;
  }
}

export async function loadGame(): Promise<{ state: GameState; ticker: string[]; meta: SaveMeta } | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const file = JSON.parse(raw) as SaveFile;
    if (file.v !== SAVE_VERSION || !file.state?.regions || !file.state.factions) return null;
    return { state: file.state, ticker: file.ticker ?? [], meta: file.meta };
  } catch {
    return null;
  }
}

export const clearGame = (): Promise<void> =>
  AsyncStorage.removeItem(KEY).catch(() => undefined) as Promise<void>;
