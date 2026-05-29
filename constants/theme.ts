export const COLORS = {
  background: '#0A0A0F',
  surface: '#12121A',
  surfaceAlt: '#1A1A26',
  primaryText: '#E8E8F0',
  secondaryText: '#8888A0',
  mutedText: '#55556A',
  micActive: '#FF3B30',
  micIdle: '#FFFFFF',
  error: '#FF453A',
  success: '#32D74B',
  border: '#2A2A3A',

  week1: '#2196F3',
  week2: '#9C27B0',
  week3: '#4CAF50',
  week4: '#FF9800',
};

export const WEEK_THEMES = [
  { week: 1, color: COLORS.week1, name: 'Foundation', tagline: 'Build the base.' },
  { week: 2, color: COLORS.week2, name: 'Pressure', tagline: 'Embrace discomfort.' },
  { week: 3, color: COLORS.week3, name: 'Execution', tagline: 'No more rehearsing.' },
  { week: 4, color: COLORS.week4, name: 'Mastery', tagline: 'Become the Maestro.' },
];

export const TIER_LABELS = {
  full: 'Full Day',
  half: 'Half Day',
  survival: 'Survival Day',
};

export const ROLEPLAY_PERSONAS = [
  { id: 'senior_client', label: 'Tough Senior Client', description: 'Battle-hardened exec who has heard every pitch.' },
  { id: 'skeptical_ceo', label: 'Skeptical CEO', description: 'Results-only mindset, zero tolerance for fluff.' },
  { id: 'consultant', label: 'Challenging Consultant', description: 'Expert who questions every assumption.' },
];

export const ROLEPLAY_SCENARIOS = [
  'Initial discovery call — they have 10 minutes, nothing more.',
  'Price objection — budget cut 40%, still want results.',
  'Competitive pressure — they are evaluating three other vendors.',
  'Decision delayed — stakeholder just added new requirements.',
  'ROI challenge — prove the value in concrete numbers.',
];
