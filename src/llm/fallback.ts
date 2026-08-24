import { GameState, WorldOp, BeatResult, DialogueLine } from '../types';
import { pick } from '../engine/util';
import { t, tList } from '../i18n';
import { PROTEST_BEATS, RIOT_BEATS, ROYAL_BEATS, ECONOMY_BEATS, SCANDAL_BEATS, CHAOS_BEATS, AMBIENT_LINES, BeatTemplate } from '../data/events';

export function fallbackDialogue(s: GameState, ids: string[]): DialogueLine[] {
  return ids
    .filter((id) => s.characters[id]?.alive)
    .slice(0, 2)
    .map((id) => ({ char: id, line: pick(tList(`fb.${id}`, {}, [t('fb.generic')])) }));
}

const fill = (text: string, s: GameState, region: string) => {
  const rg = s.regions[region] ?? Object.values(s.regions)[0];
  return text.replace(/\{city\}/g, rg.city).replace(/\{region\}/g, rg.name);
};

const vars = (s: GameState, region: string) => {
  const rg = s.regions[region] ?? Object.values(s.regions)[0];
  return { city: rg.city, region: rg.name };
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
        template: ctx.resolverHeadline || t('fb.action.b', { action: ctx.actionLabel ?? '', region: rg.name }),
        ticker: tList('fb.action.k', { action: ctx.actionLabel ?? '', region: rg.name }),
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
        const i = 1 + Math.floor(Math.random() * AMBIENT_LINES.length);
        tpl = {
          key: 'ambient',
          template: fill(t(`amb.${i}`, {}, AMBIENT_LINES[i - 1]), s, ctx.region),
          ticker: tList('amb.k', {}, ['A QUIET WEEK, PROBABLY', 'THE REPUBLIC BREATHES NORMALLY', 'HISTORIANS FILE IT UNDER "ANYWAY"']),
        };
        onStage = ['aarab'];
      }
    }
  }

  return {
    beat: fill(t(`ev.${tpl.key}.b`, {}, tpl.template), s, ctx.region),
    ticker: tList(`ev.${tpl.key}.k`, vars(s, ctx.region), tpl.ticker).map((x) => fill(x, s, ctx.region)),
    dialogue: fallbackDialogue(s, onStage),
    ops: [],
    source: 'fallback',
  };
}
