import { GameState, PlayerActionDef, PlayerRoleId, WorldOp, Movement } from '../types';
import { clamp, noise, rand } from './util';
import { t } from '../i18n';

/**
 * The campaign opens narrow and quiet and widens as the weeks pass: one social-media lever
 * in phase 0, the street in 1, the machine in 2, the endgame in 3. `phase` on an action is
 * the week-band it unlocks in; chaos (eta) ramps in over the same arc.
 */
export const PHASE_START = [0, 6, 18, 38];

export const phaseOf = (turn: number): number =>
  PHASE_START.reduce((acc, start, i) => (turn >= start ? i : acc), 0);

/** Chaos the world actually runs on: a quarter of the setting at week 1, all of it by ~week 30. */
export const etaFor = (s: { eta: number; turn: number }): number =>
  clamp(s.eta * (0.25 + 0.75 * Math.min(1, s.turn / 30)), 0.03, 1);

export const ACTIONS: Record<PlayerRoleId, PlayerActionDef[]> = {
  strategist: [
    { id: 'post', label: 'Trend a Hashtag', icon: '📱', cost: 2, phase: 0, desc: 'The party cell pushes one line all night. Small, cheap, everywhere.' },
    { id: 'speech', label: 'Moni Speech', icon: '🎙', cost: 5, phase: 1, desc: 'A mega-rally broadcast to the hot zones. Loyalty up, unrest down.' },
    { id: 'crackdown', label: 'SIT Crackdown', icon: '🗄', cost: 0, phase: 2, desc: 'Amir Sahab opens the files. Crush unrest, feed separatism.' },
    { id: 'welfare', label: 'Welfare Scheme', icon: '🎁', cost: 25, phase: 2, usesInfluence: true, desc: 'Cylinders for everyone. Calms the poorest regions.' },
    { id: 'negotiate', label: 'Backchannel', icon: '🤝', cost: 8, phase: 1, desc: 'Tea with the agitating leader. Moods soften, heat cools.' },
    { id: 'deploy', label: 'Deploy Army', icon: '🎖', cost: 15, phase: 3, desc: 'Gen. Rudra moves in. Order restored, friction with Delhi later.' },
  ],
  agitator: [
    { id: 'reel', label: 'Viral Reel', icon: '📱', cost: 2, phase: 0, desc: 'A marksheet, a caption, a hundred reposts. The heat starts here.' },
    { id: 'rally', label: 'Maharally', icon: '📣', cost: 5, phase: 1, desc: 'Swarna Aandolan floods a state capital. Quota heat surges.' },
    { id: 'fast', label: 'Fast-unto-Death', icon: '⚖️', cost: 10, phase: 2, desc: 'Devraj refuses food on live TV. The nation holds its breath.' },
    { id: 'blitz', label: 'Studio Blitz', icon: '📺', cost: 8, phase: 1, desc: 'Swammy Aarab makes merit the only story for a week.' },
    { id: 'litigate', label: 'Fund Litigation', icon: '🏛', cost: 12, phase: 2, desc: 'Senior advocates attack the quota in constitutional court.' },
    { id: 'march', label: 'March to Indraprastha', icon: '🚩', cost: 20, phase: 3, desc: 'The final march. Everything, on the capital.' },
  ],
  royalist: [
    { id: 'nostalgia', label: 'Nostalgia Post', icon: '📱', cost: 2, phase: 0, desc: 'Sepia photographs of the old durbar. Grandmothers share them first.' },
    { id: 'court', label: 'Court Nobles', icon: '👑', cost: 8, phase: 1, desc: 'Durbars in faded palaces. Royalist sentiment climbs.' },
    { id: 'heritage', label: 'Heritage Restoration', icon: '🏯', cost: 12, phase: 1, desc: 'The fort is repaired; so is the myth. People start believing.' },
    { id: 'buymla', label: 'Buy MLAs', icon: '💼', cost: 18, phase: 3, desc: 'Resort season. Legislators discover conscience and cash.' },
    { id: 'rumor', label: 'Rumor Campaign', icon: '🕯', cost: 6, phase: 2, desc: 'Whisper networks: "the Republic is on loan". Legitimacy bleeds.' },
  ],
  oligarch: [
    { id: 'memepage', label: 'Fund a Meme Page', icon: '📱', cost: 3, phase: 0, desc: 'Nobody traces a joke. Everybody repeats one.' },
    { id: 'fund', label: 'Fund a Faction', icon: '💰', cost: 10, phase: 1, desc: 'Quiet capital for the loudest street. They owe you now.' },
    { id: 'buymedia', label: 'Buy the Narrative', icon: '📡', cost: 12, phase: 1, desc: 'The Studio learns who pays for the lights.' },
    { id: 'broker', label: 'Broker Coalition', icon: '♟', cost: 15, phase: 2, desc: 'You assemble a government nobody voted for. Stability anyway.' },
    { id: 'crisisbet', label: 'Crisis Bet', icon: '🎲', cost: 5, phase: 3, desc: 'Short the republic. If it burns, you earn.' },
  ],
};

