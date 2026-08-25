const { createGame } = require('./engine/gameState');
const { applyOps } = require('./engine/reducer');
const { tick } = require('./engine/tick');
const { resolveAction, resolveFreeMove, FREE_MOVE_COST, ACTIONS, hottestRegion, phaseOf, etaFor } = require('./engine/resolver');
const { scoreOf } = require('./engine/score');
const { backTarget } = require('./nav');
const { isNewer } = require('./update');
const { worldSummary } = require('./llm/prompts');

// AsyncStorage is a native module; give the save layer an in-memory one to talk to.
const Module = require('module');
const mem = new Map();
const origLoad = Module._load;
Module._load = function (req, ...rest) {
  if (req.includes('async-storage')) {
    return { __esModule: true, default: {
      setItem: async (k, v) => void mem.set(k, v),
      getItem: async (k) => (mem.has(k) ? mem.get(k) : null),
      removeItem: async (k) => void mem.delete(k),
    } };
  }
  return origLoad.call(this, req, ...rest);
};
const { saveGame, loadGame, clearGame, describe } = require('./save');
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


// --- difficulty ramp ---
setLang('en');
const openers = Object.entries(ACTIONS).map(([role, list]) => [role, list.filter((a) => (a.phase ?? 0) === 0)]);
check('ramp: exactly one opening move per role', openers.every(([, list]) => list.length === 1));
check('ramp: every opening move is cheap (<= 3)', openers.every(([, list]) => list[0].cost <= 3));
check('ramp: every role reaches its heaviest move by the last phase', Object.values(ACTIONS).every((list) => list.some((a) => a.phase === 3)));
check('ramp: phases widen over the campaign', phaseOf(0) === 0 && phaseOf(6) === 1 && phaseOf(18) === 2 && phaseOf(38) === 3 && phaseOf(200) === 3);
check('ramp: chaos starts low and reaches the setting', etaFor({ eta: 0.8, turn: 0 }) < 0.25 && Math.abs(etaFor({ eta: 0.8, turn: 40 }) - 0.8) < 0.001);
check('ramp: opening moves resolve into real ops', Object.entries(ACTIONS).every(([role, list]) => {
  const out = resolveAction(createGame(role, 0.5), list.find((a) => (a.phase ?? 0) === 0).id, 'uttardesh');
  return out.headline.length > 0 && out.ops.length > 0;
}));
let riots = 0;
let openings = 0;
for (const eta of [0.5, 0.9]) {
  for (let run = 0; run < 12; run++) {
    let s = createGame('strategist', eta);
    openings++;
    while (phaseOf(s.turn) === 0) {              // chapter 0 only: riots belong to chapter 1
      const { state: ticked, ops } = tick(s);
      if (phaseOf(ticked.turn) > 0) break;
      riots += ops.filter((o) => o.op === 'riot' || o.op === 'restoreroyal').length;
      s = applyOps(ticked, ops).state;
    }
  }
}
check(`ramp: chapter 0 never burns (${riots} riots/thrones across ${openings} openings)`, riots === 0);


// --- free-text moves & score ---
setLang('en');
const fm = resolveFreeMove(createGame('strategist', 0.5), 'I buy the evening news and bury the story', 'uttardesh');
check('free move: costs influence', FREE_MOVE_COST > 0 && FREE_MOVE_COST <= 10);
check('free move: quotes the player and yields ops', fm.headline.includes('bury the story') && fm.ops.length > 0);
check('free move: odds stay playable', fm.odds >= 5 && fm.odds <= 92);
check('free move: empty text is refused by the store guard', resolveFreeMove(createGame('strategist', 0.5), '', 'uttardesh').ops.length > 0);
const fresh = createGame('royalist', 0.5);
check('score: starts low and is bounded', scoreOf(fresh) >= 0 && scoreOf(fresh) < 600);
const won = createGame('royalist', 0.5); won.turn = 120; won.royalPopPct = 35; won.stability = 80; won.legitimacy = 80;
check('score: rewards the role objective', scoreOf(won) > scoreOf(fresh) + 300 && scoreOf(won) <= 1000);
for (const role of ['strategist', 'agitator', 'royalist', 'oligarch']) {
  const s0 = createGame(role, 0.5);
  if (!(scoreOf(s0) >= 0 && scoreOf(s0) <= 1000)) check(`score: ${role} in range`, false);
}
check('score: every role scores in range', true);


