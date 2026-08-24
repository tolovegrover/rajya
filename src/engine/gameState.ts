import { buildRegions } from '../data/india';
import { FACTIONS, PLAYER_ROLES } from '../data/factions';
import { CHARACTERS } from '../data/characters';
import { GameState, PlayerRoleId, Region, Faction, FactionId, Character } from '../types';
import { t } from '../i18n';

export const cloneState = (s: GameState): GameState => JSON.parse(JSON.stringify(s)) as GameState;

export function createGame(role: PlayerRoleId, eta: number, customCharacters: Character[] = []): GameState {
  const regions = buildRegions();
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
