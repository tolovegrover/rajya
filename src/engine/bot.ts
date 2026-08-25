import { GameState, WorldOp, Dilemma } from '../types';
import { ACTIONS, phaseOf, hottestRegion } from './resolver';

const affordable = (s: GameState, a: { cost: number; usesInfluence?: boolean }) =>
  (a.usesInfluence ? s.influence : s.treasury) >= a.cost;

/** Highest heat region by a given field, skipping kingdoms. */
function topRegion(s: GameState, field: 'unrest' | 'reservationHeat' | 'landHeat' | 'royalist'): string {
  let best = '';
  let v = -1;
  for (const rg of Object.values(s.regions)) {
    if (rg.kingdom) continue;
    if (rg[field] > v) {
      v = rg[field];
      best = rg.id;
    }
  }
  return best || 'uttardesh';
}

export function botPlan(s: GameState): { actionId: string; target: string } {
  const avail = ACTIONS[s.role].filter((a) => (a.phase ?? 0) <= phaseOf(s.turn));
  const can = (id: string) => avail.some((a) => a.id === id) && affordable(s, avail.find((a) => a.id === id) ?? { cost: 0 });
  const hot = hottestRegion(s);
  const r = s.regions[hot];
  switch (s.role) {
    case 'strategist': {
      if (r && r.unrest > 78 && can('deploy')) return { actionId: 'deploy', target: hot };
      if (r && r.unrest > 62 && can('crackdown')) return { actionId: 'crackdown', target: hot };
      const poorHot = Object.values(s.regions).find((x) => x.unrest > 55 && x.wealth <= 4);
      if (poorHot && can('welfare')) return { actionId: 'welfare', target: poorHot.id };
      if (r && r.unrest > 45 && can('negotiate')) return { actionId: 'negotiate', target: hot };
      if (can('speech')) return { actionId: 'speech', target: hot };
      if (can('post')) return { actionId: 'post', target: hot };
      return { actionId: 'post', target: 'uttardesh' };
    }
    case 'agitator': {
      const q = topRegion(s, 'reservationHeat');
      if (s.factions.swarna.power >= 55 && can('march')) return { actionId: 'march', target: 'indraprastha' };
      if (s.factions.bahujan.power > 28 && can('litigate')) return { actionId: 'litigate', target: q };
      if (s.legitimacy > 55 && s.week % 3 === 0 && can('fast')) return { actionId: 'fast', target: q };
      if (can('rally')) return { actionId: 'rally', target: q };
      if (can('reel')) return { actionId: 'reel', target: q };
      return { actionId: 'reel', target: 'haryali' };
    }
    case 'royalist': {
      const roy = topRegion(s, 'royalist');
      if (s.legitimacy > 15 && can('rumor')) return { actionId: 'rumor', target: roy };
      const rr = s.regions[roy];
      if (rr && rr.royalist > 55 && can('buymla')) return { actionId: 'buymla', target: roy };
      if (rr && rr.royalist < 45 && can('court')) return { actionId: 'court', target: roy };
      if (can('heritage')) return { actionId: 'heritage', target: roy };
      if (can('nostalgia')) return { actionId: 'nostalgia', target: roy };
      return { actionId: 'nostalgia', target: 'rajputana' };
    }
    case 'oligarch': {
      if (r && r.unrest > 55 && can('crisisbet')) return { actionId: 'crisisbet', target: hot };
      if (s.factions.media.power < 35 && can('buymedia')) return { actionId: 'buymedia', target: hot };
      if (s.legitimacy < 45 && can('broker')) return { actionId: 'broker', target: hot };
      if (can('fund')) return { actionId: 'fund', target: hot };
      if (can('memepage')) return { actionId: 'memepage', target: hot };
      return { actionId: 'memepage', target: 'marudesh' };
    }
    default:
      return { actionId: 'post', target: 'uttardesh' };
  }
}

function opScore(s: GameState, o: WorldOp): number {
  switch (o.op) {
    case 'unrest': return -1.3 * o.delta;
    case 'loyalty': return 0.8 * o.delta;
    case 'royalist': return (s.role === 'royalist' ? 2 : s.role === 'agitator' ? -0.8 : 0.5) * o.delta;
    case 'separatist': return -0.7 * o.delta;
    case 'reservationHeat': return (s.role === 'agitator' ? 0.6 : -0.6) * o.delta;
    case 'landHeat': return -0.5 * o.delta;
    case 'factionPower':
      if (o.faction === 'swarna') return (s.role === 'agitator' ? 2 : 0.3) * o.delta;
      if (o.faction === 'bahujan') return (s.role === 'agitator' ? -1 : 0.2) * o.delta;
      if (o.faction === 'rajwada') return (s.role === 'royalist' ? 1.6 : s.role === 'agitator' ? -0.8 : 0.4) * o.delta;
      if (o.faction === 'media') return 0.3 * o.delta;
      if (o.faction === 'swaraj') return (s.role === 'strategist' ? 1 : 0.2) * o.delta;
      return 0.25 * o.delta;
    case 'treasury': return (s.role === 'oligarch' ? 1 : 0.6) * o.delta;
    case 'legitimacy': return (s.role === 'royalist' ? -0.8 : s.role === 'agitator' ? -0.5 : 2) * o.delta;
    case 'curfew': return o.on ? -2 : 2;
    case 'riot': return -4 * o.severity;
    case 'protest': return (s.role === 'agitator' ? 1 : -1) * o.size;
    case 'armyMove': return s.regions[o.to] && s.regions[o.to].unrest > 60 ? 2 : -1;
    case 'restoreroyal': return s.role === 'royalist' ? 6 : s.role === 'strategist' ? -5 : 1;
    case 'election': return o.winner === 'swaraj' ? 1 : -1;
    case 'character': return (o.moodDelta ?? 0) * 0.1 - (o.kill ? 3 : 0);
    default: return 0;
  }
}

export function botPickDilemma(s: GameState, d: Dilemma): number {
  let best = 0;
  let bestScore = -1e9;
  d.options.forEach((opt, i) => {
    const score = opt.ops.reduce((acc, o) => acc + opScore(s, o), 0);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}
