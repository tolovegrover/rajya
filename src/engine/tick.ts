import { GameState, WorldOp, FactionId } from '../types';
import { cloneState, recompute } from './gameState';
import { clamp, rand, pick, noise, pickWeighted } from './util';
import { ROYAL_TITLES } from '../data/india';
import { etaFor, phaseOf } from './resolver';
import { t } from '../i18n';

export function tick(s: GameState): { state: GameState; ops: WorldOp[] } {
  const n = cloneState(s);
  const ops: WorldOp[] = [];
  n.turn += 1;
  n.week = (n.week % 52) + 1;
  if (n.week === 1) n.year += 1;
  const eta = etaFor(n);
  const phase = phaseOf(n.turn);

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

    if (phase >= 1 && rg.unrest > 80 && rand() < (rg.unrest - 80) / 50 + eta * 0.1) {
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
    if (phase >= 2 && !rg.kingdom && (chaosPath || nostalgiaPath)) {
      rg.kingdom = true;
      rg.loyalty = clamp(rg.loyalty - 25, 0, 100);
      ops.push({ op: 'restoreroyal', region: rg.id, king: t(`royal.${rg.id}`, {}, ROYAL_TITLES[rg.id]) });
    }

    if (phase >= 1 && rg.separatist > 82 && rand() < 0.15) {
      n.legitimacy = clamp(n.legitimacy - 4, 0, 100);
      ops.push({ op: 'legitimacy', delta: -4 });
      ops.push({ op: 'headline', text: t('tick.secession', { region: rg.name }) });
    }
  }

  const economy = Object.values(n.regions).reduce((acc, rg) => acc + rg.wealth * (100 - rg.unrest) / 100, 0);
  n.treasury = clamp(n.treasury + Math.round(economy / 26) - Object.values(n.regions).filter((r) => r.kingdom).length, 0, 500);

  if (n.stability < 45) n.legitimacy = clamp(n.legitimacy - 2, 0, 100);
  else if (n.stability > 75) n.legitimacy = clamp(n.legitimacy + 1, 0, 100);
  if (n.factions.rajwada.power > 50) n.legitimacy = clamp(n.legitimacy - 1, 0, 100);
  n.legitimacy = clamp(n.legitimacy + (n.stability - n.legitimacy) / 40, 0, 100);

  // street factions cool toward their base unless somebody keeps stoking them
  const streetBases: [FactionId, number][] = [
    ['swarna', 18], ['bahujan', 24], ['kisan', 20], ['media', 30],
  ];
  for (const [id, base] of streetBases) {
    const f = n.factions[id];
    f.power = clamp(f.power + Math.sign(base - f.power) * Math.min(1.2, Math.abs(base - f.power)), 0, 100);
  }

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
    ops.push({ op: 'headline', text: t('tick.election') });
  }

  const chaoses = ['defection', 'sting', 'absurd', 'betrayal'];
  // The last act leans in: after week 100 the noise rises even in calm campaigns.
  const effEta = n.turn > 100 ? Math.min(1, n.eta + 0.2) : n.eta;
  if (rand() < effEta * 0.12) {
    const rg = pick(Object.values(n.regions).filter((r) => !r.kingdom));
    ops.push({ op: 'unrest', region: rg.id, delta: 7 });
    ops.push({ op: 'headline', text: t('tick.chaos', { kind: t(`chaos.${pick(chaoses)}`), region: rg.name }) });
  }

  // The betrayer: in the last act, an ally of convenience shows their price.
  if (n.turn >= 88 && !(n as GameState & { betrayerFired?: boolean }).betrayerFired && rand() < 0.25 + n.eta * 0.3) {
    const allies: Record<string, string[]> = {
      strategist: ['raul', 'bikash', 'kalai'],
      agitator: ['ramrao', 'thikait', 'aarab'],
      royalist: ['bikash', 'moomta'],
      oligarch: ['bikash', 'kerji'],
    };
    const pool = (allies[n.role] ?? ['bikash']).filter((id) => n.characters[id]?.alive);
    if (pool.length) {
      const traitor = pick(pool);
      (n as GameState & { betrayerFired?: boolean }).betrayerFired = true;
      n.trust[traitor] = clamp((n.trust[traitor] ?? 0) - 60, -100, 100);
      n.legitimacy = clamp(n.legitimacy - 8, 0, 100);
      const capital = n.regions['indraprastha'];
      if (capital) capital.unrest = clamp(capital.unrest + 8, 0, 100);
      ops.push({ op: 'trust', id: traitor, delta: -60 });
      ops.push({ op: 'legitimacy', delta: -8 });
      ops.push({ op: 'headline', text: t('tick.betrayer', { name: n.characters[traitor]?.name ?? traitor }) });
    }
  }

  // Zhundes never sleeps: a border flutter every few weeks keeps the map honest.
  if (n.turn > 20 && rand() < 0.05) {
    const border = pick(['kashyapmir', 'purvanachal', 'kamarupa', 'cheralam', 'panchanad'].map((id) => n.regions[id]).filter(Boolean));
    if (border && !border.kingdom) {
      border.unrest = clamp(border.unrest + 3, 0, 100);
      ops.push({ op: 'headline', text: t('tick.intl', { region: border.name }) });
    }
  }

  recompute(n);
  const ending = checkEnding(n);
  if (ending) n.ending = ending;
  return { state: n, ops };
}

export function checkEnding(n: GameState): GameState['ending'] {
  if (n.ending) return n.ending;
  const kingmaker = n.role === 'oligarch' && n.influence >= 70;
  if ((n.legitimacy <= 0 || (n.factions.rajwada.power >= 60 && n.legitimacy < 30)) && n.turn >= 35) {
    if (n.factions.rajwada.power >= 60) {
      return {
        id: 'iron_crown',
        title: t('end.iron_crown.title'),
        text: t(`end.iron_crown.${n.role === 'royalist' ? 'royalist' : kingmaker ? 'oligarch' : 'other'}`),
      };
    }
    return {
      id: 'chaos',
      title: t('end.chaos.title'),
      text: t(`end.chaos.${n.role === 'strategist' ? 'strategist' : 'other'}`),
    };
  }
  if (n.royalPopPct >= 30) {
    return {
      id: 'age_of_rajyas',
      title: t('end.age_of_rajyas.title'),
      text: t(`end.age_of_rajyas.${n.role === 'royalist' ? 'royalist' : kingmaker ? 'kingmaker' : 'other'}`),
    };
  }
  if (n.turn >= 40 && n.factions.swarna.power >= 76 && n.factions.bahujan.power <= 20) {
    return {
      id: 'quota_repealed',
      title: t('end.quota_repealed.title'),
      text: t(`end.quota_repealed.${n.role === 'agitator' ? 'agitator' : 'other'}`),
    };
  }
  if (n.turn >= 120) {
    if (n.stability >= 60 && n.role === 'strategist') {
      return { id: 'republic_endures', title: t('end.republic_endures.title'), text: t('end.republic_endures.text') };
    }
    if (kingmaker) {
      return { id: 'kingmaker', title: t('end.kingmaker.title'), text: t('end.kingmaker.text') };
    }
    return { id: 'limp', title: t('end.limp.title'), text: t('end.limp.text') };
  }
  return null;
}
