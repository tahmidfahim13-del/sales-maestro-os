import { getApiKey } from './storage';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const MODEL    = 'claude-sonnet-4-20250514';

export interface Msg { role: 'user' | 'assistant'; content: string; }

export async function askClaude(system: string, messages: Msg[]): Promise<string> {
  const key = await getApiKey();
  if (!key) throw new Error('No API key — open Settings and add your Anthropic key.');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 1024, system, messages }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error((e as any)?.error?.message ?? `API error ${res.status}`);
  }
  const data = await res.json();
  return data.content[0].text as string;
}

// ── System prompts ─────────────────────────────────────────────────────────
export const PROMPTS = {
  morning: (day: number) =>
    `You are a direct, no-nonsense accountability partner. The user is on Day ${day}/28 of a 28-day transformation to become an AI-educated B2B Sales Maestro. They have a history of starting strong and quitting. Be direct, not soft. Ask one sharp follow-up question. Max 3 sentences.`,

  evening: (day: number, commitment: string, history: string) =>
    `You are an honest mirror. Day ${day}/28. User committed to: "${commitment}". Last 7 days: ${history || 'no data yet'}. Evaluate honestly — executing or rationalizing? Identify patterns if they exist. Be direct. Max 4 sentences.`,

  brainDump: () =>
    `Sort this brain dump into NOW (must do today), LATER (can wait), TRASH (out of control or unnecessary). For each NOW item give one specific actionable next step. Be ruthless about TRASH. Respond ONLY with valid JSON in this exact shape: {"now":[{"item":"...","action":"..."}],"later":["..."],"trash":["..."]}`,

  roleplay: (persona: string, difficulty: number, scenario: string) =>
    `You are playing ${persona}. Stay in character at all times. Difficulty: ${difficulty}/5. Scenario: ${scenario}. Be realistic and challenging. Do not break character until the user says "end session". Keep each response to 2–4 sentences.`,

  debrief: (persona: string, transcript: string) =>
    `You just completed a roleplay as ${persona}. Break character and analyze the salesperson's performance.\n\nTranscript:\n${transcript}\n\nScore each dimension 1–5. Respond ONLY with valid JSON: {"articulation":N,"confidence":N,"pressure":N,"strategy":N,"summary":"2–3 sentence honest assessment"}`,

  weekly: (week: number, data: string) =>
    `Review this person's Week ${week} of their 28-day B2B Sales Maestro program. Data: ${data}. Be an honest mirror — what patterns do you see? What are they avoiding? What is actually working? Max 6 sentences. End with a bold identity statement starting with "I am..."`,

  quote: (day: number, theme: string) =>
    `One sharp motivational line for a B2B sales professional on Day ${day}/28, week theme: "${theme}". No fluff. One sentence only. No surrounding quotes.`,
};
