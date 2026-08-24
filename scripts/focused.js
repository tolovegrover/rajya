const { createGame } = require('./engine/gameState');
const { applyOps } = require('./engine/reducer');
const { tick } = require('./engine/tick');
const { resolveAction } = require('./engine/resolver');

function focused(role, acts, target, eta, maxTurns) {
  let s = createGame(role, eta);
  let i = 0;
  for (let t = 0; t < maxTurns && !s.ending; t++) {
    const { state: ticked, ops } = tick(s);
    s = applyOps(ticked, ops).state;
    const out = resolveAction(s, acts[i % acts.length], target);
    s.treasury = Math.max(0, s.treasury + out.treasuryDelta);
    s.influence = Math.max(0, Math.min(100, s.influence + out.influenceDelta));
    s = applyOps(s, out.ops).state;
    i++;
  }
  const k = Object.values(s.regions).filter((r) => r.kingdom).map((r) => r.name);
  console.log(`${role} η=${eta} [${acts.join('+')}] → turn ${s.turn} ending=${s.ending?.id ?? 'none'} legit=${Math.round(s.legitimacy)} rajwadaPower=${Math.round(s.factions.rajwada.power)} kingdoms=[${k.join(', ')}] royalPop%=${s.royalPopPct}`);
}

focused('royalist', ['rumor', 'court', 'rumor', 'court'], 'rajputana', 0.1, 120);
focused('royalist', ['rumor', 'court', 'rumor', 'buymla'], 'rajputana', 0.5, 120);
focused('royalist', ['rumor', 'court', 'heritage', 'buymla'], 'magadh', 0.9, 120);
focused('agitator', ['rally', 'rally', 'blitz', 'fast'], 'uttardesh', 0.5, 120);
focused('agitator', ['rally', 'march', 'rally', 'fast'], 'indraprastha', 0.9, 120);
focused('strategist', ['speech', 'welfare', 'negotiate', 'speech'], 'uttardesh', 0.9, 120);