/** Cost and odds for a move the player wrote themselves. Consequences come from the GM. */
export const FREE_MOVE_COST = 4;

export function resolveFreeMove(s: GameState, text: string, targetRegion: string): { ok: boolean; odds: number; headline: string; ops: WorldOp[] } {
  const rg = s.regions[targetRegion] ?? s.regions['uttardesh'];
  const said = text.trim().slice(0, 200);
  const base = 0.5 + s.influence / 260 - rg.unrest / 320;
  const odds = clamp(Math.round((base + noise(etaFor(s) * 0.25)) * 100), 5, 92);
  const ok = rand() * 100 <= odds;
  return {
    ok,
    odds,
    headline: t(ok ? 'move.ok' : 'move.fail', { region: rg.name, said }),
    ops: ok
      ? [{ op: 'unrest', region: rg.id, delta: -2 }, { op: 'loyalty', region: rg.id, delta: 2 }]
      : [{ op: 'unrest', region: rg.id, delta: 4 }],
  };
}

export function hottestRegion(s: GameState): string {
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

export function resolveAction(s: GameState, actionId: string, targetRegion: string): { ok: boolean; odds: number; headline: string; ops: WorldOp[]; influenceDelta: number; treasuryDelta: number } {
  const def = ACTIONS[s.role].find((a) => a.id === actionId);
  if (!def) return { ok: false, odds: 0, headline: t('res.none'), ops: [], influenceDelta: 0, treasuryDelta: 0 };
  const rg = s.regions[targetRegion] ?? s.regions['uttardesh'];
  const nbrs = rg.neighbors;
  const spread = (delta: number, field: 'unrest' | 'loyalty' | 'royalist' | 'reservationHeat' | 'landHeat' | 'separatist'): WorldOp[] =>
    [rg.id, ...nbrs.slice(0, 2)].map((id, i) => ({ op: field, region: id, delta: Math.round(delta * (i === 0 ? 1 : 0.5)) }) as WorldOp);

  const label = t(`act.${def.id}`, {}, def.label);
  const vars = { action: label, region: rg.name, city: rg.city };
  const H = (k: string, extra: Record<string, string | number> = {}) => t(`res.${k}.h`, { ...vars, ...extra });
  const K = (k: string, extra: Record<string, string | number> = {}) => t(`res.${k}.t`, { ...vars, ...extra });

  const base = 0.55 + s.influence / 250 - rg.unrest / 300;
  const odds = clamp(Math.round((base + noise(etaFor(s) * 0.25)) * 100), 5, 95);
  const roll = rand() * 100;
  const ok = roll <= odds;
  const influenceDelta = ok ? (def.usesInfluence ? -4 : 2) : -6;
  const treasuryDelta = ok ? -def.cost : -Math.ceil(def.cost / 2);

  let ops: WorldOp[] = [];
  let headline = '';

  if (!ok) {
    ops = [{ op: 'unrest', region: rg.id, delta: 5, reason: 'backfire' }, { op: 'headline', text: K('fail') }];
    headline = H('fail');
    return { ok, odds, headline, ops, influenceDelta, treasuryDelta };
  }

  const mov: Movement = s.role === 'agitator' ? 'swarna' : 'mixed';
  switch (actionId) {
    case 'post':
      ops = [{ op: 'loyalty', region: rg.id, delta: 6 }, { op: 'unrest', region: rg.id, delta: -4 }, { op: 'factionPower', faction: 'swaraj', delta: 2 }, { op: 'headline', text: K('post') }];
      headline = H('post');
      break;
    case 'reel':
      ops = [{ op: 'reservationHeat', region: rg.id, delta: 8 }, { op: 'factionPower', faction: 'swarna', delta: 3 }, { op: 'headline', text: K('reel') }];
      headline = H('reel');
      break;
    case 'nostalgia':
      ops = [{ op: 'royalist', region: rg.id, delta: 8 }, { op: 'factionPower', faction: 'rajwada', delta: 2 }, { op: 'headline', text: K('nostalgia') }];
      headline = H('nostalgia');
      break;
    case 'memepage':
      ops = [{ op: 'factionPower', faction: 'media', delta: 4 }, { op: 'unrest', region: rg.id, delta: 3 }, { op: 'legitimacy', delta: -2 }, { op: 'headline', text: K('memepage') }];
      headline = H('memepage');
      break;
    case 'speech':
      ops = [...spread(-10, 'unrest'), ...spread(8, 'loyalty'), { op: 'character', id: 'moni', moodDelta: 5 }, { op: 'headline', text: K('speech') }];
      headline = H('speech');
      break;
    case 'crackdown':
      ops = [{ op: 'unrest', region: rg.id, delta: -18 }, { op: 'separatist', region: rg.id, delta: 6 }, { op: 'curfew', region: rg.id, on: true }, { op: 'character', id: 'amir', moodDelta: 8 }, { op: 'headline', text: K('crackdown') }];
      headline = H('crackdown');
      break;
    case 'welfare':
      ops = Object.values(s.regions).filter((x) => x.wealth <= 4).slice(0, 4).map((x) => ({ op: 'unrest', region: x.id, delta: -9 }) as WorldOp);
      ops.push({ op: 'headline', text: K('welfare') });
      headline = H('welfare');
      break;
    case 'negotiate':
      ops = [{ op: 'reservationHeat', region: rg.id, delta: -12 }, { op: 'landHeat', region: rg.id, delta: -8 }, { op: 'unrest', region: rg.id, delta: -6 }, { op: 'character', id: s.role === 'agitator' ? 'devraj' : 'thikait', moodDelta: 10 }, { op: 'headline', text: K('negotiate') }];
      headline = H('negotiate');
      break;
    case 'deploy':
      ops = [{ op: 'armyMove', from: 'madhyadesh', to: rg.id }, { op: 'unrest', region: rg.id, delta: -14 }, { op: 'separatist', region: rg.id, delta: 4 }, { op: 'character', id: 'rudra', moodDelta: -6 }, { op: 'headline', text: K('deploy') }];
      headline = H('deploy');
      break;
    case 'rally':
      ops = [{ op: 'protest', region: rg.id, size: 4, movement: 'swarna' }, ...spread(12, 'reservationHeat'), { op: 'factionPower', faction: 'swarna', delta: 8 }, { op: 'headline', text: K('rally') }];
      headline = H('rally');
      break;
    case 'fast':
      ops = [{ op: 'protest', region: rg.id, size: 3, movement: 'swarna' }, { op: 'legitimacy', delta: -5 }, { op: 'factionPower', faction: 'swarna', delta: 10 }, { op: 'factionPower', faction: 'media', delta: 5 }, { op: 'headline', text: K('fast') }];
      headline = H('fast');
      break;
    case 'blitz':
      ops = [{ op: 'factionPower', faction: 'media', delta: 8 }, { op: 'reservationHeat', region: rg.id, delta: 10 }, { op: 'character', id: 'aarab', moodDelta: 10 }, { op: 'headline', text: K('blitz') }];
      headline = H('blitz');
      break;
    case 'litigate':
      ops = [{ op: 'legitimacy', delta: -4 }, { op: 'reservationHeat', region: rg.id, delta: -8 }, { op: 'factionPower', faction: 'swarna', delta: 6 }, { op: 'factionPower', faction: 'bahujan', delta: -6 }, { op: 'headline', text: K('litigate') }];
      headline = H('litigate');
      break;
    case 'march':
      ops = [{ op: 'protest', region: 'indraprastha', size: 5, movement: 'swarna' }, { op: 'unrest', region: 'indraprastha', delta: 18 }, { op: 'legitimacy', delta: -8 }, { op: 'factionPower', faction: 'swarna', delta: 12 }, { op: 'headline', text: K('march') }];
      headline = H('march');
      break;
    case 'court':
      ops = [{ op: 'unrest', region: rg.id, delta: 4 }, ...spread(14, 'royalist'), { op: 'factionPower', faction: 'rajwada', delta: 8 }, { op: 'headline', text: K('court') }];
      headline = H('court');
      break;
    case 'heritage':
      ops = [...spread(10, 'royalist'), ...spread(-4, 'loyalty'), { op: 'headline', text: K('heritage') }];
      headline = H('heritage');
      break;
    case 'buymla':
      ops = [{ op: 'factionPower', faction: 'rajwada', delta: 10 }, { op: 'legitimacy', delta: -3 }, { op: 'royalist', region: rg.id, delta: 12 }, { op: 'unrest', region: rg.id, delta: -5 }, { op: 'headline', text: K('buymla') }];
      headline = H('buymla');
      break;
    case 'rumor':
      ops = [{ op: 'legitimacy', delta: -6 }, ...spread(8, 'royalist'), { op: 'headline', text: K('rumor') }];
      headline = H('rumor');
      break;
    case 'fund': {
      const f = Object.values(s.factions).sort((a, b) => b.power - a.power)[0];
      ops = [{ op: 'factionPower', faction: f.id, delta: 10 }, { op: 'headline', text: K('fund', { faction: t(`fac.${f.id}`, {}, f.name) }) }];
      headline = H('fund', { faction: t(`fac.${f.id}`, {}, f.name) });
      break;
    }
    case 'buymedia':
      ops = [{ op: 'factionPower', faction: 'media', delta: 10 }, { op: 'legitimacy', delta: 3 }, { op: 'character', id: 'aarab', moodDelta: 15 }, { op: 'headline', text: K('buymedia') }];
      headline = H('buymedia');
      break;
    case 'broker':
      ops = [{ op: 'legitimacy', delta: 6 }, { op: 'unrest', region: rg.id, delta: -10 }, { op: 'headline', text: K('broker') }];
      headline = H('broker');
      break;
    case 'crisisbet':
      if (rg.unrest > 55) {
        ops = [{ op: 'headline', text: K('crisisbet') }];
        headline = H('crisisbet');
        return { ok, odds, headline, ops, influenceDelta: 18, treasuryDelta: 5 };
      }
      ops = [{ op: 'unrest', region: rg.id, delta: 4 }, { op: 'headline', text: t('res.crisisbet.failt', vars) }];
      headline = t('res.crisisbet.failh', vars);
      return { ok, odds, headline, ops, influenceDelta: -8, treasuryDelta: -5 };
    default:
      ops = [{ op: 'headline', text: K('default') }];
      headline = H('default');
  }
  return { ok, odds, headline, ops, influenceDelta, treasuryDelta };
}
