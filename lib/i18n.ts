import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import en from '../locales/en';
import ja from '../locales/ja';
import zh from '../locales/zh';
import zhTW from '../locales/zh-TW';
import ko from '../locales/ko';
import { Category, ALL_FILTER } from '../types';

const i18n = new I18n({ en, ja, zh, 'zh-TW': zhTW, ko });
i18n.enableFallback = true;
i18n.defaultLocale = 'ja';

const locale = getLocales()[0];
const langCode = locale?.languageCode ?? 'ja';
const langTag  = locale?.languageTag  ?? 'ja';

function detectLocale(): string {
  if (langCode === 'ja') return 'ja';
  if (langCode === 'ko') return 'ko';
  if (langCode === 'zh') {
    // zh-Hant / zh-Hant-TW = Traditional Chinese (Taiwan/HK)
    // zh-Hans / zh-Hans-CN  = Simplified Chinese
    return langTag.startsWith('zh-Hant') ? 'zh-TW' : 'zh';
  }
  return 'en';
}

i18n.locale = detectLocale();

export default i18n;

export function t(scope: string, options?: Record<string, unknown>): string {
  return i18n.t(scope, options) as string;
}

const CATEGORY_KEY: Record<Category | typeof ALL_FILTER, string> = {
  '整形': 'categories.surgery',
  '脱毛': 'categories.hair_removal',
  'スキンケア': 'categories.skin_care',
  '注入': 'categories.injections',
  'その他': 'categories.other',
  'すべて': 'categories.all',
};

export function tCategory(cat: Category | typeof ALL_FILTER): string {
  return t(CATEGORY_KEY[cat] ?? 'categories.other');
}
