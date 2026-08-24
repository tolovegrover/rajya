import { GameState, WorldOp, FactionId } from '../types';
import { cloneState, recompute } from './gameState';
import { clamp, rand, pick, noise, pickWeighted } from './util';
import { ROYAL_TITLES } from '../data/india';

export function tick(s: GameState): { state: GameState; ops: WorldOp[] } {
  const n = cloneState(s);
  const ops: WorldOp[] = [];
  n.turn += 1;
  n.week = (n.week % 52) + 1;
  if (n.week === 1) n.year += 1;
  const eta = n.eta;

  for (const rg of Object.values(n.regions)) {
    if (rg.kingdom) {
      rg.unrest = clamp(rg.unrest - 3, 0, 100);
      rg.royalist = clamp(rg.royalist + 1, 0, 100);
      continue;
    }
    let drift = -1.2;
    drift += (rg.reservationHeat - 50) / 14;
    drift += (rg.landHeat - 50) / 16;
    drift += ((100 - rg.loyalty) - 60) / 20;
    drift += (6 - rg.wealth) / 3.5;
    drift += noise(eta * 2.8);
    if (rg.curfew) drift -= 6;
    if (rg.army) drift -= 4;
    rg.unrest = clamp(rg.unrest + drift, 0, 100);

    if (rg.curfew) {
      rg.separatist = clamp(rg.separatist + 1.5, 0, 100);
      if (rg.unrest < 35 && rand() < 0.4) {
        rg.curfew = false;
        ops.push({ op: 'curfew', region: rg.id, on: false });
      }
    }
    if (rg.army) rg.separatist = clamp(rg.separatist + 1, 0, 100);

    rg.reservationHeat = clamp(rg.reservationHeat - 0.8 + noise(eta), 0, 100);
    rg.landHeat = clamp(rg.landHeat - 0.8 + noise(eta), 0, 100);
    const rajwadaSurge = n.factions.rajwada.power > 60 ? 0.8 : 0;
    rg.royalist = clamp(rg.royalist + (rg.unrest > 70 ? 1.4 : rg.unrest > 50 ? -0.1 : -0.5) + rajwadaSurge + noise(eta * 0.6), 0, 100);
    rg.separatist = clamp(rg.separatist + (rg.unrest > 75 ? 0.8 : -0.2) + noise(eta * 0.5), 0, 100);

    if (rg.unrest > 80 && rand() < (rg.unrest - 80) / 50 + eta * 0.1) {
      const sev = clamp(Math.round(1 + (rg.unrest - 80) / 8), 1, 5);
      rg.unrest = clamp(rg.unrest + sev * 2, 0, 100);
      rg.curfew = true;
      ops.push({ op: 'riot', region: rg.id, severity: sev });
      for (const nb of rg.neighbors) {
        const other = n.regions[nb];
        if (other && !other.kingdom && rand() < 0.35 + eta * 0.2) {
          other.unrest = clamp(other.unrest + 8, 0, 100);
          ops.push({ op: 'unrest', region: nb, delta: 8 });
        }
      }
    }

    const chaosPath = rg.unrest > 75 && rg.royalist > 58 && rand() < 0.1 + eta * 0.1;
    const nostalgiaPath = rg.royalist > 78 && n.legitimacy < 55 && rand() < 0.1 + eta * 0.12;
    if (!rg.kingdom && (chaosPath || nostalgiaPath)) {
      rg.kingdom = true;
      rg.loyalty = clamp(rg.loyalty - 25, 0, 100);
      ops.push({ op: 'restoreroyal', region: rg.id, king: ROYAL_TITLES[rg.id] });
    }

    if (rg.separatist > 82 && rand() < 0.15) {
      n.legitimacy = clamp(n.legitimacy - 4, 0, 100);
      ops.push({ op: 'legitimacy', delta: -4 });
      ops.push({ op: 'headline', text: `${rg.name.toUpperCase()} SECESSION CRISIS: THE MAP TREMBLES` });
    }
  }

  const economy = Object.values(n.regions).reduce((acc, rg) => acc + rg.wealth * (100 - rg.unrest) / 100, 0);
  n.treasury = clamp(n.treasury + Math.round(economy / 26) - Object.values(n.regions).filter((r) => r.kingdom).length, 0, 500);

  if (n.stability < 45) n.legitimacy = clamp(n.legitimacy - 2, 0, 100);
  else if (n.stability > 75) n.legitimacy = clamp(n.legitimacy + 1, 0, 100);
  if (n.factions.rajwada.power > 50) n.legitimacy = clamp(n.legitimacy - 1, 0, 100);

  if (n.turn >= n.nextElectionTurn) {
    n.nextElectionTurn = n.turn + 16;
    const pool = Object.values(n.regions).filter((r) => !r.kingdom);
    for (const rg of pool.sort(() => rand() - 0.5).slice(0, 4)) {
      const winner = pickWeighted<FactionId>([
        ['swaraj', n.factions.swaraj.power + rg.loyalty / 2],
        ['kangress', n.factions.kangress.power + (100 - rg.loyalty) / 3],
        ['dravida', ['tamizhagam', 'cheralam', 'karnata', 'andhradesam', 'telingana'].includes(rg.id) ? n.factions.dravida.power : 4],
        ['rajwada', rg.royalist / 2],
        ['kisan', rg.landHeat / 2],
      ]);
      ops.push({ op: 'election', region: rg.id, winner });
    }
    ops.push({ op: 'headline', text: 'ELECTION NIGHT: FOUR STATES, ONE QUESTION — WHOSE TURN?' });
  }

  const chaoses = ['defection', 'sting', 'absurd', 'betrayal'];
  if (rand() < eta * 0.12) {
    const rg = pick(Object.values(n.regions).filter((r) => !r.kingdom));
    ops.push({ op: 'unrest', region: rg.id, delta: 7 });
    ops.push({ op: 'headline', text: `${pick(chaoses).toUpperCase()} SHOCKER HITS ${rg.name.toUpperCase()}` });
  }

  recompute(n);
  const ending = checkEnding(n);
  if (ending) n.ending = ending;
  return { state: n, ops };
}

