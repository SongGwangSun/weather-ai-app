export interface OutfitRecommendation {
  summary: string;
  top: string;
  topColors?: string[];
  bottom: string;
  bottomColors?: string[];
  outer: string;
  outerColors?: string[];
  shoes: string;
  shoeColors?: string[];
  colorStory?: string;
  accessories: string[];
  tips: string[];
  warning: string | null;
}

export interface OutfitHistoryEntry {
  id: string;               // nanoid or timestamp string
  date: string;             // YYYY-MM-DD
  timestamp: number;
  place: string;
  mood: string;
  style: string;
  weatherSummary: string;   // e.g. "서울 · 22°C · 맑음"
  recommendation: OutfitRecommendation;
  source: 'ai' | 'rule';
}

const HISTORY_KEY = 'outfit-history-v2';
const MAX_ENTRIES = 90; // 90일 보관

export function loadOutfitHistory(): OutfitHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch { return []; }
}

export function saveOutfitHistory(entries: OutfitHistoryEntry[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function addOutfitHistory(entry: Omit<OutfitHistoryEntry, 'id'>): OutfitHistoryEntry[] {
  const existing = loadOutfitHistory();
  // 같은 날짜는 덮어쓰기 (최신 것만 보관)
  const filtered = existing.filter((e) => e.date !== entry.date);
  const newEntry: OutfitHistoryEntry = { id: Date.now().toString(), ...entry };
  const next = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
  saveOutfitHistory(next);
  return next;
}

export function deleteOutfitHistory(id: string): OutfitHistoryEntry[] {
  const next = loadOutfitHistory().filter((e) => e.id !== id);
  saveOutfitHistory(next);
  return next;
}

export function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}
