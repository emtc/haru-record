export const COLORS = {
  bgStart: '#fdfbff',
  bgEnd: '#f5edf7',
  ink: '#2e2638',
  ink2: 'rgba(46,38,56,0.65)',
  ink3: 'rgba(46,38,56,0.35)',
  rail: 'rgba(120,90,140,0.35)',
  accent1: '#f5b7d4',
  accent2: '#c9a8e6',
  purple: '#7c5fa3',
  pink: '#d28aa8',
  white: '#ffffff',
  cardBg: 'rgba(255,255,255,0.85)',
  separator: 'rgba(120,90,140,0.08)',
  chipBorder: 'rgba(120,90,140,0.10)',
  dark: '#1c1726',
};

export const ACCENT_GRADIENT: [string, string] = ['#f5b7d4', '#c9a8e6'];
export const BG_GRADIENT: [string, string] = ['#fdfbff', '#f5edf7'];

// ↓ カテゴリごとのグラデーション。色を変えたい時はここだけ編集してください。
export const CATEGORY_GRADIENT: Record<string, [string, string]> = {
  '整形':      ['#c8a8f0', '#9068d4'],  // lavender → deep violet
  '脱毛':      ['#f5b0d8', '#d870b8'],  // blush → rose
  'スキンケア': ['#eea8ec', '#c070c4'],  // lilac → orchid
  '注入':      ['#b0b4f4', '#8080d8'],  // periwinkle → blue-violet
  'その他':    ['#c4b4f0', '#9880d4'],  // soft lavender → muted purple
};

export const SHADOW = {
  shadowColor: '#7c5fa3',
  shadowOpacity: 0.06 as number,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

export const CARD_SHADOW = {
  shadowColor: '#b48cc8',
  shadowOpacity: 0.08 as number,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 1 },
  elevation: 2,
};

export const RADIUS = {
  card: 18,
  cardLg: 22,
  chip: 999,
  fab: 18,
  avatar: 22,
  sm: 12,
  xs: 10,
};
