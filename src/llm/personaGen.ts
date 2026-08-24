import { LLMSettings } from '../types';
import { mainClient } from './adapters';
import { detectRefusal } from './refusalRescue';

export interface PersonaInput {
  name: string;
  title: string;
  faction: string;
  inspiration?: string;
  language: string;
}

const template = (p: PersonaInput) =>
  `You are ${p.name}, ${p.title} of the fictional republic of Bharatam (a satirical parody — no real persons). ` +
  `Speak in a voice all your own: short sentences, one favourite phrase, one open secret. ` +
  `${p.inspiration ? `You are loosely inspired by: ${p.inspiration} — keep the mannerism, never the name. ` : ''}` +
  `You believe your faction is right, you distrust the others politely, and you negotiate everything except your one principle.`;

export async function generatePersona(
  settings: LLMSettings,
  input: PersonaInput
): Promise<{ text: string; source: 'llm' | 'offline' }> {
  const client = mainClient(settings);
  if (!client) return { text: template(input), source: 'offline' };
  const system = [
    'You write character persona instructions for the satirical political-simulation game "RAJYA: Rise of Kings".',
    'Everything is fictional parody — no real persons, no real parties. A persona is 4-6 sentences in the second person ("You are X, ...") describing how the character speaks, thinks, and negotiates.',
    `WRITE THE PERSONA IN: ${input.language}.`,
    'Output the persona block only. No quotes, no preamble.',
  ].join(' ');
  const user = [
    `Name: ${input.name}`,
    `Role: ${input.title}`,
    `Faction: ${input.faction}`,
    input.inspiration ? `Inspired by (parody only — capture the manner, never name the person): ${input.inspiration}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  try {
    const text = await client.complete({ system, user, maxTokens: 320 });
    const clean = text.trim();
    if (!clean || detectRefusal(clean) || clean.length < 25) return { text: template(input), source: 'offline' };
    return { text: clean, source: 'llm' };
  } catch {
    return { text: template(input), source: 'offline' };
  }
}
