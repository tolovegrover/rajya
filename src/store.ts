import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GameState, LLMSettings, Screen, BeatResult, MapFx, RescueLogEntry, DialogueLine, WorldOp, Character,
} from './types';
import { createGame } from './engine/gameState';
import { t, setLang } from './i18n';
import { applyOps } from './engine/reducer';
import { resolveAction, ACTIONS, phaseOf } from './engine/resolver';
import { tick } from './engine/tick';
import { askGameMaster, GMContext } from './llm/gameMaster';
import { fallbackBeat } from './llm/fallback';

const SETTINGS_KEY = 'rajya_settings_v1';

export const DEFAULT_SETTINGS: LLMSettings = {
  lang: 'hi',
  provider: 'offline',
  anthropicKey: '',
  anthropicModel: 'claude-sonnet-4-5',
  geminiKey: '',
  geminiModel: 'gemini-2.0-flash',
  compatBaseUrl: 'https://opencode.ai/zen/v1',
  compatKey: '',
  compatModel: 'claude-sonnet-4-5',
  compatKey2: '',
  compatModel2: '',
  flashModel: '',
  language: '',
  gmDirective: '',
  personaOverrides: {},
  nameOverrides: {},
  customCharacters: [],
  rescue: true,
};

interface SettingsStore {
  settings: LLMSettings;
  loaded: boolean;
  load: () => Promise<void>;
  setSettings: (patch: Partial<LLMSettings>) => void;
  setPersona: (id: string, text: string) => void;
  setName: (id: string, name: string) => void;
  addCharacter: (c: Character) => void;
  removeCharacter: (id: string) => void;
}

export const useSettings = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  async load() {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LLMSettings>;
        const settings = { ...DEFAULT_SETTINGS, ...parsed };
        setLang(settings.lang);
        set({ settings });
      }
    } catch {
      set({ settings: DEFAULT_SETTINGS });
    }
    set({ loaded: true });
  },
  setSettings(patch) {
    const settings = { ...get().settings, ...patch };
    if (patch.lang) setLang(patch.lang);
    set({ settings });
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => undefined);
  },
  setPersona(id, text) {
    const settings = { ...get().settings, personaOverrides: { ...get().settings.personaOverrides, [id]: text } };
    set({ settings });
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => undefined);
  },
  addCharacter(c) {
    const customCharacters = [...get().settings.customCharacters.filter((x) => x.id !== c.id), c];
    const settings = { ...get().settings, customCharacters };
    set({ settings });
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => undefined);
  },
  setName(id, name) {
    const nameOverrides = { ...get().settings.nameOverrides, [id]: name };
    const settings = { ...get().settings, nameOverrides };
    set({ settings });
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => undefined);
  },
  removeCharacter(id) {
    const customCharacters = get().settings.customCharacters.filter((x) => x.id !== id);
    const settings = { ...get().settings, customCharacters };
    set({ settings });
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => undefined);
  },
}));

let fxSeq = 1;

interface GameStore {
  state: GameState | null;
  screen: Screen;
  beat: BeatResult | null;
  dialogueQueue: DialogueLine[];
  fx: MapFx[];
  ticker: string[];
  thinking: boolean;
  rescueLog: RescueLogEntry[];
  selectedRegion: string | null;
  paused: boolean;
  targetRegion: string;
  log: (entry: RescueLogEntry) => void;
  setScreen: (s: Screen) => void;
  setTarget: (r: string) => void;
  selectRegion: (r: string | null) => void;
  setPaused: (p: boolean) => void;
  dismissBeat: () => void;
  popDialogue: () => void;
  newGame: (role: GameState['role'], eta: number) => void;
  runTick: () => void;
  doAction: (actionId: string) => Promise<void>;
  requestBeat: (kind: GMContext['kind'], region: string, actionLabel?: string, resolverHeadline?: string, resolverOps?: WorldOp[]) => Promise<void>;
  chooseDilemma: (index: number) => void;
  pushOps: (ops: WorldOp[]) => void;
}

