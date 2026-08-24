import { GameState, PlayerActionDef, PlayerRoleId, WorldOp, Movement } from '../types';
import { clamp, noise, rand } from './util';

export const ACTIONS: Record<PlayerRoleId, PlayerActionDef[]> = {
  strategist: [
    { id: 'speech', label: 'Moni Speech', icon: '🎙', cost: 5, desc: 'A mega-rally broadcast to the hot zones. Loyalty up, unrest down.' },
    { id: 'crackdown', label: 'SIT Crackdown', icon: '🗄', cost: 0, desc: 'Amir Sahab opens the files. Crush unrest, feed separatism.' },
    { id: 'welfare', label: 'Welfare Scheme', icon: '🎁', cost: 25, usesInfluence: true, desc: 'Cylinders for everyone. Calms the poorest regions.' },
    { id: 'negotiate', label: 'Backchannel', icon: '🤝', cost: 8, desc: 'Tea with the agitating leader. Moods soften, heat cools.' },
    { id: 'deploy', label: 'Deploy Army', icon: '🎖', cost: 15, desc: 'Gen. Rudra moves in. Order restored, friction with Delhi later.' },
  ],
  agitator: [
    { id: 'rally', label: 'Maharally', icon: '📣', cost: 5, desc: 'Swarna Aandolan floods a state capital. Quota heat surges.' },
    { id: 'fast', label: 'Fast-unto-Death', icon: '⚖️', cost: 10, desc: 'Devraj refuses food on live TV. The nation holds its breath.' },
    { id: 'blitz', label: 'Studio Blitz', icon: '📺', cost: 8, desc: 'Swammy Aarab makes merit the only story for a week.' },
    { id: 'litigate', label: 'Fund Litigation', icon: '🏛', cost: 12, desc: 'Senior advocates attack the quota in constitutional court.' },
    { id: 'march', label: 'March to Indraprastha', icon: '🚩', cost: 20, desc: 'The final march. Everything, on the capital.' },
  ],
  royalist: [
    { id: 'court', label: 'Court Nobles', icon: '👑', cost: 8, desc: 'Durbars in faded palaces. Royalist sentiment climbs.' },
    { id: 'heritage', label: 'Heritage Restoration', icon: '🏯', cost: 12, desc: 'The fort is repaired; so is the myth. People start believing.' },
    { id: 'buymla', label: 'Buy MLAs', icon: '💼', cost: 18, desc: 'Resort season. Legislators discover conscience and cash.' },
    { id: 'rumor', label: 'Rumor Campaign', icon: '🕯', cost: 6, desc: 'Whisper networks: "the Republic is on loan". Legitimacy bleeds.' },
  ],
  oligarch: [
    { id: 'fund', label: 'Fund a Faction', icon: '💰', cost: 10, desc: 'Quiet capital for the loudest street. They owe you now.' },
    { id: 'buymedia', label: 'Buy the Narrative', icon: '📡', cost: 12, desc: 'The Studio learns who pays for the lights.' },
    { id: 'broker', label: 'Broker Coalition', icon: '♟', cost: 15, desc: 'You assemble a government nobody voted for. Stability anyway.' },
    { id: 'crisisbet', label: 'Crisis Bet', icon: '🎲', cost: 5, desc: 'Short the republic. If it burns, you earn.' },
  ],
};

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
  if (!def) return { ok: false, odds: 0, headline: 'No such move.', ops: [], influenceDelta: 0, treasuryDelta: 0 };
  const rg = s.regions[targetRegion] ?? s.regions['uttardesh'];
  const nbrs = rg.neighbors;
  const spread = (delta: number, field: 'unrest' | 'loyalty' | 'royalist' | 'reservationHeat' | 'landHeat' | 'separatist'): WorldOp[] =>
    [rg.id, ...nbrs.slice(0, 2)].map((id, i) => ({ op: field, region: id, delta: Math.round(delta * (i === 0 ? 1 : 0.5)) }) as WorldOp);

  const base = 0.55 + s.influence / 250 - rg.unrest / 300;
  const odds = clamp(Math.round((base + noise(s.eta * 0.25)) * 100), 5, 95);
  const roll = rand() * 100;
  const ok = roll <= odds;
  const influenceDelta = ok ? (def.usesInfluence ? -4 : 2) : -6;
  const treasuryDelta = ok ? -def.cost : -Math.ceil(def.cost / 2);

  let ops: WorldOp[] = [];
  let headline = '';

  if (!ok) {
    ops = [{ op: 'unrest', region: rg.id, delta: 5, reason: 'backfire' }, { op: 'headline', text: `${def.label} BACKFIRES IN ${rg.name.toUpperCase()}` }];
    headline = `${def.label} misfired in ${rg.name}. The Studio smells blood.`;
    return { ok, odds, headline, ops, influenceDelta, treasuryDelta };
  }

  const mov: Movement = s.role === 'agitator' ? 'swarna' : 'mixed';
  switch (actionId) {
    case 'speech':
      ops = [...spread(-10, 'unrest'), ...spread(8, 'loyalty'), { op: 'character', id: 'moni', moodDelta: 5 }, { op: 'headline', text: `MONI THUNDERS: "${rg.name.toUpperCase()}, THE FUTURE IS YOU"` }];
      headline = `Moni\'s rally in ${rg.city} bent the airwaves; the hot zones cooled a degree.`;
      break;
    case 'crackdown':
      ops = [{ op: 'unrest', region: rg.id, delta: -18 }, { op: 'separatist', region: rg.id, delta: 6 }, { op: 'curfew', region: rg.id, on: true }, { op: 'character', id: 'amir', moodDelta: 8 }, { op: 'headline', text: `SIT RAIDS ROCK ${rg.name.toUpperCase()}: "WE HAVE THE FILES"` }];
      headline = `Amir Sahab\'s files opened in ${rg.name}. Order returned; something else woke up.`;
      break;
    case 'welfare':
      ops = Object.values(s.regions).filter((x) => x.wealth <= 4).slice(0, 4).map((x) => ({ op: 'unrest', region: x.id, delta: -9 }) as WorldOp);
      ops.push({ op: 'headline', text: 'CYLINDERS FOR ALL: FISCAL HAWKS FAINT IN INSTALLMENTS' });
      headline = `Cylinders rained on the poorest districts. Arithmetic wept; the streets smiled.`;
      break;
    case 'negotiate':
      ops = [{ op: 'reservationHeat', region: rg.id, delta: -12 }, { op: 'landHeat', region: rg.id, delta: -8 }, { op: 'unrest', region: rg.id, delta: -6 }, { op: 'character', id: s.role === 'agitator' ? 'devraj' : 'thikait', moodDelta: 10 }, { op: 'headline', text: `TEA SUMMIT IN ${rg.city.toUpperCase()}: HEAT DOWN, OPTICS UP` }];
      headline = `Backchannel tea in ${rg.city}. Nobody hugged, but nobody walked out.`;
      break;
    case 'deploy':
      ops = [{ op: 'armyMove', from: 'madhyadesh', to: rg.id }, { op: 'unrest', region: rg.id, delta: -14 }, { op: 'separatist', region: rg.id, delta: 4 }, { op: 'character', id: 'rudra', moodDelta: -6 }, { op: 'headline', text: ` Columns OF THE CROWN'S COURT ENTER ${rg.name.toUpperCase()}` }];
      headline = `Gen. Rudra\'s columns rolled into ${rg.name}. The map went quiet; the general went on record.`;
      break;
    case 'rally':
      ops = [{ op: 'protest', region: rg.id, size: 4, movement: 'swarna' }, ...spread(12, 'reservationHeat'), { op: 'factionPower', faction: 'swarna', delta: 8 }, { op: 'headline', text: `SWARNA SEA FLOODS ${rg.city.toUpperCase()}: MERIT OR NOTHING` }];
      headline = `The Swarna sea flooded ${rg.city}, marksheets held like torches.`;
      break;
    case 'fast':
      ops = [{ op: 'protest', region: rg.id, size: 3, movement: 'swarna' }, { op: 'legitimacy', delta: -5 }, { op: 'factionPower', faction: 'swarna', delta: 10 }, { op: 'factionPower', faction: 'media', delta: 5 }, { op: 'headline', text: 'DEVRAJ DAY 5 OF FAST: NATION WATCHES WAISTLINE OF STATE' }];
      headline = `Devraj\'s fast entered its fifth day; the state\'s conscience lost weight visibly.`;
      break;
    case 'blitz':
      ops = [{ op: 'factionPower', faction: 'media', delta: 8 }, { op: 'reservationHeat', region: rg.id, delta: 10 }, { op: 'character', id: 'aarab', moodDelta: 10 }, { op: 'headline', text: 'THE STUDIO: "MERIT MURDER? THE NATION WANTS TO KNOW"' }];
      headline = `The Studio made merit the only story. Panels multiplied; nuance fled to the hills.`;
      break;
    case 'litigate':
      ops = [{ op: 'legitimacy', delta: -4 }, { op: 'reservationHeat', region: rg.id, delta: -8 }, { op: 'factionPower', faction: 'swarna', delta: 6 }, { op: 'factionPower', faction: 'bahujan', delta: -6 }, { op: 'headline', text: 'CONSTITUTIONAL COURT TAKES UP QUOTA SUIT: SENIORS CIRCLE' }];
      headline = `Senior advocates circled the quota in constitutional court; the bench felt the weather change.`;
      break;
    case 'march':
      ops = [{ op: 'protest', region: 'indraprastha', size: 5, movement: 'swarna' }, { op: 'unrest', region: 'indraprastha', delta: 18 }, { op: 'legitimacy', delta: -8 }, { op: 'factionPower', faction: 'swarna', delta: 12 }, { op: 'headline', text: 'THE MARCH ON INDRAPRASTHA: OLD FORT GATES IN SIGHT' }];
      headline = `The march reached the capital\'s edge. History cleared its throat.`;
      break;
    case 'court':
      ops = [{ op: 'unrest', region: rg.id, delta: 4 }, ...spread(14, 'royalist'), { op: 'factionPower', faction: 'rajwada', delta: 8 }, { op: 'headline', text: `DURBAR IN ${rg.name.toUpperCase()}: SWORDS POLISHED, MLAS COURTED` }];
      headline = `Durbar in ${rg.name}. Swords were polished; so were some MLAs.`;
      break;
    case 'heritage':
      ops = [...spread(10, 'royalist'), ...spread(-4, 'loyalty'), { op: 'headline', text: `${rg.name.toUpperCase()} FORT RESTORED: THE MYTH REOPENED` }];
      headline = `The fort of ${rg.name} reopened, and with it a myth with better air-conditioning.`;
      break;
    case 'buymla':
      ops = [{ op: 'factionPower', faction: 'rajwada', delta: 10 }, { op: 'legitimacy', delta: -3 }, { op: 'royalist', region: rg.id, delta: 12 }, { op: 'unrest', region: rg.id, delta: -5 }, { op: 'headline', text: 'RESORT SEASON: CONSCIENCE DISCOVERED AT SEA-FACING RATES' }];
      headline = `Resort season in ${rg.name}: conscience discovered at sea-facing rates.`;
      break;
    case 'rumor':
      ops = [{ op: 'legitimacy', delta: -6 }, ...spread(8, 'royalist'), { op: 'headline', text: 'WHISPER NETWORK: "THE REPUBLIC WAS ON LOAN"' }];
      headline = `The whisper networks did their work: "the Republic was on loan, and the loan is due".`;
      break;
    case 'fund': {
      const f = Object.values(s.factions).sort((a, b) => b.power - a.power)[0];
      ops = [{ op: 'factionPower', faction: f.id, delta: 10 }, { op: 'headline', text: `CAPITAL FLOWS QUIETLY TOWARD ${f.name.toUpperCase()}` }];
      headline = `Quiet capital flowed toward ${f.name}. They owe you now; owing compounds.`;
      break;
    }
    case 'buymedia':
      ops = [{ op: 'factionPower', faction: 'media', delta: 10 }, { op: 'legitimacy', delta: 3 }, { op: 'character', id: 'aarab', moodDelta: 15 }, { op: 'headline', text: 'THE STUDIO LEARNS WHO PAYS FOR THE LIGHTS' }];
      headline = `The Studio learned who pays for the lights. The news stayed loud; the truth, negotiable.`;
      break;
    case 'broker':
      ops = [{ op: 'legitimacy', delta: 6 }, { op: 'unrest', region: rg.id, delta: -10 }, { op: 'headline', text: 'A GOVERNMENT NOBODY VOTED FOR, STABILITY ANYWAY' }];
      headline = `You assembled a government nobody voted for. Stability, anyway.`;
      break;
    case 'crisisbet':
      if (rg.unrest > 55) {
        ops = [{ op: 'headline', text: 'SHORTING THE REPUBLIC PAYS HANDSOMELY' }];
        headline = `You shorted the Republic; ${rg.name} burned bright on your ledger.`;
        return { ok, odds, headline, ops, influenceDelta: 18, treasuryDelta: 5 };
      }
      ops = [{ op: 'unrest', region: rg.id, delta: 4 }, { op: 'headline', text: 'THE BET MISFIRES: REPUBLIC REFUSES TO BURN ON SCHEDULE' }];
      headline = `You shorted the Republic; it refused to burn on schedule. Rude.`;
      return { ok, odds, headline, ops, influenceDelta: -8, treasuryDelta: -5 };
    default:
      ops = [{ op: 'headline', text: 'SOMETHING HAPPENED; HISTORIANS DISAGREE WHAT' }];
      headline = `Something happened. Historians disagree what.`;
  }
  return { ok, odds, headline, ops, influenceDelta, treasuryDelta };
}
