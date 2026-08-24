import { GameState, WorldOp, BeatResult, DialogueLine } from '../types';
import { pick } from '../engine/util';
import { PROTEST_BEATS, RIOT_BEATS, ROYAL_BEATS, ECONOMY_BEATS, SCANDAL_BEATS, CHAOS_BEATS, AMBIENT_LINES, BeatTemplate } from '../data/events';

const FALLBACK_LINES: Record<string, string[]> = {
  moni: ['The nation\'s patience is being tested — and the nation always passes.', 'Development is our devotion, friends.'],
  amir: ['We have the files. We always have the files.', 'Options exist. Patience also exists.'],
  raul: ['This government fears questions — so I ask louder.', 'Democracy is not a family business. Anybody\'s family.'],
  devraj: ['Merit is not a privilege. It is a promise.', 'We will fast, not fire.'],
  ramrao: ['The ladder of justice is not a favour to be withdrawn.', 'Read the Constitution. Slowly, if needed.'],
  thikait: ['The land is not for sale. It is for keeping.', 'Talk to the soil, not the suits.'],
  vikram: ['The Republic was a lovely experiment. Experiments end.', 'The throne needs no election; it needs patience.'],
  moomta: ['Delhi sends agencies; the people send me back.', 'I will sit on the road before I bow to an order.'],
  kerji: ['One more dharna never hurt a democracy.', 'Honesty needs no majority.'],
  jogi: ['Order is the first puja.', 'The bulldozer knows no caste and no calendar.'],
  bikash: ['I ally with arithmetic, nothing else.', 'Cycles teach balance; so do coalitions.'],
  kalai: ['Federalism is not a favour from Delhi; it is the architecture.', 'We pay; we count.'],
  maulana: ['Patience is also a form of courage.', 'Tea first. Trouble later.'],
  aarab: ['THE NATION WANTS TO KNOW!', 'Debate is war with better lighting!'],
  rudra: ['Troops are not tokens of last resort.', 'I serve the Constitution. While it lasts.'],
};

export function fallbackDialogue(s: GameState, ids: string[]): DialogueLine[] {
  return ids
    .filter((id) => s.characters[id]?.alive)
    .slice(0, 2)
    .map((id) => ({ char: id, line: pick(FALLBACK_LINES[id] ?? ['The republic endures. Barely.']) }));
}

const fill = (t: string, s: GameState, region: string) => {
  const rg = s.regions[region] ?? Object.values(s.regions)[0];
  return t.replace(/\{city\}/g, rg.city).replace(/\{region\}/g, rg.name);
};

export function fallbackBeat(
  s: GameState,
  ctx: { kind: 'action' | 'ambient' | 'riot' | 'royal' | 'election' | 'chaos'; region: string; actionLabel?: string; resolverHeadline?: string; resolverOps: WorldOp[] }
): BeatResult {
  const rg = s.regions[ctx.region] ?? Object.values(s.regions)[0];
  let tpl: BeatTemplate;
  let onStage: string[] = ['moni', 'amir'];

  switch (ctx.kind) {
    case 'action':
      tpl = {
        key: 'action',
        template: ctx.resolverHeadline || `${ctx.actionLabel ?? 'The move'} reshaped ${rg.name} this week.`,
        ticker: [`${(ctx.actionLabel ?? 'MOVE').toUpperCase()} HITS ${rg.name.toUpperCase()}`, 'ENGINE LOGS THE CONSEQUENCES', 'THE MAP ADJUSTS ITS POSTURE'],
      };
      onStage = s.role === 'agitator' ? ['devraj', 'ramrao'] : s.role === 'royalist' ? ['vikram', 'bikash'] : ['moni', 'amir'];
      break;
    case 'riot':
      tpl = pick(RIOT_BEATS);
      onStage = ['amir', 'rudra'];
      break;
    case 'royal':
      tpl = pick(ROYAL_BEATS);
      onStage = ['vikram', 'moni'];
      break;
    case 'election':
      tpl = pick(SCANDAL_BEATS);
      onStage = ['raul', 'bikash'];
      break;
    case 'chaos':
      tpl = pick(CHAOS_BEATS);
      onStage = ['aarab', 'bikash'];
      break;
    default: {
      if (rg.reservationHeat > 62) {
        tpl = pick(PROTEST_BEATS.filter((b) => !b.movements || b.movements.includes('swarna')));
        onStage = ['devraj', 'ramrao'];
      } else if (rg.landHeat > 62) {
        tpl = pick(PROTEST_BEATS.filter((b) => b.movements?.includes('kisan')));
        onStage = ['thikait', 'amir'];
      } else if (rg.unrest > 60) {
        tpl = pick(RIOT_BEATS);
        onStage = ['amir', 'rudra'];
      } else if (rg.royalist > 55) {
        tpl = pick(ROYAL_BEATS);
        onStage = ['vikram'];
      } else {
        tpl = { key: 'ambient', template: fill(pick(AMBIENT_LINES), s, ctx.region), ticker: ['A QUIET WEEK, PROBABLY', 'THE REPUBLIC BREATHES NORMALLY', 'HISTORIANS FILE IT UNDER "ANYWAY"'] };
        onStage = ['aarab'];
      }
    }
  }

  return {
    beat: fill(tpl.template, s, ctx.region),
    ticker: tpl.ticker.map((t) => fill(t, s, ctx.region)),
    dialogue: fallbackDialogue(s, onStage),
    ops: [],
    source: 'fallback',
  };
}