const fxFromOps = (ops: WorldOp[], turn: number): MapFx[] => {
  const out: MapFx[] = [];
  for (const op of ops) {
    const id = fxSeq++;
    switch (op.op) {
      case 'protest':
        out.push({ id, kind: 'protest', region: op.region, size: op.size, born: turn });
        break;
      case 'riot':
        out.push({ id, kind: 'riot', region: op.region, size: op.severity, born: turn });
        break;
      case 'armyMove':
        out.push({ id, kind: 'army', region: op.to, from: op.from, born: turn });
        break;
      case 'restoreroyal':
        out.push({ id, kind: 'crown', region: op.region, born: turn });
        break;
      case 'election':
        out.push({ id, kind: 'election', region: op.region, born: turn });
        break;
      default:
        break;
    }
  }
  return out;
};

export const useGame = create<GameStore>((set, get) => ({
  state: null,
  screen: 'title',
  beat: null,
  dialogueQueue: [],
  fx: [],
  ticker: [t('store.t1')],
  thinking: false,
  rescueLog: [],
  selectedRegion: null,
  paused: false,
  targetRegion: 'uttardesh',

  log(entry) {
    set({ rescueLog: [entry, ...get().rescueLog].slice(0, 40) });
  },
  setScreen(screen) {
    set({ screen });
  },
  setTarget(r) {
    set({ targetRegion: r, selectedRegion: r });
  },
  selectRegion(r) {
    set({ selectedRegion: r });
  },
  setPaused(p) {
    set({ paused: p });
  },
  dismissBeat() {
    set({ beat: null });
  },
  popDialogue() {
    set({ dialogueQueue: get().dialogueQueue.slice(1) });
  },

  newGame(role, eta) {
    const st = createGame(role, eta, useSettings.getState().settings.customCharacters);
    set({
      state: st,
      screen: 'game',
      beat: { beat: t('phase.0.text'), ticker: [], dialogue: [], ops: [], source: 'system' },
      dialogueQueue: [],
      fx: [],
      ticker: [t('store.t2'), t('store.t3')],
      rescueLog: [],
      selectedRegion: null,
      paused: false,
    });
  },

  pushOps(ops) {
    const { state } = get();
    if (!state) return;
    const { state: next, applied } = applyOps(state, ops);
    set({ state: next, fx: [...get().fx, ...fxFromOps(applied, next.turn)].slice(-24) });
  },

  runTick() {
    const { state, paused, thinking, beat } = get();
    if (!state || state.ending || paused || thinking || beat) return;
    const { state: next, ops } = tick(state);
    const applied = applyOps(next, ops);
    let s2 = applied.state;
    const newFx = fxFromOps(applied.applied, s2.turn);
    const riotOp = ops.find((o) => o.op === 'riot');
    const royalOp = ops.find((o) => o.op === 'restoreroyal');
    const headlines = ops.filter((o) => o.op === 'headline').map((o) => (o as { text: string }).text);
    set({
      state: s2,
      fx: [...get().fx, ...newFx].slice(-24),
      ticker: [...headlines.reverse(), ...get().ticker].slice(0, 12),
    });
    if (s2.ending) {
      set({ screen: 'ending' });
      return;
    }
    const grew = phaseOf(s2.turn) > phaseOf(state.turn);
    if (grew) {
      const p = phaseOf(s2.turn);
      set({
        beat: { beat: t(`phase.${p}.text`), ticker: [], dialogue: [], ops: [], source: 'system' },
        ticker: [t('phase.up', { name: t(`phase.${p}.name`) }), ...get().ticker].slice(0, 12),
      });
      return;
    }
    const wantsBeat = royalOp || riotOp || next.turn % 4 === 0;
    if (wantsBeat) {
      const kind: GMContext['kind'] = royalOp ? 'royal' : riotOp ? 'riot' : 'ambient';
      const region = royalOp ? (royalOp as { region: string }).region : riotOp ? (riotOp as { region: string }).region : hottest(s2);
      void get().requestBeat(kind, region);
    }
  },

  async doAction(actionId) {
    const { state, targetRegion } = get();
    if (!state || state.ending || get().thinking || get().beat) return;
    const outcome = resolveAction(state, actionId, targetRegion);
    let s = { ...state };
    s.influence = Math.max(0, Math.min(100, s.influence + outcome.influenceDelta));
    s.treasury = Math.max(0, Math.min(500, s.treasury + outcome.treasuryDelta));
    const applied = applyOps(s, outcome.ops);
    s = applied.state;
    const newFx = fxFromOps(applied.applied, s.turn);
    set({
      state: s,
      thinking: true,
      fx: [...get().fx, ...newFx].slice(-24),
      ticker: [outcome.headline.toUpperCase().slice(0, 90), ...get().ticker].slice(0, 12),
    });
    const label = t(`act.${actionId}`, {}, ACTIONS[state.role].find((a) => a.id === actionId)?.label ?? actionId);
    await get().requestBeat('action', targetRegion, label, outcome.headline, outcome.ops);
  },

  async requestBeat(kind, region, actionLabel?, resolverHeadline?, resolverOps = []) {
    const { state } = get();
    if (!state) return;
    const settings = useSettings.getState().settings;
    const ctx: GMContext = { kind, region, actionLabel, resolverHeadline, resolverOps };
    try {
      const result = await askGameMaster(state, settings, ctx, (entry) =>
        get().log({ turn: state.turn, tier: entry.tier, note: entry.note, originalRequest: entry.originalRequest.slice(0, 400) })
      );
      const gmOps = result.ops.filter((o) => !resolverOps.includes(o));
      const s = get().state;
      if (!s) return;
      let s2 = s;
      if (gmOps.length) {
        const applied = applyOps(s, gmOps);
        s2 = applied.state;
        set({ state: s2, fx: [...get().fx, ...fxFromOps(applied.applied, s2.turn)].slice(-24) });
      }
      if (result.dilemma && s2 && !s2.ending) {
        s2 = { ...s2, pendingDilemma: result.dilemma };
        set({ state: s2 });
      }
      set({
        beat: { ...result, ops: gmOps },
        thinking: false,
        dialogueQueue: result.dialogue.length ? result.dialogue : get().dialogueQueue,
        ticker: [...result.ticker, ...get().ticker].slice(0, 12),
      });
      if (s2 && s2.ending) set({ screen: 'ending' });
    } catch {
      const fb = fallbackBeat(state, { kind, region, actionLabel, resolverHeadline, resolverOps });
      set({
        beat: fb,
        thinking: false,
        dialogueQueue: fb.dialogue.length ? fb.dialogue : get().dialogueQueue,
        ticker: [...fb.ticker, ...get().ticker].slice(0, 12),
      });
    }
  },

  chooseDilemma(index) {
    const { state } = get();
    if (!state || !state.pendingDilemma) return;
    const option = state.pendingDilemma.options[index];
    if (!option) return;
    const applied = applyOps(state, option.ops);
    set({
      state: { ...applied.state, pendingDilemma: null },
      fx: [...get().fx, ...fxFromOps(applied.applied, applied.state.turn)].slice(-24),
      ticker: [t('store.decision', { label: option.label }), ...get().ticker].slice(0, 12),
    });
  },
}));

function hottest(s: GameState): string {
  let best = '';
  let score = -1;
  for (const rg of Object.values(s.regions)) {
    const v = rg.unrest + rg.reservationHeat * 0.5 + rg.landHeat * 0.5 + (rg.kingdom ? 20 : 0);
    if (v > score) {
      score = v;
      best = rg.id;
    }
  }
  return best;
}

/** Subscribe a component to the interface language so it re-renders on change. */
export const useLang = () => useSettings((s) => s.settings.lang);
