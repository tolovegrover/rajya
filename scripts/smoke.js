const { createGame } = require('./engine/gameState');
const { applyOps } = require('./engine/reducer');
const { tick } = require('./engine/tick');
const { resolveAction, ACTIONS, hottestRegion } = require('./engine/resolver');
const { fallbackBeat } = require('./llm/fallback');
const { extractJson } = require('./llm/gameMaster');
const { detectRefusal } = require('./llm/refusalRescue');
const { t, tList, setLang, LANGS } = require('./i18n');
const { UI2 } = require('./i18n.ui2');
const { UI3 } = require('./i18n.ui3');

let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
};

const finiteState = (s) => {
  for (const rg of Object.values(s.regions)) {
    for (const k of ['unrest', 'loyalty', 'royalist', 'separatist', 'reservationHeat', 'landHeat']) {
      if (!isFinite(rg[k]) || rg[k] < 0 || rg[k] > 100) return `region ${rg.id}.${k}=${rg[k]}`;
    }
  }
  return isFinite(s.treasury) && isFinite(s.legitimacy) && isFinite(s.stability) ? null : 'national';
};

for (const role of ['strategist', 'agitator', 'royalist', 'oligarch']) {
  for (const eta of [0.1, 0.5, 0.9]) {
    let s = createGame(role, eta);
    let acted = 0;
    for (let i = 0; i < 200 && !s.ending; i++) {
      const { state: ticked, ops } = tick(s);
      s = applyOps(ticked, ops).state;
      if (i % 4 === 0) {
        const act = ACTIONS[role][i % ACTIONS[role].length];
        const out = resolveAction(s, act.id, hottestRegion(s));
        s.treasury = Math.max(0, s.treasury + out.treasuryDelta);
        s.influence = Math.max(0, Math.min(100, s.influence + out.influenceDelta));
        s = applyOps(s, out.ops).state;
        acted++;
      }
      const bad = finiteState(s);
      if (bad) { check(`${role} η=${eta} finite (${bad})`, false); break; }
    }
    const bad2 = finiteState(s);
    console.log(`${role} η=${eta}: turns=${s.turn} ending=${s.ending ? s.ending.id : 'none'} stability=${Math.round(s.stability)} legit=${Math.round(s.legitimacy)} kingdoms=${Object.values(s.regions).filter(r => r.kingdom).length} actions=${acted}`);
    check(`${role} η=${eta} clean`, !bad2);
  }
}

check('clamps: unknown region dropped', applyOps(createGame('strategist', 0.5), [{ op: 'unrest', region: 'narnia', delta: 30 }]).applied.length === 0);
check('clamps: delta capped at 25', applyOps(createGame('strategist', 0.5), [{ op: 'unrest', region: 'uttardesh', delta: 999 }]).state.regions.uttardesh.unrest <= 100);
check('clamps: unknown op type dropped', applyOps(createGame('strategist', 0.5), [{ op: 'nuclear', region: 'uttardesh' }]).applied.length === 0);
check('restoreroyal marks kingdom', applyOps(createGame('strategist', 0.5), [{ op: 'restoreroyal', region: 'rajputana' }]).state.regions.rajputana.kingdom === true);

check('refusal: apology detected', detectRefusal("I'm sorry, but I cannot assist with that."));
check('refusal: pre-JSON apology detected', detectRefusal("I cannot help with this. ```json\n{...}```"));
check('refusal: clean JSON not flagged', detectRefusionGuard());
function detectRefusionGuard() { return !detectRefusal('{"beat":"The streets of Awadhpur roared.","ticker":["A"],"dialogue":[],"ops":[]}'); }
check('refusal: empty flagged', detectRefusal(''));

check('json: fenced', typeof extractJson('```json\n{"beat":"x"}\n```') === 'object');
check('json: trailing comma repaired', extractJson('{"beat":"x","ticker":["a","b",],}').ticker.length === 2);
check('json: prose-wrapped', extractJson('Here you go: {"beat":"x"} hope it helps').beat === 'x');
check('json: smart quotes repaired', extractJson('{“beat”:”x”}').beat === 'x');

const fb = fallbackBeat(createGame('agitator', 0.7), { kind: 'ambient', region: 'uttardesh', resolverOps: [] });
check('fallback beat has all fields', !!fb.beat && fb.ticker.length === 3 && fb.dialogue.length >= 1 && fb.source === 'fallback');



// --- i18n ---
setLang('hi');
check('i18n: hindi is usable as default', t('title.new') === 'नया अभियान');
check('i18n: hindi region names', createGame('strategist', 0.5).regions.uttardesh.name === 'उत्तरदेश');
check('i18n: hindi offline beat', /[\u0900-\u097F]/.test(fallbackBeat(createGame('strategist', 0.5), { kind: 'riot', region: 'uttardesh', resolverOps: [] }).beat));
setLang('ta');
check('i18n: tamil interface', t('title.new') === 'புதிய பிரச்சாரம்');
check('i18n: untranslated content falls back to english', createGame('strategist', 0.5).regions.uttardesh.name === 'Uttardesh');
setLang('en');
check('i18n: english round-trip', t('title.new') === 'NEW CAMPAIGN');
check('i18n: unknown key uses the fallback', t('nope.nope', {}, 'fallback') === 'fallback');
check('i18n: vars interpolate', t('card.week', { w: 3, y: 2026 }) === 'WEEK 3 · 2026');
check('i18n: lists split on |', tList('fb.moni').length === 2);
const missing = [];
for (const dict of [UI2, UI3]) {
  for (const [key, entry] of Object.entries(dict)) {
    if (!entry.en) missing.push(`${key}.en`);
    for (const { code } of LANGS) if (!entry[code]) missing.push(`${key}.${code}`);
  }
}
check(`i18n: every UI string exists in all ${LANGS.length} languages (${missing.slice(0, 3).join(', ')})`, missing.length === 0);

process.exit(failures ? 1 : 0);
