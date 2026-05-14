export type Category = '整形' | '脱毛' | 'スキンケア' | '注入' | 'その他';

export const CATEGORIES: Category[] = ['整形', '脱毛', 'スキンケア', '注入', 'その他'];

export const ALL_FILTER = 'すべて';
export type FilterCategory = typeof ALL_FILTER | Category;

export interface Treatment {
  id: string;
  name: string;
  category: Category;
  date: string; // YYYY-MM-DD
  clinic: string;
  memo: string;
  iconUri: string;
  createdAt: string;
}

export interface TreatmentPhoto {
  id: string;
  treatmentId: string;
  uri: string;
  label: string;
  date: string; // YYYY-MM-DD
  caption: string;
  createdAt: string;
}

export interface ElapsedTime {
  months: number;
  days: number;
  totalDays: number;
}
