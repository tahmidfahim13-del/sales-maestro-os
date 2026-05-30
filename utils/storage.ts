import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  API_KEY:   'sm_api_key',
  START:     'sm_start_date',
  LOGS:      'sm_logs',
  SETTINGS:  'sm_settings',
  STREAK:    'sm_streak',
  LAST_OPEN: 'sm_last_open',
  WEEKLY:    'sm_weekly',
  ROLEPLAY:  'sm_roleplay',
};

export type Tier = 'full' | 'half' | 'survival';

export interface DayLog {
  date: string; day: number; tier: Tier | null;
  morningDone: boolean; eveningDone: boolean; roleplayDone: boolean;
  morningText: string; eveningText: string; claudeResponse: string;
}

export interface Settings {
  morningHour: number; morningMin: number;
  eveningHour: number; eveningMin: number;
  notifsEnabled: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  morningHour: 6, morningMin: 0,
  eveningHour: 21, eveningMin: 0,
  notifsEnabled: true,
};

// ── API key ────────────────────────────────────────────────────────────────
export const saveApiKey = (k: string) => AsyncStorage.setItem(K.API_KEY, k);
export const getApiKey  = ()          => AsyncStorage.getItem(K.API_KEY);

// ── Start date / day ───────────────────────────────────────────────────────
export const getStartDate = () => AsyncStorage.getItem(K.START);
export const setStartDate = (d: string) => AsyncStorage.setItem(K.START, d);

export async function getCurrentDay(): Promise<number> {
  const s = await getStartDate();
  if (!s) return 1;
  const diff = Math.floor((Date.now() - new Date(s).getTime()) / 86_400_000);
  return Math.min(Math.max(diff + 1, 1), 28);
}

export const weekOf = (day: number) => Math.min(Math.ceil(day / 7), 4);

// ── Daily logs ─────────────────────────────────────────────────────────────
export async function getLogs(): Promise<DayLog[]> {
  const r = await AsyncStorage.getItem(K.LOGS);
  return r ? JSON.parse(r) : [];
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

export async function getTodayLog(): Promise<DayLog | null> {
  const logs = await getLogs();
  return logs.find(l => l.date === todayStr()) ?? null;
}

export async function saveLog(patch: Partial<DayLog>): Promise<void> {
  const logs = await getLogs();
  const today = todayStr();
  const idx   = logs.findIndex(l => l.date === today);
  const day   = await getCurrentDay();
  const base: DayLog = idx >= 0 ? logs[idx] : {
    date: today, day, tier: null,
    morningDone: false, eveningDone: false, roleplayDone: false,
    morningText: '', eveningText: '', claudeResponse: '',
  };
  const updated = { ...base, ...patch };
  if (idx >= 0) logs[idx] = updated; else logs.push(updated);
  await AsyncStorage.setItem(K.LOGS, JSON.stringify(logs));
}

export async function getLast7(): Promise<DayLog[]> {
  const logs = await getLogs();
  return logs.slice(-7);
}

// ── Settings ───────────────────────────────────────────────────────────────
export async function getSettings(): Promise<Settings> {
  const r = await AsyncStorage.getItem(K.SETTINGS);
  return r ? { ...DEFAULT_SETTINGS, ...JSON.parse(r) } : DEFAULT_SETTINGS;
}
export async function saveSettings(p: Partial<Settings>) {
  const s = await getSettings();
  await AsyncStorage.setItem(K.SETTINGS, JSON.stringify({ ...s, ...p }));
}

// ── Streak ─────────────────────────────────────────────────────────────────
export async function updateStreak(): Promise<number> {
  const logs  = await getLogs();
  const today = todayStr();
  let streak  = 0;
  for (let i = 0; i < 28; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const l = logs.find(x => x.date === d.toISOString().split('T')[0]);
    if (l && (l.morningDone || l.eveningDone)) streak++;
    else break;
  }
  await AsyncStorage.setItem(K.STREAK, String(streak));
  return streak;
}

// ── Last open ──────────────────────────────────────────────────────────────
export const setLastOpen = () => AsyncStorage.setItem(K.LAST_OPEN, todayStr());
export async function daysSinceLastOpen(): Promise<number> {
  const l = await AsyncStorage.getItem(K.LAST_OPEN);
  if (!l) return 0;
  return Math.floor((Date.now() - new Date(l).getTime()) / 86_400_000);
}

// ── Weekly reviews ─────────────────────────────────────────────────────────
export interface WeeklyReview {
  week: number; reflection: string; evaluation: string; identity: string;
}
export async function saveWeekly(r: WeeklyReview) {
  const raw = await AsyncStorage.getItem(K.WEEKLY);
  const all: WeeklyReview[] = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex(x => x.week === r.week);
  if (idx >= 0) all[idx] = r; else all.push(r);
  await AsyncStorage.setItem(K.WEEKLY, JSON.stringify(all));
}
export async function getWeeklies(): Promise<WeeklyReview[]> {
  const r = await AsyncStorage.getItem(K.WEEKLY);
  return r ? JSON.parse(r) : [];
}

// ── Roleplay sessions ──────────────────────────────────────────────────────
export interface RoleplaySession {
  id: string; date: string; persona: string; difficulty: number;
  messages: { role: 'user' | 'assistant'; content: string }[];
  debrief: string;
  scores: { articulation: number; confidence: number; pressure: number; strategy: number };
}
export async function saveRoleplay(s: RoleplaySession) {
  const raw = await AsyncStorage.getItem(K.ROLEPLAY);
  const all: RoleplaySession[] = raw ? JSON.parse(raw) : [];
  all.push(s);
  await AsyncStorage.setItem(K.ROLEPLAY, JSON.stringify(all));
}

// ── Reset ──────────────────────────────────────────────────────────────────
export const resetAll = () => AsyncStorage.clear();
