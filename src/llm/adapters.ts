import { LLMSettings } from '../types';

export interface LLMRequest {
  system: string;
  user: string;
  maxTokens?: number;
}

export interface LLMClient {
  name: string;
  complete(req: LLMRequest): Promise<string>;
}

const DEFAULT_MAX = 1200;
const IS_WEB = typeof globalThis !== 'undefined' && 'window' in globalThis && 'document' in globalThis;
const RELAY = 'https://lovegrover.com/api/llm';

export class HttpError extends Error {
  status: number;
  constructor(status: number, body: string) {
    super(`HTTP ${status}: ${body.slice(0, 300)}`);
    this.status = status;
  }
}

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Gemini and Anthropic don't send CORS headers, so browsers block direct calls.
// On web we forward through lovegrover.com/api/llm (host-whitelisted, keys
// never stored server-side); native apps call the APIs directly.
async function post(url: string, headers: Record<string, string>, bodyObj: unknown): Promise<Response> {
  if (!IS_WEB) {
    return fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(bodyObj) });
  }
  return fetch(RELAY, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url, headers, body: bodyObj }),
  });
}

export function claudeClient(settings: LLMSettings, model: string): LLMClient {
  return {
    name: `claude:${model}`,
    async complete(req: LLMRequest) {
      const res = await post(
        'https://api.anthropic.com/v1/messages',
        {
          'x-api-key': settings.anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        {
          model,
          max_tokens: req.maxTokens ?? DEFAULT_MAX,
          system: req.system,
          messages: [{ role: 'user', content: req.user }],
        }
      );
      if (!res.ok) throw new HttpError(res.status, await res.text());
      const data = (await res.json()) as { content?: { type: string; text?: string }[] };
      return (data.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('');
    },
  };
}

export function compatClient(baseUrl: string, key: string, model: string): LLMClient {
  const base = baseUrl.replace(/\/+$/, '');
  const isAzure = base.includes('openai.azure.com');
  const url = isAzure
    ? `${base}/openai/deployments/${model}/chat/completions?api-version=2024-10-21`
    : `${base}/chat/completions`;
  const headers = (k: string): Record<string, string> =>
    isAzure
      ? { 'content-type': 'application/json', 'api-key': k }
      : { 'content-type': 'application/json', authorization: `Bearer ${k}` };
  const body = (req: LLMRequest) =>
    JSON.stringify({
      model,
      max_tokens: req.maxTokens ?? DEFAULT_MAX,
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user },
      ],
    });
  return {
    name: isAzure ? `azure:${model}` : `compat:${model}`,
    async complete(req: LLMRequest) {
      const res = await fetch(url, { method: 'POST', headers: headers(key), body: body(req) });
      if (!res.ok) {
        if (res.status === 429) {
          await wait(1800);
          const retry = await fetch(url, { method: 'POST', headers: headers(key), body: body(req) });
          if (!retry.ok) throw new HttpError(retry.status, await retry.text());
          const d = (await retry.json()) as { choices?: { message?: { content?: string } }[] };
          return d.choices?.[0]?.message?.content ?? '';
        }
        throw new HttpError(res.status, await res.text());
      }
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      return data.choices?.[0]?.message?.content ?? '';
    },
  };
}

export async function testConnection(settings: LLMSettings): Promise<{ ok: boolean; detail: string }> {
  const client = mainClient(settings);
  if (!client) return { ok: false, detail: 'No provider/key configured — pick a provider and enter a key first.' };
  try {
    const t = await client.complete({ system: 'You are a connectivity test.', user: 'Reply with the single word OK.', maxTokens: 10 });
    const trimmed = t.trim();
    if (trimmed) return { ok: true, detail: `${client.name} replied: ${trimmed.slice(0, 40)}` };
    return { ok: false, detail: `${client.name} connected but returned an empty reply.` };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message.slice(0, 160) : String(e) };
  }
}

export function geminiClient(settings: LLMSettings, model: string): LLMClient {
  const base = 'https://generativelanguage.googleapis.com/v1beta';
  const call = async (req: LLMRequest) => {
    const res = await post(
      `${base}/models/${model}:generateContent?key=${encodeURIComponent(settings.geminiKey)}`,
      { 'x-goog-api-key': settings.geminiKey },
      {
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: 'user', parts: [{ text: req.user }] }],
        generationConfig: { maxOutputTokens: req.maxTokens ?? DEFAULT_MAX, temperature: 1 },
      }
    );
    if (!res.ok) throw new HttpError(res.status, await res.text());
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
  };
  return {
    name: `gemini:${model}`,
    async complete(req: LLMRequest) {
      try {
        return await call(req);
      } catch (e) {
        if (e instanceof HttpError && e.status === 429) {
          await wait(1800);
          return call(req);
        }
        throw e;
      }
    },
  };
}

export function mainClient(settings: LLMSettings): LLMClient | null {
  if (settings.provider === 'anthropic' && settings.anthropicKey) return claudeClient(settings, settings.anthropicModel || 'claude-sonnet-5');
  if (settings.provider === 'gemini' && settings.geminiKey) return geminiClient(settings, settings.geminiModel || 'gemini-2.5-flash');
  if (settings.provider === 'openai-compat' && settings.compatBaseUrl) {
    const model = settings.compatModel || 'gpt-4o-mini';
    return compatClient(settings.compatBaseUrl, settings.compatKey || 'none', model);
  }
  return null;
}

export const hasAI = (settings: LLMSettings): boolean => !!mainClient(settings);

export function flashClient(settings: LLMSettings): LLMClient | null {
  if (settings.provider === 'anthropic' && settings.anthropicKey) {
    const m = settings.flashModel || settings.anthropicModel || 'claude-haiku-4-5';
    return m ? claudeClient(settings, m) : null;
  }
  if (settings.provider === 'gemini' && settings.geminiKey) {
    return geminiClient(settings, settings.flashModel || settings.geminiModel || 'gemini-2.5-flash-lite');
  }
  if (settings.provider === 'openai-compat' && settings.compatBaseUrl) {
    const m = settings.flashModel || settings.compatModel2 || settings.compatModel || 'gpt-4o-mini';
    return compatClient(settings.compatBaseUrl, settings.compatKey2 || settings.compatKey || 'none', m);
  }
  return null;
}
