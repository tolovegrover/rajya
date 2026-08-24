import { GameState, LLMSettings, WorldOp, BeatResult, Dilemma, DialogueLine } from '../types';
import { GM_SYSTEM, worldSummary, stageBlock } from './prompts';
import { mainClient, flashClient, LLMClient, LLMRequest } from './adapters';
import { runWithRescue } from './refusalRescue';
import { fallbackBeat } from './fallback';
import { CHARACTERS } from '../data/characters';

export interface GMContext {
  kind: 'action' | 'ambient' | 'riot' | 'royal' | 'election' | 'chaos';
  region: string;
  actionLabel?: string;
  resolverHeadline?: string;
  resolverOps: WorldOp[];
}

const OP_KINDS = new Set([
  'unrest', 'loyalty', 'royalist', 'separatist', 'reservationHeat', 'landHeat',
  'factionPower', 'treasury', 'legitimacy', 'curfew', 'riot', 'protest',
  'armyMove', 'restoreroyal', 'election', 'character', 'headline',
]);

const charIds = CHARACTERS.map((c) => c.id);
const charNames = new Map(CHARACTERS.map((c) => [c.name.toLowerCase(), c.id]));

export function extractJson(text: string): unknown {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  if (start < 0) throw new Error('no JSON object found');
  let depth = 0;
  for (let i = start; i < t.length; i++) {
    if (t[i] === '{') depth++;
    else if (t[i] === '}') {
      depth--;
      if (depth === 0) {
        let raw = t.slice(start, i + 1)
          .replace(/[\u201c\u201d]/g, '"')
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/:\s*NaN/g, ': 0')
          .replace(/:\s*undefined/g, ': 0');
        try {
          return JSON.parse(raw);
        } catch {
          try {
            return JSON.parse(raw.replace(/'/g, '"'));
          } catch {
            throw new Error('JSON parse failed');
          }
        }
      }
    }
  }
  throw new Error('unbalanced JSON');
}

function normalizeOps(raw: unknown): WorldOp[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object' && typeof o.op === 'string' && OP_KINDS.has(o.op))
    .slice(0, 5) as WorldOp[];
}

function normalizeDialogue(raw: unknown, s: GameState): DialogueLine[] {
  if (!Array.isArray(raw)) return [];
  const out: DialogueLine[] = [];
  for (const d of raw) {
    if (!d || typeof d !== 'object') continue;
    const rawId = String((d as Record<string, unknown>).char ?? '').trim().toLowerCase();
    const line = String((d as Record<string, unknown>).line ?? '').trim();
    const id = charIds.includes(rawId) ? rawId : charNames.get(rawId) ?? charIds.find((c) => rawId.includes(c)) ?? null;
    if (id && line && s.characters[id]?.alive) out.push({ char: id, line: line.slice(0, 220) });
    if (out.length >= 2) break;
  }
  return out;
}

function normalizeDilemma(raw: unknown): Dilemma | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const d = raw as Record<string, unknown>;
  const text = String(d.text ?? '').trim();
  const options = Array.isArray(d.options)
    ? d.options
        .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object' && typeof o.label === 'string')
        .map((o) => ({ label: String(o.label).slice(0, 80), ops: normalizeOps(o.ops) }))
    : [];
  if (!text || options.length < 2) return undefined;
  return { text, options: options.slice(0, 3) };
}

export async function askGameMaster(
  s: GameState,
  settings: LLMSettings,
  ctx: GMContext,
  onRescue: (entry: { tier: number; note: string; originalRequest: string }) => void
): Promise<BeatResult> {
  const fb = fallbackBeat(s, ctx);
  const useFlash = ctx.kind !== 'action';
  const client: LLMClient | null = (useFlash ? flashClient(settings) : null) ?? mainClient(settings);
  if (!client) return fb;

  const rg = s.regions[ctx.region] ?? Object.values(s.regions)[0];
  const stage =
    ctx.kind === 'action'
      ? s.role === 'agitator'
        ? ['devraj', 'ramrao', 'moni']
        : s.role === 'royalist'
          ? ['vikram', 'bikash', 'amir']
          : ['moni', 'amir', 'rudra']
      : ctx.kind === 'riot'
        ? ['amir', 'rudra', 'maulana']
        : ctx.kind === 'royal'
          ? ['vikram', 'moni', 'jogi']
          : ['aarab', 'moni'];

  const system = [
    GM_SYSTEM(s.eta, settings.gmDirective, settings.language),
    '',
    'PERSONAS ON STAGE (write their dialogue in this voice):',
    stageBlock(settings, stage),
    settings.gmDirective ? `\nGAME MASTER DIRECTIVE FROM THE PLAYER: ${settings.gmDirective}` : '',
  ].join('\n');

  const eventText =
    ctx.kind === 'action'
      ? `PLAYER ACTION (${s.role}): "${ctx.actionLabel}" targeting ${rg.name} (${rg.id}). Resolver verdict: ${ctx.resolverHeadline ?? ''}`
      : `EVENT KIND: ${ctx.kind} in ${rg.name} (${rg.id}).`;

  const user = `WORLD:\n${worldSummary(s)}\n\nEVENT:\n${eventText}\n\nRESOLVER OUTCOME (immutable, already computed):\n${JSON.stringify(ctx.resolverOps.slice(0, 6))}\n\nNarrate this beat and add your twist ops. JSON only.`;

  const req: LLMRequest = { system, user, maxTokens: ctx.kind === 'action' ? 1400 : 900 };

  const res = await runWithRescue(client, req, onRescue);
  if (res.tier === 4 || !res.text) {
    return { ...fb, source: 'fallback', rescueTier: 4 };
  }

  try {
    const parsed = extractJson(res.text) as Record<string, unknown>;
    const beat = String(parsed.beat ?? '').trim() || fb.beat;
    const ticker = Array.isArray(parsed.ticker)
      ? parsed.ticker.map((t) => String(t).slice(0, 90)).slice(0, 4)
      : [];
    while (ticker.length < 1) ticker.push(fb.ticker[0]);
    const gmOps = normalizeOps(parsed.ops);
    return {
      beat,
      ticker,
      dialogue: normalizeDialogue(parsed.dialogue, s),
      ops: gmOps,
      dilemma: normalizeDilemma(parsed.dilemma),
      source: res.tier > 0 ? 'rescue' : 'llm',
      rescueTier: res.tier,
    };
  } catch {
    onRescue({ tier: 4, note: 'unparseable GM JSON → procedural fallback engaged (game continues)', originalRequest: user });
    return { ...fb, source: 'fallback', rescueTier: 4 };
  }
}
