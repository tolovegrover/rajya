import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GameState, LLMSettings, Screen, BeatResult, MapFx, RescueLogEntry, DialogueLine, WorldOp, Character, GameEvent,
} from './types';
import { createGame } from './engine/gameState';
import { t, setLang } from './i18n';
import { applyOps, opTitle } from './engine/reducer';
import { resolveAction, resolveFreeMove, FREE_MOVE_COST, ACTIONS, phaseOf } from './engine/resolver';
import { tick } from './engine/tick';
import { askGameMaster, GMContext } from './llm/gameMaster';
import { hasAI } from './llm/adapters';
import { saveGame, loadGame, clearGame, SaveMeta } from './save';
import { fallbackBeat } from './llm/fallback';

const SETTINGS_KEY = 'rajya_settings_v1';
const LAST_CHRONICLE_KEY = 'rajya_last_chronicle_v1';

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
  pendingBeats: BeatResult[];
  saved: SaveMeta | null;
  dialogueQueue: DialogueLine[];
  lastAmbient: { headline: string; at: number } | null;
  lastChronicle: GameEvent[] | null;
  fx: MapFx[];
  ticker: string[];
  thinking: boolean;
  rescueLog: RescueLogEntry[];
  selectedRegion: string | null;
  paused: boolean;
  autoplay: boolean;
  targetRegion: string;
  log: (entry: RescueLogEntry) => void;
  setScreen: (s: Screen) => void;
  hydrate: () => Promise<void>;
  persist: () => void;
  setTarget: (r: string) => void;
  selectRegion: (r: string | null) => void;
  setPaused: (p: boolean) => void;
  setAutoplay: (on: boolean) => void;
  dismissBeat: () => void;
  dismissAmbient: () => void;
  popDialogue: () => void;
  newGame: (role: GameState['role'], eta: number) => void;
  runTick: (silent?: boolean) => void;
  doAction: (actionId: string) => Promise<void>;
  doFreeMove: (text: string) => Promise<void>;
  requestEnding: () => Promise<void>;
  requestBeat: (kind: GMContext['kind'], region: string, actionLabel?: string, resolverHeadline?: string, resolverOps?: WorldOp[], freeText?: string) => Promise<void>;
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
  pendingBeats: [],
  saved: null,
  dialogueQueue: [],
  lastAmbient: null,
  lastChronicle: null,
  fx: [],
  ticker: [t('store.t1')],
  thinking: false,
  rescueLog: [],
  selectedRegion: null,
  paused: false,
  autoplay: false,
  targetRegion: 'uttardesh',

  log(entry) {
    set({ rescueLog: [entry, ...get().rescueLog].slice(0, 40) });
  },
  async hydrate() {
    if (get().state) return;                       // a live campaign always wins over the file
    const file = await loadGame();
    if (!file) return;
    set({ state: file.state, ticker: file.ticker.length ? file.ticker : get().ticker, saved: file.meta });
  },

  /** Write the campaign to disk. Cheap enough to call on every turn and every move. */
  persist() {
    const { state, ticker } = get();
    if (!state) return;
    void saveGame(state, ticker).then((meta) => set({ saved: meta }));
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
  setAutoplay(on) {
    set({ autoplay: on });
  },
  dismissBeat() {
    const next = get().pendingBeats[0];
    set({ beat: next ?? null, pendingBeats: get().pendingBeats.slice(1) });
  },
  dismissAmbient() {
    set({ lastAmbient: null });
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
      pendingBeats: [],
  saved: null,
      dialogueQueue: [],
      lastAmbient: null,
      fx: [],
      ticker: [t('store.t2'), t('store.t3')],
      rescueLog: [],
      selectedRegion: null,
      paused: false,
    });
    get().persist();
  },

  pushOps(ops) {
    const { state } = get();
    if (!state) return;
    const { state: next, applied } = applyOps(state, ops);
    set({ state: next, fx: [...get().fx, ...fxFromOps(applied, next.turn)].slice(-24) });
  },

  runTick(silent = false) {
    const { state, paused, thinking, beat, pendingBeats } = get();
    if (!state || state.ending || paused || thinking || beat || pendingBeats.length > 0) return;
    const { state: next, ops } = tick(state);
    const applied = applyOps(next, ops);
    let s2 = applied.state;
    const newFx = fxFromOps(applied.applied, s2.turn);
    const riotOp = ops.find((o) => o.op === 'riot');
    const royalOp = ops.find((o) => o.op === 'restoreroyal');
    const headlines = ops.filter((o) => o.op === 'headline').map((o) => (o as { text: string }).text);
    const weekEntry: GameEvent = { turn: s2.turn, week: s2.week, kind: 'week', headline: t('chron.week', { w: s2.week, y: s2.year }), beat: '' };
    s2 = { ...s2, eventLog: [...s2.eventLog, weekEntry, ...headlines.map((h) => ({ turn: s2.turn, week: s2.week, kind: 'headline' as const, headline: h, beat: '' }))].slice(-800) };
    set({
      state: s2,
      fx: [...get().fx, ...newFx].slice(-24),
      ticker: [...headlines.reverse(), ...get().ticker].slice(0, 12),
    });
    if (s2.ending) {
      const endEntry: GameEvent = { turn: s2.turn, week: s2.week, kind: 'ending', headline: s2.ending.title, beat: s2.ending.text };
      s2 = { ...s2, eventLog: [...s2.eventLog, endEntry] };
      set({ state: s2 });
      void AsyncStorage.setItem(LAST_CHRONICLE_KEY, JSON.stringify(s2.eventLog.slice(-600))).catch(() => undefined);
      set({ screen: 'ending', lastChronicle: s2.eventLog });
      void get().requestEnding();
      return;
    }
    const grew = phaseOf(s2.turn) > phaseOf(state.turn);
    if (grew) {
      const p = phaseOf(s2.turn);
      const phaseEntry: GameEvent = {
        turn: s2.turn, week: s2.week, kind: 'headline',
        headline: t('phase.up', { name: t(`phase.${p}.name`) }), beat: t(`phase.${p}.text`),
      };
      s2 = { ...s2, eventLog: [...s2.eventLog, phaseEntry].slice(-800) };
      set({
        state: s2,
        lastAmbient: { headline: t('phase.up', { name: t(`phase.${p}.name`) }), at: Date.now() },
        ticker: [t('phase.up', { name: t(`phase.${p}.name`) }), ...get().ticker].slice(0, 12),
      });
      return;
    }
    get().persist();
    const wantsBeat = !silent && (royalOp || riotOp || next.turn % 4 === 0);
    if (wantsBeat) {
      const kind: GMContext['kind'] = royalOp ? 'royal' : riotOp ? 'riot' : 'ambient';
      const region = royalOp ? (royalOp as { region: string }).region : riotOp ? (riotOp as { region: string }).region : hottest(s2);
      void get().requestBeat(kind, region);
    }
  },

  async doAction(actionId) {
    const { state, targetRegion, pendingBeats } = get();
    if (!state || state.ending || get().thinking || get().beat || pendingBeats.length > 0) return;
    const outcome = resolveAction(state, actionId, targetRegion);
    let s = { ...state };
    s.influence = Math.max(0, Math.min(100, s.influence + outcome.influenceDelta));
    s.treasury = Math.max(0, Math.min(500, s.treasury + outcome.treasuryDelta));
    const applied = applyOps(s, outcome.ops);
    s = applied.state;
    const newFx = fxFromOps(applied.applied, s.turn);
    set({ state: s, fx: [...get().fx, ...newFx].slice(-24) });
    get().runTick(true);                 // your move is what moves the week
    const after = get().state;
    if (!after || after.ending) return;
    set({
      state: after,
      thinking: true,
      ticker: hasAI(useSettings.getState().settings)
        ? get().ticker
        : [outcome.headline.toUpperCase().slice(0, 90), ...get().ticker].slice(0, 12),
    });
    const label = t(`act.${actionId}`, {}, ACTIONS[state.role].find((a) => a.id === actionId)?.label ?? actionId);
    await get().requestBeat('action', targetRegion, label, outcome.headline, outcome.ops);
  },

  async doFreeMove(text) {
    const { state, targetRegion, pendingBeats } = get();
    const said = text.trim();
    if (!state || !said || state.ending || get().thinking || get().beat || pendingBeats.length > 0) return;
    if (state.influence < FREE_MOVE_COST) return;
    const outcome = resolveFreeMove(state, said, targetRegion);
    let s = { ...state, influence: Math.max(0, state.influence - FREE_MOVE_COST) };
    const applied = applyOps(s, outcome.ops);
    s = applied.state;
    set({ state: s, fx: [...get().fx, ...fxFromOps(applied.applied, s.turn)].slice(-24) });
    get().runTick(true);
    const after = get().state;
    if (!after || after.ending) return;
    set({
      state: after,
      thinking: true,
      ticker: hasAI(useSettings.getState().settings)
        ? get().ticker
        : [outcome.headline.toUpperCase().slice(0, 90), ...get().ticker].slice(0, 12),
    });
    await get().requestBeat('action', targetRegion, said.slice(0, 80), outcome.headline, outcome.ops, said);
  },

  async requestEnding() {
    const s = get().state;
    const settings = useSettings.getState().settings;
    if (!s || !s.ending || !hasAI(settings)) return;
    set({ thinking: true });
    try {
      const result = await askGameMaster(
        s,
        settings,
        { kind: 'ending', region: hottest(s), resolverHeadline: s.ending.title, resolverOps: [] },
        (entry) => get().log({ turn: s.turn, tier: entry.tier, note: entry.note, originalRequest: entry.originalRequest.slice(0, 400) })
      );
      const text = result.beat.trim();
      const cur = get().state;
      if (cur?.ending && text.length > 40) set({ state: { ...cur, ending: { ...cur.ending, text } } });
    } catch {
      /* the engine's own ending already stands */
    }
    set({ thinking: false });
  },

  async requestBeat(kind, region, actionLabel?, resolverHeadline?, resolverOps = [], freeText?) {
    const { state } = get();
    if (!state) return;
    const settings = useSettings.getState().settings;
    const ctx: GMContext = { kind, region, actionLabel, freeText, resolverHeadline, resolverOps };
    const finish = (result: BeatResult, gmOps: WorldOp[]) => {
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
      const chronicle: GameEvent = {
        turn: s2.turn, week: s2.week, kind: 'beat',
        headline: result.ticker[0] ?? (actionLabel ?? kind),
        beat: result.beat,
        dialogue: result.dialogue,
        ops: gmOps.map((o) => opTitle(o, s2)),
      };
      s2 = { ...s2, eventLog: [...s2.eventLog, chronicle].slice(-800) };
      set({ state: s2 });
      get().persist();
      if (s2.ending) {
        void AsyncStorage.setItem(LAST_CHRONICLE_KEY, JSON.stringify(s2.eventLog.slice(-600))).catch(() => undefined);
        set({ screen: 'ending', lastChronicle: s2.eventLog, thinking: false });
        void get().requestEnding();
        return;
      }
      const isAmbient = kind === 'ambient' && !result.dilemma;
      if (isAmbient) {
        set({
          thinking: false,
          lastAmbient: { headline: result.ticker[0] ?? result.beat.slice(0, 80), at: Date.now() },
          dialogueQueue: [...get().dialogueQueue, ...result.dialogue].slice(-8),
          ticker: [...result.ticker, ...get().ticker].slice(0, 12),
        });
      } else {
        const card: BeatResult = { ...result, ops: gmOps };
        const q = get().beat ? [...get().pendingBeats, card] : get().pendingBeats;
        set({
          beat: get().beat ?? card,
          pendingBeats: q,
          thinking: false,
          dialogueQueue: [...get().dialogueQueue, ...result.dialogue].slice(-8),
          ticker: [...result.ticker, ...get().ticker].slice(0, 12),
        });
      }
    };
    try {
      const result = await askGameMaster(state, settings, ctx, (entry) =>
        get().log({ turn: state.turn, tier: entry.tier, note: entry.note, originalRequest: entry.originalRequest.slice(0, 400) })
      );
      const gmOps = result.ops.filter((o) => !resolverOps.includes(o));
      finish(result, gmOps);
    } catch {
      const fb = fallbackBeat(state, { kind, region, actionLabel, resolverHeadline, resolverOps });
      finish(fb, []);
    }
  },

  chooseDilemma(index) {
    const { state } = get();
    if (!state || !state.pendingDilemma) return;
    const option = state.pendingDilemma.options[index];
    if (!option) return;
    const applied = applyOps(state, option.ops);
    const decision: GameEvent = {
      turn: applied.state.turn, week: applied.state.week, kind: 'decision',
      headline: t('chron.decision', { label: option.label }), beat: '',
    };
    const s2 = { ...applied.state, pendingDilemma: null, eventLog: [...applied.state.eventLog, decision].slice(-800) };
    set({
      state: s2,
      fx: [...get().fx, ...fxFromOps(applied.applied, s2.turn)].slice(-24),
      ticker: [t('store.decision', { label: option.label }), ...get().ticker].slice(0, 12),
    });
    get().persist();
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