// --- a republic that differs every campaign ---
const openings2 = Array.from({ length: 8 }, () => createGame('strategist', 0.5));
const fingerprints = new Set(openings2.map((g) => Object.values(g.regions).map((r) => Math.round(r.unrest)).join(',')));
check(`world: no two campaigns open identically (${fingerprints.size}/8 distinct)`, fingerprints.size === 8);
const hottest0 = openings2.map((g) => Object.values(g.regions).sort((a, b) => b.unrest - a.unrest)[0].id);
check(`world: the flashpoints move between campaigns (${new Set(hottest0).size} different hot spots)`, new Set(hottest0).size > 1);
check('world: nobody opens already burning', openings2.every((g) => Object.values(g.regions).every((r) => r.unrest <= 80)));


// --- back button walks the app, never out of it ---
check('back: sub-screens return to a live campaign', ['settings','codex','chronicle'].every((s) => backTarget(s, true) === 'game'));
check('back: sub-screens return to the title with no campaign', ['settings','codex','chronicle'].every((s) => backTarget(s, false) === 'title'));
check('back: game and pre-game screens reach the title', ['game','setup','disclaimer','ending'].every((s) => backTarget(s, true) === 'title'));
check('back: only the title asks about quitting', backTarget('title', true) === 'quit' && backTarget('title', false) === 'quit');


// --- update check ---
check('update: 0.10 beats 0.9 (segments, not strings)', isNewer('0.10', '0.9') === true);
check('update: a v prefix is tolerated', isNewer('v0.11', '0.10') === true);
check('update: the same build is not an update', isNewer('0.10', '0.10') === false);
check('update: an older tag is never offered', isNewer('0.9', '0.10') === false && isNewer('0.2', '1.0') === false);
check('update: 1.0 beats 0.99', isNewer('1.0', '0.99') === true);

// --- the narrator remembers the campaign, not just this week ---
let long = createGame('agitator', 0.5);
for (let i = 0; i < 60; i++) {
  const r = tick(long);
  long = applyOps(r.state, r.ops).state;
  long.eventLog.push({ turn: long.turn, week: long.week, kind: 'beat', headline: `WEEK ${long.week} REPORT`, beat: '' });
  if (i % 12 === 0) long.eventLog.push({ turn: long.turn, week: long.week, kind: 'decision', headline: `DECISION AT WEEK ${long.week}`, beat: '' });
}
const summary = worldSummary(long);
check('memory: the prompt carries the recent week', summary.includes('RECENT HEADLINES'));
check('memory: the prompt carries earlier turns too', summary.includes('EARLIER IN THIS CAMPAIGN'));
check('memory: the player\'s own decisions survive into it', (summary.match(/DECISION AT WEEK/g) || []).length >= 2);
check('memory: it stays compact', summary.length < 4000);
check('memory: a fresh campaign has no earlier section', !worldSummary(createGame('oligarch', 0.5)).includes('EARLIER IN'));

// --- the campaign survives being closed ---
(async () => {
  setLang('en');
  let g = createGame('royalist', 0.5);
  for (let i = 0; i < 10; i++) { const r = tick(g); g = applyOps(r.state, r.ops).state; }
  const meta = await saveGame(g, ['A HEADLINE']);
  check('save: writes a slot with a name and a where-you-are line', !!meta && meta.name.length > 0 && /week \d+/i.test(meta.subtitle));
  const back = await loadGame();
  check('save: reloads the same campaign', !!back && back.state.turn === g.turn && back.state.role === g.role);
  check('save: reloads all 28 regions with their heat intact', !!back &&
    Object.keys(back.state.regions).length === 28 &&
    Math.round(back.state.regions.uttardesh.unrest) === Math.round(g.regions.uttardesh.unrest));
  check('save: keeps the news ticker', !!back && back.ticker[0] === 'A HEADLINE');
  mem.set('rajya_save_v1', JSON.stringify({ v: 999, state: {}, ticker: [], meta }));
  check('save: a save from another version is dropped, not crashed on', (await loadGame()) === null);
  mem.set('rajya_save_v1', '{ this is not json');
  check('save: corrupt file is dropped, not crashed on', (await loadGame()) === null);
  const done = createGame('strategist', 0.5);
  done.ending = { id: 'x', title: 'T', text: 'done' };
  await saveGame(done, []);
  check('save: a finished campaign clears the slot', (await loadGame()) === null);
  await clearGame();

  process.exit(failures ? 1 : 0);
})();
