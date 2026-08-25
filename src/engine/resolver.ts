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

// Generic/metaphorical commands are refused as vague — a move must name an action.
const MOVE_STOP = new Set([
  'ok', 'okay', 'yes', 'no', 'haan', 'han', 'hmm', 'theek', 'thik', 'thik hai', 'theek hai',
  'do it', 'karo', 'kar do', 'kijiye', 'i agree', 'accha', 'done', 'fine', 'whatever',
  'win', 'jeet', 'jeet jao', 'win the match', 'win the game', 'jeet dilao', 'make me win',
  'jitna ho sake', 'best karo', 'do something', 'kuch karo', 'kuch bhi karo', 'trust me',
  'bharosa karo', 'aage badho', 'go ahead', 'continue', 'chalega', 'jaldi karo', 'anything',
]);

// Action words (English + Hindi) — a specific move must contain one of these.
const MOVE_HINTS = [
  'rally', 'protest', 'march', 'speech', 'bribe', 'pay', 'fund', 'arrest', 'raid', 'file',
  'case', 'leak', 'expose', 'hack', 'buy', 'sell', 'block', 'strike', 'bandh', 'dharna',
  'campaign', 'ad', 'tweet', 'post', 'publish', 'media', 'court', 'army', 'police',
  'resign', 'sack', 'fire', 'hire', 'appoint', 'alliance', 'coalition', 'quit', 'audit',
  'investigate', 'transfer', 'freeze', 'release', 'apologize', 'announce', 'scam', 'sting',
  'boycott', 'slogan', 'poster', 'jail', 'bail', 'ban', 'repeal', 'law', 'bill', 'order',
  'रैली', 'प्रदर्शन', 'धरना', 'भाषण', 'रिश्वत', 'गिरफ्तार', 'छापा', 'लीक', 'खबर', 'अदालत',
  'मीडिया', 'फौज', 'पुलिस', 'इस्तीफा', 'गठबंधन', 'घोटाला', 'हड़ताल', 'बंद', 'योजना',
  'घोषणा', 'जांच', 'मुकदमा', 'कानून', 'विधेयक', 'आदेश', 'जमानत', 'जेल', 'बहिष्कार',
  'नारा', 'पोस्टर', 'भर्ती', 'नियुक्ति', 'फंड', 'भुगतान', 'बर्खास्त', 'त्यागपत्र',
];

export interface FreeMoveAssessment {
  vague: boolean;
  reason?: 'short' | 'noaction' | 'generic';
  cost: number;
  risk: number;
  base: number;
  odds: number;
}

export function assessFreeMove(s: GameState, text: string, targetRegion: string): FreeMoveAssessment {
  const rg = s.regions[targetRegion] ?? s.regions['uttardesh'];
  const said = text.trim().toLowerCase();
  const words = said.split(/\s+/).filter(Boolean);
  const hintHit = MOVE_HINTS.some((h) => said.includes(h));
  const stopHit =
    MOVE_STOP.has(said) || (words.length <= 3 && words.some((w) => MOVE_STOP.has(w)));
  let reason: FreeMoveAssessment['reason'];
  let vague = false;
  if (said.length < 6 || words.length < 2) {
    vague = true;
    reason = 'short';
  } else if (!hintHit) {
    vague = true;
    reason = 'noaction';
  } else if (stopHit) {
    vague = true;
    reason = 'generic';
  }
  const risk = rg.unrest >= 80 ? 6 : rg.unrest >= 60 ? 3 : 0;
  const cost = FREE_MOVE_COST + risk;
  const base = 0.5 + s.influence / 260 - rg.unrest / 320 - (vague ? 0.18 : 0);
  const odds = clamp(Math.round(base * 100), 5, 92);
  return { vague, reason, cost, risk, base, odds };
}

