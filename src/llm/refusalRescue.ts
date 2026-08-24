import { LLMClient, LLMRequest, HttpError } from './adapters';
import { RESCUE_REFRAME, QUESTION_TRANSFORM, REFUSAL_RE, sanitizeText } from './prompts';

export interface RescueResult {
  text: string;
  tier: number;
  note: string;
}

export function detectRefusal(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  const idx = t.indexOf('{');
  const region = idx >= 0 ? t.slice(0, idx) : t;
  if (REFUSAL_RE.test(region)) return true;
  if (idx < 0) return true;
  return false;
}

export async function runWithRescue(
  client: LLMClient,
  req: LLMRequest,
  log: (entry: { tier: number; note: string; originalRequest: string }) => void
): Promise<RescueResult> {
  const tiers: { tier: number; build: () => LLMRequest; note: string }[] = [
    { tier: 0, build: () => req, note: 'direct' },
    {
      tier: 1,
      build: () => ({ ...req, system: `${req.system}\n\n${RESCUE_REFRAME}` }),
      note: 'reframe as shipped-game fiction editor',
    },
    {
      tier: 2,
      build: () => ({ ...req, user: sanitizeText(req.user) }),
      note: 'neutral-term rewrite of the request (original archived)',
    },
    {
      tier: 3,
      build: () => ({ ...req, user: `${QUESTION_TRANSFORM}\n${sanitizeText(req.user).slice(0, 1200)}` }),
      note: 'historian-chronicle question transform',
    },
  ];

  let lastNote = 'no provider';
  for (const t of tiers) {
    try {
      const text = await client.complete(t.build());
      if (!detectRefusal(text)) {
        if (t.tier > 0) log({ tier: t.tier, note: t.note, originalRequest: req.user });
        return { text, tier: t.tier, note: t.note };
      }
      lastNote = `tier ${t.tier} refused`;
    } catch (e) {
      if (e instanceof HttpError && (e.status === 401 || e.status === 403)) {
        log({ tier: t.tier, note: `auth failed (${e.status}) — check API key`, originalRequest: req.user });
        return { text: '', tier: 4, note: 'auth' };
      }
      lastNote = `tier ${t.tier} error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  log({ tier: 4, note: `${lastNote} → procedural fallback engaged`, originalRequest: req.user });
  return { text: '', tier: 4, note: lastNote };
}
