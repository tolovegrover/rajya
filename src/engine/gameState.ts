import { REGIONS } from '../data/india';
import { FACTIONS, PLAYER_ROLES } from '../data/factions';
import { CHARACTERS } from '../data/characters';
import { GameState, PlayerRoleId, Region, Faction, FactionId, Character } from '../types';

export const cloneState = (s: GameState): GameState => JSON.parse(JSON.stringify(s)) as GameState;

export function createGame(role: PlayerRoleId, eta: number): GameState {
  const regions: Record<string, Region> = {};
  for (const rg of REGIONS) regions[rg.id] = { ...rg };
  const factions: Record<FactionId, Faction> = {} as Record<FactionId, Faction>;
  for (const f of FACTIONS) factions[f.id] = { ...f };
  const characters: Record<string, Character> = {};
  for (const c of CHARACTERS) characters[c.id] = { ...c };
  const pr = PLAYER_ROLES.find((p) => p.id === role) ?? PLAYER_ROLES[0];
  return {
    turn: 0,
    week: 1,
    year: 2026,
    eta,
    role,
    influence: pr.influenceStart,
    treasury: 100,
    legitimacy: 70,
    stability: 55,
    regions,
    factions,
    characters,
    eventLog: [
      {
        turn: 0,
        headline: "REPUBLIC AT 75: FREEDOM'S BIRTHDAY CAKE CUT WITH CAUTION",
        beat: 'The Republic of Bharatam enters its 76th year. The papers print the usual supplements; the streets print other things. Somewhere, a palace dusts its thrones.',
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
