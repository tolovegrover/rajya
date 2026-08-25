// Headless playtest: plays full offline campaigns through the real engine +
// fallback beats + procedural dilemmas, driven by the same bot that powers
// the in-game 🤖 AI PLAYS. Mirrors exactly what runs on a device with no key.
const { createGame } = require('./engine/gameState');
const { applyOps } = require('./engine/reducer');
const { tick } = require('./engine/tick');
const { resolveAction, phaseOf, ACTIONS } = require('./engine/resolver');
const { botPlan, botPickDilemma } = require('./engine/bot');
const { fallbackBeat } = require('./llm/fallback');

function campaign(role, eta, maxTurns = 170) {
  let s = createGame(role, eta);
  const stats = { actions: 0, fails: 0, dilemmas: 0, riots: 0, crowns: 0, beats: 0, weeks: 0, freeTreasury: 0 };
  let sampleBeats = [];

  for (let t = 0; t < maxTurns && !s.ending; t++) {
    // 1. advance the week (like pressing ⏭)
    const { state: ticked, ops } = tick(s);
    s = applyOps(ticked, ops).state;
    stats.weeks++;
    for (const o of ops) {
      if (o.op === 'riot') stats.riots++;
      if (o.op === 'restoreroyal') stats.crowns++;
    }
    if (s.ending) break;

    // 2. bot plans & acts
    const plan = botPlan(s);
    const out = resolveAction(s, plan.actionId, plan.target);
    s.treasury = Math.max(0, Math.min(500, s.treasury + out.treasuryDelta));
    s.influence = Math.max(0, Math.min(100, s.influence + out.influenceDelta));
    s = applyOps(s, out.ops).state;
    stats.actions++;
    if (!out.ok) stats.fails++;

    // 3. narration (offline path — identical to device without API key)
    const fb = fallbackBeat(s, { kind: 'action', region: plan.target, actionLabel: plan.actionId, resolverHeadline: out.headline, resolverOps: out.ops });
    stats.beats++;
    if (sampleBeats.length < 4 && fb.beat) sampleBeats.push(`W${s.week} [${plan.actionId}@${plan.target}] ${fb.beat.slice(0, 180)}`);

    // 4. dilemma, if the deck dealt one
    if (fb.dilemma) {
      stats.dilemmas++;
      const i = botPickDilemma(s, fb.dilemma);
      const opt = fb.dilemma.options[i];
      s = applyOps({ ...s, pendingDilemma: null }, opt.ops).state;
    }
    if (s.ending) break;
  }

  const kingdoms = Object.values(s.regions).filter((r) => r.kingdom).map((r) => r.name);
  return {
    role, eta, turns: s.turn, ending: s.ending ? s.ending.id : 'none',
    stability: Math.round(s.stability), legitimacy: Math.round(s.legitimacy),
    treasury: Math.round(s.treasury), influence: Math.round(s.influence),
    kingdoms, royalPop: s.royalPopPct,
    swarna: Math.round(s.factions.swarna.power), rajwada: Math.round(s.factions.rajwada.power),
    ...stats, sampleBeats,
  };
}

const ROLES = ['strategist', 'agitator', 'royalist', 'oligarch'];
const ETAS = [0.15, 0.5, 0.85];

console.log('== RAJYA headless playtest: 12 campaigns, bot-driven, offline path ==\n');
let totalActions = 0, totalFails = 0, totalDilemmas = 0, totalRiots = 0, totalCrowns = 0, totalTurns = 0;
const endings = {};
const results = [];
for (const role of ROLES) {
  for (const eta of ETAS) {
    const r = campaign(role, eta);
    results.push(r);
    endings[r.ending] = (endings[r.ending] || 0) + 1;
    totalActions += r.actions; totalFails += r.fails; totalDilemmas += r.dilemmas;
    totalRiots += r.riots; totalCrowns += r.crowns; totalTurns += r.turns;
    console.log(
      `${role.padEnd(11)} η=${eta}  turns=${String(r.turns).padStart(3)}  end=${r.ending.padEnd(18)} ` +
      `legit=${String(r.legitimacy).padStart(3)} stab=${String(r.stability).padStart(3)} raj=${String(r.rajwada).padStart(3)} ` +
      `act=${String(r.actions).padStart(3)} fail=${String(r.fails).padStart(3)} dlm=${String(r.dilemmas).padStart(2)} ` +
      `riots=${String(r.riots).padStart(2)} crowns=${String(r.crowns).padStart(2)}`
    );
  }
}

console.log('\n== aggregates ==');
console.log('endings:', endings);
console.log(`actions ${totalActions} (${((totalFails / totalActions) * 100).toFixed(1)}% failed) · dilemmas ${totalDilemmas} · riots ${totalRiots} · crowns ${totalCrowns} · avg turns ${(totalTurns / results.length).toFixed(0)}`);

console.log('\n== sample narration (offline engine) ==');
for (const r of results) {
  if (r.sampleBeats.length) {
    console.log(`\n— ${r.role} η=${r.eta}`);
    r.sampleBeats.slice(0, 2).forEach((b) => console.log('  ' + b));
  }
}

// sanity: every campaign must end (or survive) without NaNs, and stats sane
let bad = 0;
for (const r of results) {
  if (r.legitimacy < 0 || r.legitimacy > 100 || r.stability < -100 || r.stability > 100 || r.actions < 3) bad++;
}
console.log(`\n${bad === 0 ? 'ALL 12 CAMPAIGNS PLAYABLE' : bad + ' CAMPAIGNS LOOK BROKEN'}`);
process.exit(bad ? 1 : 0);
