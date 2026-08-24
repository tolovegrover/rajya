import { GameState, WorldOp, FactionId, RegionId } from '../types';
import { cloneState, recompute } from './gameState';
import { clamp } from './util';
import { ROYAL_TITLES } from '../data/india';

const MAX_DELTA = 25;
const rejected: string[] = [];

export const lastRejections = () => rejected.slice();

const d = (v: unknown): number => {
  const n = typeof v === 'number' && isFinite(v) ? v : 0;
  return clamp(Math.round(n), -MAX_DELTA, MAX_DELTA);
};

export function applyOps(state: GameState, ops: WorldOp[]): { state: GameState; applied: WorldOp[] } {
  const s = cloneState(state);
  const ok: WorldOp[] = [];
  const count = Math.min(ops.length, 12);
  for (let i = 0; i < count; i++) {
    const op = ops[i];
    if (!op || typeof op !== 'object' || !('op' in op)) continue;
    const rg = 'region' in op ? s.regions[op.region as RegionId] : undefined;
    switch (op.op) {
      case 'unrest':
      case 'loyalty':
      case 'royalist':
      case 'separatist':
      case 'reservationHeat':
      case 'landHeat': {
        if (!rg) break;
        const delta = d(op.delta);
        rg[op.op] = clamp(rg[op.op] + delta, 0, 100);
        ok.push(op);
        break;
      }
      case 'factionPower': {
        const f = s.factions[op.faction as FactionId];
        if (!f) break;
        f.power = clamp(f.power + d(op.delta), 0, 100);
        ok.push(op);
        break;
      }
      case 'treasury': {
        s.treasury = clamp(s.treasury + clamp(op.delta ?? 0, -40, 40), 0, 500);
        ok.push(op);
        break;
      }
      case 'legitimacy': {
        s.legitimacy = clamp(s.legitimacy + clamp(op.delta ?? 0, -20, 20), 0, 100);
        ok.push(op);
        break;
      }
      case 'curfew': {
        if (!rg) break;
        rg.curfew = !!op.on;
        ok.push(op);
        break;
      }
      case 'riot': {
        if (!rg) break;
        rg.unrest = clamp(rg.unrest + clamp(op.severity ?? 2, 1, 5) * 4, 0, 100);
        ok.push(op);
        break;
      }
      case 'protest': {
        if (!rg) break;
        rg.unrest = clamp(rg.unrest + clamp(op.size ?? 2, 1, 5) * 3, 0, 100);
        ok.push(op);
        break;
      }
      case 'armyMove': {
        const from = s.regions[op.from as RegionId];
        if (!rg || !from) break;
        from.army = false;
        rg.army = true;
        rg.unrest = clamp(rg.unrest - 8, 0, 100);
        ok.push(op);
        break;
      }
      case 'restoreroyal': {
        if (!rg || rg.kingdom) break;
        rg.kingdom = true;
        rg.royalist = clamp(rg.royalist + 20, 0, 100);
        rg.loyalty = clamp(rg.loyalty - 25, 0, 100);
        ok.push(op);
        break;
      }
      case 'election': {
        if (!rg) break;
        const f = s.factions[op.winner as FactionId];
        if (!f) break;
        f.power = clamp(f.power + 6, 0, 100);
        if (op.winner === 'swaraj') rg.loyalty = clamp(rg.loyalty + 8, 0, 100);
        else rg.loyalty = clamp(rg.loyalty - 8, 0, 100);
        ok.push(op);
        break;
      }
      case 'character': {
        const c = s.characters[op.id];
        if (!c) break;
        if (op.moodDelta) c.mood = clamp(c.mood + d(op.moodDelta), -100, 100);
        if (op.kill && op.id !== 'moni') c.alive = false;
        ok.push(op);
        break;
      }
      case 'headline': {
        ok.push(op);
        break;
      }
      default:
        rejected.push(String((op as { op: string }).op));
    }
  }
  recompute(s);
  return { state: s, applied: ok };
}

export function opTitle(op: WorldOp, s: GameState): string {
  const rn = (id?: RegionId) => (id && s.regions[id] ? s.regions[id].name : id ?? '');
  switch (op.op) {
    case 'unrest': return `Unrest ${op.delta > 0 ? '+' : ''}${op.delta} in ${rn(op.region)}`;
    case 'loyalty': return `Loyalty ${op.delta > 0 ? '+' : ''}${op.delta} in ${rn(op.region)}`;
    case 'royalist': return `Royalists ${op.delta > 0 ? '+' : ''}${op.delta} in ${rn(op.region)}`;
    case 'separatist': return `Separatism ${op.delta > 0 ? '+' : ''}${op.delta} in ${rn(op.region)}`;
    case 'reservationHeat': return `Quota heat ${op.delta > 0 ? '+' : ''}${op.delta} in ${rn(op.region)}`;
    case 'landHeat': return `Land heat ${op.delta > 0 ? '+' : ''}${op.delta} in ${rn(op.region)}`;
    case 'factionPower': return `${op.faction} power ${op.delta > 0 ? '+' : ''}${op.delta}`;
    case 'treasury': return `Treasury ${op.delta > 0 ? '+' : ''}${op.delta}`;
    case 'legitimacy': return `Legitimacy ${op.delta > 0 ? '+' : ''}${op.delta}`;
    case 'curfew': return `${rn(op.region)}: curfew ${op.on ? 'ON' : 'lifted'}`;
    case 'riot': return `Civil disturbance in ${rn(op.region)} (sev. ${op.severity})`;
    case 'protest': return `${op.movement} protest in ${rn(op.region)} (size ${op.size})`;
    case 'armyMove': return `Army: ${rn(op.from)} → ${rn(op.to)}`;
    case 'restoreroyal': return `${ROYAL_TITLES[op.region] ?? 'Throne'} restored in ${rn(op.region)}`;
    case 'election': return `Election in ${rn(op.region)}: ${op.winner}`;
    case 'character': return `${op.id}: mood ${op.moodDelta ?? 0}${op.kill ? ' †' : ''}`;
    case 'headline': return op.text;
  }
}