export function checkEnding(n: GameState): GameState['ending'] {
  if (n.ending) return n.ending;
  const kingmaker = n.role === 'oligarch' && n.influence >= 70;
  if (n.legitimacy <= 0) {
    if (n.factions.rajwada.power >= 60) {
      return {
        id: 'iron_crown',
        title: 'The Iron Crown',
        text:
          n.role === 'royalist'
            ? 'With the Republic\'s legitimacy at zero, Gen. Rudra Pratap made the shortest broadcast in history: "The Court returns what was loaned." Vikramaditya IV entered the capital not as a conqueror but as an appointment. You wrote that appointment.'
            : n.role === 'oligarch' && n.influence >= 70
              ? 'With legitimacy at zero, the Crown\'s Court chose the quiet option: the Maharaja, escorted by troops your money fed for years. The throne rises; the ledger clears; the Kingmaker is history\'s footnote with everyone\'s debts on file.'
              : 'With legitimacy at zero, the generals chose restoration over rule. Vikramaditya IV returned to a capital that had forgotten how to kneel, and remembered quickly. The Republic\'s strategists are already rewriting their memoirs in exile.',
      };
    }
    return {
      id: 'chaos',
      title: 'The Silence of the Sirens',
      text:
        n.role === 'strategist'
          ? 'With legitimacy at zero, Gen. Rudra Pratap read a one-paragraph statement on national television. The Republic did not fall with a bang, but with a bulletin. You are advised to leave the capital quietly.'
          : 'The Republic dissolved into static. The Crown\'s Court took charge "for a period nobody defined". Your assets, unlike your allies, survived.',
    };
  }
  if (n.royalPopPct >= 30) {
    return {
      id: 'age_of_rajyas',
      title: 'The Age of Rajyas',
      text:
        n.role === 'royalist'
          ? `Thirty percent of Bharatam lives under restored crowns. Vikramaditya IV thanks you with a title, a jagir, and the best chair in the durbar. The experiment in elections is remembered as "the interregnum".`
          : `The map shattered into coronations. Vikramaditya IV holds court over what remains; ${kingmaker ? 'and it is whispered the new order runs on your money.' : 'and the strategists of the old Republic scatter into exile.'}`,
    };
  }
  if (n.factions.swarna.power >= 76 && n.factions.bahujan.power <= 20) {
    return {
      id: 'quota_repealed',
      title: 'The Merit Restoration',
      text:
        n.role === 'agitator'
          ? 'Parliament repealed the quota framework in a stormy midnight session. Devraj wept on camera; Ramrao vowed to fight on; the constitutional court prepared for a decade of war. Your movement remade the republic — for better or worse, history now argues.'
          : 'Parliament repealed the quota framework. The Swarna Aandolan owns the republic\'s new rulebook, and the streets are already drafting its rebuttal.',
    };
  }
  if (n.turn >= 120) {
    if (n.stability >= 60 && n.role === 'strategist') {
      return {
        id: 'republic_endures',
        title: 'The Republic Endures',
        text: 'One hundred and twenty weeks of fire, and the tricolour still means something. Moni credits the people; Amir Sahab credits the files; you know exactly who to credit. Democracy: defended, dented, alive.',
      };
    }
    if (n.role === 'oligarch' && n.influence >= 70) {
      return {
        id: 'kingmaker',
        title: 'The Kingmaker',
        text: 'The term ended with the Republic battered but standing — and every party that survived it owes you. No crown, no chair: just the quiet knowledge that nothing moves without your nod.',
      };
    }
    return {
      id: 'limp',
      title: 'Battered but Breathing',
      text: 'The term limped to its end. The Republic survives the way an old car does — loudly, and only downhill. The voters are already queuing to answer for all of you.',
    };
  }
  return null;
}
