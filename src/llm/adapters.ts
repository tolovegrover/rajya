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

export class HttpError extends Error {
  status: number;
  constructor(status: number, body: string) {
    super(`HTTP ${status}: ${body.slice(0, 300)}`);
    this.status = status;
  }
}

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function claudeClient(settings: LLMSettings, model: string): LLMClient {
  return {
    name: `claude:${model}`,
    async complete(req: LLMRequest) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': settings.anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: req.maxTokens ?? DEFAULT_MAX,
          system: req.system,
          messages: [{ role: 'user', content: req.user }],
        }),
      });
      if (!res.ok) throw new HttpError(res.status, await res.text());
      const data = (await res.json()) as { content?: { type: string; text?: string }[] };
      return (data.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('');
    },
  };
}

export function compatClient(baseUrl: string, key: string, model: string): LLMClient {
  const url = baseUrl.replace(/\/+$/, '') + '/chat/completions';
  return {
    name: `compat:${model}`,
    async complete(req: LLMRequest) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: req.maxTokens ?? DEFAULT_MAX,
          messages: [
            { role: 'system', content: req.system },
            { role: 'user', content: req.user },
          ],
        }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          await wait(1800);
          const retry = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
            body: JSON.stringify({
              model,
              max_tokens: req.maxTokens ?? DEFAULT_MAX,
              messages: [
                { role: 'system', content: req.system },
                { role: 'user', content: req.user },
              ],
            }),
          });
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

export function mainClient(settings: LLMSettings): LLMClient | null {
  if (settings.provider === 'anthropic' && settings.anthropicKey) return claudeClient(settings, settings.anthropicModel || 'claude-sonnet-4-5');
  if (settings.provider === 'openai-compat' && settings.compatBaseUrl) {
    const model = settings.compatModel || 'gpt-4o-mini';
    return compatClient(settings.compatBaseUrl, settings.compatKey || 'none', model);
  }
  return null;
}

export function flashClient(settings: LLMSettings): LLMClient | null {
  if (settings.provider === 'anthropic' && settings.anthropicKey) {
    const m = settings.flashModel || settings.anthropicModel || 'claude-haiku-4-5';
    return m ? claudeClient(settings, m) : null;
  }
  if (settings.provider === 'openai-compat' && settings.compatBaseUrl) {
    const m = settings.flashModel || settings.compatModel2 || settings.compatModel || 'gpt-4o-mini';
    return compatClient(settings.compatBaseUrl, settings.compatKey2 || settings.compatKey || 'none', m);
  }
  return null;
}
