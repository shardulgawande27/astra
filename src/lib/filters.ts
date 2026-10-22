import { DIFFICULTIES, STATUSES, type Category, type Difficulty, type Question, type Status } from '../types';

export interface QuestionFilters {
  query: string;
  category: Category | 'all';
  difficulty: Difficulty | 'all';
  status: Status | 'all';
  topic: string;
  tag: string;
  bookmarkedOnly: boolean;
}

export const DEFAULT_FILTERS: QuestionFilters = {
  query: '',
  category: 'all',
  difficulty: 'all',
  status: 'all',
  topic: '',
  tag: '',
  bookmarkedOnly: false,
};

export const SORT_OPTIONS = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'created', label: 'Recently added' },
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'status', label: 'Status' },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]['value'];

function searchableText(q: Question): string {
  return [
    q.title,
    q.topic,
    q.category,
    q.difficulty,
    q.tags.join(' '),
    q.statement,
    q.notes,
    q.solutions.map((s) => `${s.title} ${s.approach}`).join(' '),
  ]
    .join(' \n ')
    .toLowerCase();
}

/** Every whitespace-separated term must appear somewhere in the question. */
export function matchesQuery(q: Question, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const text = searchableText(q);
  return terms.every((t) => text.includes(t));
}

export function filterQuestions(questions: Question[], f: QuestionFilters): Question[] {
  return questions.filter(
    (q) =>
      (f.category === 'all' || q.category === f.category) &&
      (f.difficulty === 'all' || q.difficulty === f.difficulty) &&
      (f.status === 'all' || q.status === f.status) &&
      (!f.topic || q.topic.toLowerCase() === f.topic.toLowerCase()) &&
      (!f.tag || q.tags.some((t) => t.toLowerCase() === f.tag.toLowerCase())) &&
      (!f.bookmarkedOnly || q.bookmarked) &&
      matchesQuery(q, f.query),
  );
}

export function sortQuestions(questions: Question[], key: SortKey): Question[] {
  const list = [...questions];
  switch (key) {
    case 'created':
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'title':
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case 'difficulty':
      return list.sort((a, b) => DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty) || a.title.localeCompare(b.title));
    case 'status':
      return list.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.title.localeCompare(b.title));
    case 'updated':
    default:
      return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

export function uniqueSorted(values: string[]): string[] {
  const map = new Map<string, string>();
  for (const v of values) if (v && !map.has(v.toLowerCase())) map.set(v.toLowerCase(), v);
  return [...map.values()].sort((a, b) => a.localeCompare(b));
}
