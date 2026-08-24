import { buildRegions } from '../data/india';
import { FACTIONS, PLAYER_ROLES } from '../data/factions';
import { CHARACTERS } from '../data/characters';
import { GameState, PlayerRoleId, Region, Faction, FactionId, Character } from '../types';
import { clamp, rand, pick } from './util';
import { t } from '../i18n';

export const cloneState = (s: GameState): GameState => JSON.parse(JSON.stringify(s)) as GameState;

/**
 * Shake the opening position so no two campaigns are the same republic:
 * every region drifts a little, two or three start as live flashpoints, and one
 * runs unusually calm. Offline or with a key, the map you inherit is new.
 */
function varyOpening(regions: Record<string, Region>, eta: number): void {
  const ids = Object.keys(regions);
  const spread = 8 + eta * 10;
  for (const id of ids) {
    const r = regions[id];
    const j = (m: number) => (rand() * 2 - 1) * m;
    r.unrest = clamp(r.unrest + j(spread), 4, 74);
    r.reservationHeat = clamp(r.reservationHeat + j(spread * 0.9), 0, 95);
    r.landHeat = clamp(r.landHeat + j(spread * 0.9), 0, 95);
    r.royalist = clamp(r.royalist + j(spread * 0.7), 0, 90);
    r.separatist = clamp(r.separatist + j(spread * 0.6), 0, 90);
    r.loyalty = clamp(r.loyalty + j(spread * 0.6), 10, 95);
  }
  for (let i = 0; i < 2 + Math.round(rand() * 1.5); i++) {
    const f = regions[pick(ids)];
    f.unrest = clamp(f.unrest + 14 + rand() * 16, 0, 74);
    if (rand() < 0.5) f.reservationHeat = clamp(f.reservationHeat + 18, 0, 98);
    else f.landHeat = clamp(f.landHeat + 18, 0, 98);
  }
  const calm = regions[pick(ids)];
  calm.unrest = clamp(calm.unrest - 18, 2, 100);
  calm.loyalty = clamp(calm.loyalty + 12, 0, 98);
}

export function createGame(role: PlayerRoleId, eta: number, customCharacters: Character[] = []): GameState {
  const regions = buildRegions();
  varyOpening(regions, eta);
  const factions: Record<FactionId, Faction> = {} as Record<FactionId, Faction>;
  for (const f of FACTIONS) factions[f.id] = { ...f };
  const characters: Record<string, Character> = {};
  for (const c of [...CHARACTERS, ...customCharacters]) {
    characters[c.id] = {
      ...c,
      name: t(`char.${c.id}.name`, {}, c.name),
      title: t(`char.${c.id}.title`, {}, c.title),
      persona: t(`char.${c.id}.persona`, {}, c.persona),
    };
  }
  const pr = PLAYER_ROLES.find((p) => p.id === role) ?? PLAYER_ROLES[0];
  return {
    turn: 0,
    week: 1,
    year: 2026,
    eta,
    role,
    influence: clamp(pr.influenceStart + Math.round((rand() * 2 - 1) * 6), 10, 90),
    treasury: 90 + Math.round(rand() * 30),
    legitimacy: clamp(70 + Math.round((rand() * 2 - 1) * 8), 45, 88),
    stability: 55,
    regions,
    factions,
    characters,
    eventLog: [
      {
        turn: 0,
        week: 1,
        kind: 'beat' as const,
        headline: t('gs.headline'),
        beat: t('gs.beat'),
      },
    ],
    pendingDilemma: null,
    ending: null,
    royalPopPct: 0,
    nextElectionTurn: 16,
  };
}

export function recompute(s: GameState) {
  let pop = 0;
  let calm = 0;
  let loyal = 0;
  let royalPop = 0;
  let kingdoms = 0;
  let curfews = 0;
  for (const rg of Object.values(s.regions)) {
    pop += rg.popM;
    calm += (100 - rg.unrest) * rg.popM;
    loyal += rg.loyalty * rg.popM;
    if (rg.kingdom) royalPop += rg.popM;
    if (rg.kingdom) kingdoms += 1;
    if (rg.curfew) curfews += 1;
  }
  s.stability = Math.round(calm / pop * 0.6 + loyal / pop * 0.4 - kingdoms * 2.5 - curfews * 1.5);
  s.royalPopPct = Math.round((royalPop / pop) * 100);
}
