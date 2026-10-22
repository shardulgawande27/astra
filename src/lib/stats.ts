import { CATEGORIES, DIFFICULTIES, STATUSES, type Category, type Difficulty, type Question, type Status } from '../types';

export interface Breakdown {
  total: number;
  solved: number;
}

export interface Stats {
  total: number;
  solutions: number;
  bookmarked: number;
  byStatus: Record<Status, number>;
  byCategory: Record<Category, Breakdown>;
  byDifficulty: Record<Difficulty, Breakdown>;
  recent: Question[];
  bookmarks: Question[];
}

function initRecord<K extends string, V>(keys: readonly K[], make: () => V): Record<K, V> {
  return Object.fromEntries(keys.map((k) => [k, make()])) as Record<K, V>;
}

export function computeStats(questions: Question[], recentLimit = 5): Stats {
  const byStatus = initRecord(STATUSES, () => 0);
  const byCategory = initRecord(CATEGORIES, (): Breakdown => ({ total: 0, solved: 0 }));
  const byDifficulty = initRecord(DIFFICULTIES, (): Breakdown => ({ total: 0, solved: 0 }));
  let solutions = 0;

  for (const q of questions) {
    byStatus[q.status]++;
    const solved = q.status === 'Solved' ? 1 : 0;
    byCategory[q.category].total++;
    byCategory[q.category].solved += solved;
    byDifficulty[q.difficulty].total++;
    byDifficulty[q.difficulty].solved += solved;
    solutions += q.solutions.length;
  }

  const byCreated = [...questions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const bookmarks = [...questions].filter((q) => q.bookmarked).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return {
    total: questions.length,
    solutions,
    bookmarked: bookmarks.length,
    byStatus,
    byCategory,
    byDifficulty,
    recent: byCreated.slice(0, recentLimit),
    bookmarks: bookmarks.slice(0, recentLimit),
  };
}