export function resolveFreeMove(
  s: GameState,
  text: string,
  targetRegion: string,
  assessment?: FreeMoveAssessment
): { ok: boolean; odds: number; headline: string; ops: WorldOp[] } {
  const rg = s.regions[targetRegion] ?? s.regions['uttardesh'];
  const said = text.trim().slice(0, 200);
  const a = assessment ?? assessFreeMove(s, text, targetRegion);
  const odds = clamp(Math.round((a.base + noise(etaFor(s) * 0.25)) * 100), 5, 92);
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

export interface EdictDef {
  id: string;
  icon: string;
  phase: number;
  cost: number;
  cooldown: number;
  desc: string;
}

export const EDICTS: EdictDef[] = [
  { id: 'mediaorder', icon: '📡', phase: 1, cost: 12, cooldown: 15, desc: 'One newsroom to rule them all. The Studio blooms; the republic raises an eyebrow.' },
  { id: 'midnight', icon: '💸', phase: 1, cost: 15, cooldown: 24, desc: 'The big notes die at midnight. Treasury floods; the bazaars and fields howl.' },
  { id: 'garibi', icon: '🎁', phase: 2, cost: 20, cooldown: 25, desc: 'Direct cash to every poor household. Calm streets, empty coffers, grateful voters.' },
  { id: 'crowntalk', icon: '👑', phase: 2, cost: 18, cooldown: 20, desc: 'Outlaw throne restoration talk. Royalists retreat; the republic stands taller.' },
  { id: 'emergency', icon: '🛑', phase: 3, cost: 30, cooldown: 40, desc: 'Emergency powers: silence every street tonight, and pay for it in history.' },
];

export function resolveEdict(
  s: GameState,
  id: string
): { ok: boolean; reason?: 'locked' | 'cooldown' | 'poor'; ops: WorldOp[] } {
  const def = EDICTS.find((e) => e.id === id);
  if (!def) return { ok: false, reason: 'locked', ops: [] };
  if ((def.phase ?? 0) > phaseOf(s.turn)) return { ok: false, reason: 'locked', ops: [] };
  const last = s.edictLastUsed[id] ?? -1e9;
  if (s.turn - last < def.cooldown) return { ok: false, reason: 'cooldown', ops: [] };
  if (s.influence < def.cost) return { ok: false, reason: 'poor', ops: [] };
  const all = Object.values(s.regions).filter((r) => !r.kingdom);
  const poor = [...all].sort((a, b) => a.wealth - b.wealth).slice(0, 3).map((r) => r.id);
  const hot = [...all].sort((a, b) => b.unrest - a.unrest).slice(0, 3).map((r) => r.id);
  const ops: WorldOp[] = [];
  const push = (op: WorldOp) => ops.push(op);
  switch (id) {
    case 'mediaorder':
      push({ op: 'factionPower', faction: 'media', delta: 15 });
      push({ op: 'legitimacy', delta: -6 });
      hot.forEach((r) => push({ op: 'unrest', region: r, delta: -4 }));
      push({ op: 'headline', text: '📡 NATIONAL MEDIA ORDER: THE STUDIO THANKS YOU LOUDLY' });
      break;
    case 'midnight':
      push({ op: 'treasury', delta: 25 });
      push({ op: 'legitimacy', delta: -8 });
      poor.forEach((r) => push({ op: 'landHeat', region: r, delta: 10 }));
      poor.forEach((r) => push({ op: 'unrest', region: r, delta: 5 }));
      push({ op: 'headline', text: '💸 MIDNIGHT NOTE-BAN: QUEUES AT DAWN, CRITICS BY NOON' });
      break;
    case 'garibi':
      push({ op: 'treasury', delta: -30 });
      poor.forEach((r) => push({ op: 'unrest', region: r, delta: -12 }));
      poor.forEach((r) => push({ op: 'loyalty', region: r, delta: 8 }));
      push({ op: 'headline', text: '🎁 DIRECT GARIBI TRANSFER: CYLINDERS AND FORGIVENESS' });
      break;
    case 'crowntalk':
      all.forEach((r) => push({ op: 'royalist', region: r.id, delta: -10 }));
      push({ op: 'factionPower', faction: 'rajwada', delta: -12 });
      push({ op: 'legitimacy', delta: 8 });
      push({ op: 'headline', text: '👑 CROWN DIALOGUE ACT: PALACES SULK, THE REPUBLIC SIGHS' });
      break;
    case 'emergency':
      all.forEach((r) => push({ op: 'unrest', region: r.id, delta: -15 }));
      all.forEach((r) => push({ op: 'separatist', region: r.id, delta: 5 }));
      push({ op: 'legitimacy', delta: -15 });
      push({ op: 'headline', text: '🛑 EMERGENCY POWERS INVOKED: THE STREETS GO QUIET' });
      break;
    default:
      return { ok: false, reason: 'locked', ops: [] };
  }
  return { ok: true, ops };
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

/** Some moves are only available while the right person trusts you. */
export const TRUST_GATES: Record<string, [string, number]> = {
  crackdown: ['amir', -10],
  deploy: ['rudra', 0],
  march: ['devraj', 20],
  fast: ['devraj', 10],
  buymla: ['vikram', 25],
  broker: ['bikash', 0],
  crisisbet: ['aarab', -10],
};

/** Trust shifts bundled with each action (fired on success). */
const TRUST_DELTAS: Record<string, [string, number][]> = {
  post: [['moni', 2]],
  speech: [['moni', 4]],
  crackdown: [['amir', 5], ['maulana', -6], ['rudra', -2]],
  welfare: [['moni', 3], ['thikait', 5], ['devraj', -4]],
  negotiate: [['thikait', 4], ['devraj', 3]],
  deploy: [['rudra', 2], ['amir', 3], ['kalai', -5]],
  reel: [['devraj', 2]],
  rally: [['devraj', 4], ['ramrao', -3]],
  fast: [['devraj', 6], ['aarab', 4]],
  blitz: [['aarab', 6]],
  litigate: [['devraj', 4]],
  march: [['devraj', 8], ['moni', -6]],
  nostalgia: [['vikram', 2]],
  court: [['vikram', 5]],
  heritage: [['vikram', 6]],
  buymla: [['vikram', 7], ['bikash', 3]],
  rumor: [['vikram', 4]],
  memepage: [['aarab', 2]],
  fund: [['bikash', 3], ['aarab', 2]],
  buymedia: [['aarab', 8]],
  broker: [['bikash', 8], ['moni', -3]],
  crisisbet: [['aarab', 3]],
};

const BACKFIRE_TRUST: Record<string, [string, number][]> = {
  strategist: [['moni', -3]],
  agitator: [['devraj', -3]],
  royalist: [['vikram', -3]],
  oligarch: [['aarab', -3]],
};

export function resolveAction(s: GameState, actionId: string, targetRegion: string): { ok: boolean; odds: number; headline: string; ops: WorldOp[]; influenceDelta: number; treasuryDelta: number } {
  const def = ACTIONS[s.role].find((a) => a.id === actionId);
  if (!def) return { ok: false, odds: 0, headline: t('res.none'), ops: [], influenceDelta: 0, treasuryDelta: 0 };
  const gate = TRUST_GATES[actionId];
  if (gate) {
    const [charId, min] = gate;
    const trust = s.trust[charId] ?? 0;
    if (trust < min) {
      return { ok: false, odds: 0, headline: t('res.trust', { c: s.characters[charId]?.name ?? charId, n: min }), ops: [], influenceDelta: 0, treasuryDelta: 0 };
    }
  }
  const rg = s.regions[targetRegion] ?? s.regions['uttardesh'];
  const nbrs = rg.neighbors;
  const spread = (delta: number, field: 'unrest' | 'loyalty' | 'royalist' | 'reservationHeat' | 'landHeat' | 'separatist'): WorldOp[] =>
    [rg.id, ...nbrs.slice(0, 2)].map((id, i) => ({ op: field, region: id, delta: Math.round(delta * (i === 0 ? 1 : 0.5)) }) as WorldOp);

  const label = t(`act.${def.id}`, {}, def.label);
  const vars = { action: label, region: rg.name, city: rg.city };
  const H = (k: string, extra: Record<string, string | number> = {}) => t(`res.${k}.h`, { ...vars, ...extra });
  const K = (k: string, extra: Record<string, string | number> = {}) => t(`res.${k}.t`, { ...vars, ...extra });

  const base = 0.58 + s.influence / 300 - rg.unrest / 500;
  const odds = clamp(Math.round((base + noise(etaFor(s) * 0.25)) * 100), 5, 95);
  const roll = rand() * 100;
  const ok = roll <= odds;
  const influenceDelta = ok ? (def.usesInfluence ? -4 : 3) : -2;
  const treasuryDelta = ok ? -def.cost : -Math.ceil(def.cost / 2);

  let ops: WorldOp[] = [];
  let headline = '';

  if (!ok) {
    ops = [{ op: 'unrest', region: rg.id, delta: 5, reason: 'backfire' }, { op: 'headline', text: K('fail') }, ...(BACKFIRE_TRUST[s.role] ?? []).map(([id, delta]) => ({ op: 'trust', id, delta }) as WorldOp)];
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
      ops = [{ op: 'legitimacy', delta: -4 }, { op: 'reservationHeat', region: rg.id, delta: -8 }, { op: 'factionPower', faction: 'swarna', delta: 6 }, { op: 'factionPower', faction: 'bahujan', delta: -10 }, { op: 'headline', text: K('litigate') }];
      headline = H('litigate');
      break;
    case 'march':
      ops = [{ op: 'protest', region: 'indraprastha', size: 5, movement: 'swarna' }, { op: 'unrest', region: 'indraprastha', delta: 18 }, { op: 'legitimacy', delta: -8 }, { op: 'factionPower', faction: 'swarna', delta: 12 }, { op: 'headline', text: K('march') }];
      headline = H('march');
      break;
    case 'court':
      ops = [{ op: 'unrest', region: rg.id, delta: 4 }, ...spread(14, 'royalist'), { op: 'factionPower', faction: 'rajwada', delta: 10 }, { op: 'headline', text: K('court') }];
      headline = H('court');
      break;
    case 'heritage':
      ops = [...spread(10, 'royalist'), ...spread(-4, 'loyalty'), { op: 'factionPower', faction: 'rajwada', delta: 6 }, { op: 'headline', text: K('heritage') }];
      headline = H('heritage');
      break;
    case 'buymla':
      ops = [{ op: 'factionPower', faction: 'rajwada', delta: 14 }, { op: 'legitimacy', delta: -3 }, { op: 'royalist', region: rg.id, delta: 12 }, { op: 'unrest', region: rg.id, delta: -5 }, { op: 'headline', text: K('buymla') }];
      headline = H('buymla');
      break;
    case 'rumor':
      ops = [{ op: 'legitimacy', delta: -6 }, ...spread(8, 'royalist'), { op: 'factionPower', faction: 'rajwada', delta: 2 }, { op: 'headline', text: K('rumor') }];
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
  ops.push(...(TRUST_DELTAS[actionId] ?? []).map(([id, delta]) => ({ op: 'trust', id, delta }) as WorldOp));
  return { ok, odds, headline, ops, influenceDelta, treasuryDelta };
}
