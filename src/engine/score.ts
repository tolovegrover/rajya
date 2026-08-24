import { GameState } from '../types';
import { clamp } from './util';

/**
 * A single number for "how well is your game going", 0-1000.
 * Half of it is universal (survival, a working state), half is your role's own
 * objective — a royalist crowning kingdoms and a strategist holding the republic
 * together should not be scored on the same axis.
 */
export function scoreOf(s: GameState): number {
  const survival = Math.min(1, s.turn / 120) * 250;
  const order = (s.stability * 1.5 + s.legitimacy) / 250 * 250;

  let goal = 0;
  switch (s.role) {
    case 'strategist':
      goal = (s.stability / 100) * 300 + (s.legitimacy / 100) * 200;
      break;
    case 'agitator':
      goal = (s.factions.swarna.power / 100) * 350 + Math.max(0, 100 - s.factions.bahujan.power) / 100 * 150;
      break;
    case 'royalist':
      goal = Math.min(1, s.royalPopPct / 30) * 400 + (s.factions.rajwada.power / 100) * 100;
      break;
    case 'oligarch':
      goal = (s.influence / 100) * 350 + (s.treasury / 500) * 150;
      break;
  }
  return Math.round(clamp(survival + order + goal, 0, 1000));
}

/** Coarse band, for a label next to the number. */
export const scoreBand = (n: number): 0 | 1 | 2 | 3 =>
  n >= 750 ? 3 : n >= 500 ? 2 : n >= 250 ? 1 : 0;
