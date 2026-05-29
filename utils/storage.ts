import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  API_KEY: 'sm_api_key',
  START_DATE: 'sm_start_date',
  DAILY_LOGS: 'sm_daily_logs',
  ROLEPLAY_HISTORY: 'sm_roleplay_history',
  WEEKLY_REVIEWS: 'sm_weekly_reviews',
  SETTINGS: 'sm_settings',
  STREAK: 'sm_streak',
  LAST_OPEN: 'sm_last_open',
};

export type DayTier = 'full' | 'half' | 'survival';

export interface DailyLog {
  date: string;
  day: number;
  tier: DayTier | null;
  morningDone: boolean;
  eveningDone: boolean;
  roleplayDone: boolean;
  coursaraDone: boolean;
  morningCommitment: string;
  eveningReport: string;
  claudeEvaluation: string;
}

export interface RoleplaySession {
  id: string;
  date: string;
  persona: string;
  difficulty: number;
  messages: { role: 'user' | 'assistant'; content: string }[];
  debrief: string;
  scores: {
    articulation: number;
    confidence: number;
    pressure: number;
    strategy: number;
  };
}

export interface Settings {
  morningNotifHour: number;
  morningNotifMinute: number;
  eveningNotifHour: number;
  eveningNotifMinute: number;
  notificationsEnabled: boolean;
}

export interface WeeklyReview {
  week: number;
  date: string;
  userReflection: string;
  claudeEvaluation: string;
  identityStatement: string;
}

const DEFAULT_SETTINGS: Settings = {
  morningNotifHour: 6,
  morningNotifMinute: 0,
  eveningNotifHour: 21,
  eveningNotifMinute: 0,
  notificationsEnabled: true,
};

export async function saveApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.API_KEY, key);
}

export async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.API_KEY);
}

export async function getStartDate(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.START_DATE);
}

export async function setStartDate(date: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.START_DATE, date);
}

export async function getCurrentDay(): Promise<number> {
  const startDate = await getStartDate();
  if (!startDate) return 1;
  const start = new Date(startDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diff + 1, 1), 28);
}

export function getCurrentWeek(day: number): number {
  return Math.ceil(day / 7);
}

export async function getDailyLogs(): Promise<DailyLog[]> {
  const raw = await AsyncStorage.getItem(KEYS.DAILY_LOGS);
  return raw ? JSON.parse(raw) : [];
}

export async function getTodayLog(): Promise<DailyLog | null> {
  const today = new Date().toISOString().split('T')[0];
  const logs = await getDailyLogs();
  return logs.find((l) => l.date === today) || null;
}

export async function saveDailyLog(log: Partial<DailyLog>): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const logs = await getDailyLogs();
  const idx = logs.findIndex((l) => l.date === today);
  const day = await getCurrentDay();
  const existing = idx >= 0 ? logs[idx] : {
    date: today,
    day,
    tier: null,
    morningDone: false,
    eveningDone: false,
    roleplayDone: false,
    coursaraDone: false,
    morningCommitment: '',
    eveningReport: '',
    claudeEvaluation: '',
  };
  const updated = { ...existing, ...log };
  if (idx >= 0) {
    logs[idx] = updated;
  } else {
    logs.push(updated);
  }
  await AsyncStorage.setItem(KEYS.DAILY_LOGS, JSON.stringify(logs));
}

export async function getLastSevenLogs(): Promise<DailyLog[]> {
  const logs = await getDailyLogs();
  return logs.slice(-7);
}

export async function saveRoleplaySession(session: RoleplaySession): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.ROLEPLAY_HISTORY);
  const history: RoleplaySession[] = raw ? JSON.parse(raw) : [];
  history.push(session);
  await AsyncStorage.setItem(KEYS.ROLEPLAY_HISTORY, JSON.stringify(history));
}

export async function getRoleplaySessions(): Promise<RoleplaySession[]> {
  const raw = await AsyncStorage.getItem(KEYS.ROLEPLAY_HISTORY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveWeeklyReview(review: WeeklyReview): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.WEEKLY_REVIEWS);
  const reviews: WeeklyReview[] = raw ? JSON.parse(raw) : [];
  const idx = reviews.findIndex((r) => r.week === review.week);
  if (idx >= 0) reviews[idx] = review;
  else reviews.push(review);
  await AsyncStorage.setItem(KEYS.WEEKLY_REVIEWS, JSON.stringify(reviews));
}

export async function getWeeklyReviews(): Promise<WeeklyReview[]> {
  const raw = await AsyncStorage.getItem(KEYS.WEEKLY_REVIEWS);
  return raw ? JSON.parse(raw) : [];
}

export async function getSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
}

export async function getStreak(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.STREAK);
  return raw ? parseInt(raw, 10) : 0;
}

export async function updateStreak(): Promise<number> {
  const logs = await getDailyLogs();
  if (!logs.length) return 0;
  let streak = 0;
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const today = new Date().toISOString().split('T')[0];
  for (let i = 0; i < sortedLogs.length; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const log = sortedLogs.find((l) => l.date === dateStr);
    if (log && (log.morningDone || log.eveningDone)) streak++;
    else break;
  }
  await AsyncStorage.setItem(KEYS.STREAK, String(streak));
  return streak;
}

export async function getLastOpenDate(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.LAST_OPEN);
}

export async function setLastOpenDate(): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_OPEN, new Date().toISOString().split('T')[0]);
}

export async function getDaysSinceLastOpen(): Promise<number> {
  const last = await getLastOpenDate();
  if (!last) return 0;
  const lastDate = new Date(last);
  const now = new Date();
  return Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}
