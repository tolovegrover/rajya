import { GameState, WorldOp, FactionId, RegionId } from '../types';
import { cloneState, recompute } from './gameState';
import { clamp } from './util';
import { ROYAL_TITLES } from '../data/india';
import { t } from '../i18n';

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
      case 'trust': {
        const c = s.characters[op.id];
        if (!c) break;
        s.trust[op.id] = clamp((s.trust[op.id] ?? 0) + d(op.delta), -100, 100);
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
  const sign = (n: number) => `${n > 0 ? '+' : ''}${n}`;
  switch (op.op) {
    case 'unrest':
    case 'loyalty':
    case 'royalist':
    case 'separatist':
    case 'reservationHeat':
    case 'landHeat':
      return `${t(`op.${op.op}`)} ${sign(op.delta)} · ${rn(op.region)}`;
    case 'factionPower': return `${t(`fac.${op.faction}`, {}, op.faction)} ${t('op.power')} ${sign(op.delta)}`;
    case 'treasury': return `${t('stat.treasury')} ${sign(op.delta)}`;
    case 'legitimacy': return `${t('stat.legitimacy')} ${sign(op.delta)}`;
    case 'curfew': return `${rn(op.region)}: ${op.on ? t('op.curfewon') : t('op.curfewoff')}`;
    case 'riot': return t('op.riot', { r: rn(op.region), n: op.severity });
    case 'protest': return t('op.protest', { r: rn(op.region), n: op.size });
    case 'armyMove': return t('op.armyMove', { a: rn(op.from), b: rn(op.to) });
    case 'restoreroyal': return t('op.restore', { r: rn(op.region), title: t(`royal.${op.region}`, {}, ROYAL_TITLES[op.region] ?? 'Throne') });
    case 'election': return t('op.election', { r: rn(op.region), f: t(`fac.${op.winner}`, {}, op.winner) });
    case 'character': return t('op.mood', { c: s.characters[op.id]?.name ?? op.id, n: op.moodDelta ?? 0 }) + (op.kill ? ' †' : '');
    case 'trust': return t('op.trust', { c: s.characters[op.id]?.name ?? op.id, n: op.delta });
    case 'headline': return op.text;
  }
}
