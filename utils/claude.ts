import { getApiKey } from './storage';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1024;
const API_URL = 'https://api.anthropic.com/v1/messages';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function callClaude(
  systemPrompt: string,
  messages: Message[],
): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key set. Please add your Anthropic API key in settings.');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text as string;
}

export function buildMorningPrompt(day: number): string {
  return `You are a direct, no-nonsense accountability partner. The user is on Day ${day} of a 28-day transformation to become an AI-educated B2B Sales Maestro. They have a history of starting strong and quitting. Be direct, not soft. Ask one sharp follow-up question. Max 3 sentences.`;
}

export function buildEveningPrompt(day: number, commitment: string, lastSevenSummary: string): string {
  return `You are an honest mirror. The user is on Day ${day} of 28. They committed to: "${commitment}" this morning. You have context from their last 7 days: ${lastSevenSummary || 'No prior data yet.'}. Evaluate honestly — are they executing or rationalizing? Check for patterns. Be direct. Max 4 sentences.`;
}

export function buildBrainDumpPrompt(): string {
  return `Sort this brain dump into NOW (must do today), LATER (can wait), TRASH (unnecessary or out of control). For each NOW item, give one specific actionable next step. Be ruthless about what goes in TRASH. Respond ONLY with valid JSON in this exact format: {"now": [{"item": "...", "action": "..."}], "later": ["..."], "trash": ["..."]}`;
}

export function buildRoleplayPrompt(persona: string, difficulty: number, scenario: string): string {
  return `You are playing ${persona}. Stay in character at all times. Difficulty: ${difficulty}/5. Be realistic and challenging. Do not break character until the user says "end session". Scenario: ${scenario}. Respond as this character would — push back, question assumptions, be demanding. Keep each response to 2-4 sentences.`;
}

export function buildDebriefPrompt(persona: string, messages: Message[]): string {
  const transcript = messages.map((m) => `${m.role === 'user' ? 'Salesperson' : persona}: ${m.content}`).join('\n');
  return `You just completed a roleplay as ${persona}. Now break character completely and analyze the salesperson's performance. Transcript:\n${transcript}\n\nEvaluate: articulation (1-5), confidence (1-5), pressure handling (1-5), strategic thinking (1-5). Give a brief honest assessment. Respond as JSON: {"articulation": N, "confidence": N, "pressure": N, "strategy": N, "summary": "..."}`;
}

export function buildWeeklyPrompt(weekNumber: number, weekData: string): string {
  return `You are reviewing this person's Week ${weekNumber} data from their 28-day B2B Sales Maestro transformation: ${weekData}. Be an honest mirror. What patterns do you see? What are they avoiding? What is actually working? Max 6 sentences. End with their Week ${weekNumber} identity statement — one bold declarative sentence starting with "I am..."`;
}

export function buildDailyQuotePrompt(day: number, week: number, weekTheme: string): string {
  return `Generate one sharp, direct motivational line for a B2B sales professional on Day ${day} of 28, Week ${week} theme: "${weekTheme}". No fluff. One sentence. No quotes around it.`;
}
