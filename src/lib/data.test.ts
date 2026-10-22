import { describe, expect, it } from 'vitest';
import { SAMPLE_QUESTIONS } from '../data/sampleQuestions';
import type { Question } from '../types';
import { filterQuestions, DEFAULT_FILTERS, sortQuestions } from './filters';
import { analyzeImport, applyImport } from './merge';
import { computeStats } from './stats';
import { DATA_KEY, loadQuestions, META_KEY, saveQuestions, type KeyValueStore } from './storage';
import { parseJsonText, validatePayload } from './validation';

class MemoryStore implements KeyValueStore {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

const q = (id: string, extra: Partial<Question> = {}): Question => ({
  ...structuredClone(SAMPLE_QUESTIONS[0]),
  id,
  title: `Q ${id}`,
  ...extra,
});

describe('sample data', () => {
  it('passes validation without warnings', () => {
    const res = validatePayload({ app: 'astra', version: 1, questions: SAMPLE_QUESTIONS });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.questions).toHaveLength(SAMPLE_QUESTIONS.length);
      expect(res.warnings).toEqual([]);
    }
  });
});

describe('storage', () => {
  it('seeds samples once on first launch', () => {
    const store = new MemoryStore();
    const first = loadQuestions(store);
    expect(first.seeded).toBe(true);
    expect(first.questions.length).toBe(SAMPLE_QUESTIONS.length);
    expect(JSON.parse(store.getItem(META_KEY)!).seeded).toBe(true);
  });

  it('never re-seeds after the user deletes everything', () => {
    const store = new MemoryStore();
    loadQuestions(store);
    saveQuestions([], store);
    expect(loadQuestions(store).questions).toEqual([]);
    // Even if the data key disappears entirely, the seeded flag prevents restoring samples.
    store.removeItem(DATA_KEY);
    expect(loadQuestions(store).questions).toEqual([]);
  });

  it('round-trips saved questions', () => {
    const store = new MemoryStore();
    const qs = [q('a'), q('b', { bookmarked: true })];
    saveQuestions(qs, store);
    expect(loadQuestions(store).questions).toEqual(qs);
  });

  it('backs up corrupted data instead of discarding it', () => {
    const store = new MemoryStore();
    store.setItem(DATA_KEY, '{not json');
    const res = loadQuestions(store);
    expect(res.error).toBeTruthy();
    expect(res.backupKey).toBeTruthy();
    expect(store.getItem(res.backupKey!)).toBe('{not json');
  });
});

describe('validation', () => {
  it('rejects invalid JSON', () => {
    const res = parseJsonText('{oops');
    expect(res.ok).toBe(false);
  });

  it('rejects files from other apps and newer versions', () => {
    expect(validatePayload({ app: 'other', questions: [] }).ok).toBe(false);
    expect(validatePayload({ app: 'astra', version: 99, questions: [] }).ok).toBe(false);
  });

  it('reports missing required fields with paths', () => {
    const res = validatePayload({ app: 'astra', version: 1, questions: [{ id: 'x', category: 'Python' }] });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.some((e) => e.includes('title is required'))).toBe(true);
      expect(res.errors.some((e) => e.includes('category'))).toBe(true);
      expect(res.errors.some((e) => e.includes('difficulty'))).toBe(true);
    }
  });

  it('rejects duplicate question ids', () => {
    const res = validatePayload({ questions: [q('dup'), q('dup')] });
    expect(res.ok).toBe(false);
  });

  it('fills defaults for optional fields and normalizes case', () => {
    const res = validatePayload({ questions: [{ id: 'm', title: 'Minimal', category: 'react', difficulty: 'hard' }] });
    expect(res.ok).toBe(true);
    if (res.ok) {
      const [m] = res.questions;
      expect(m.category).toBe('React');
      expect(m.difficulty).toBe('Hard');
      expect(m.status).toBe('Not Started');
      expect(m.solutions).toEqual([]);
      expect(m.bookmarked).toBe(false);
    }
  });

  it('drops unknown visualizer references with a warning', () => {
    const bad = q('v');
    bad.solutions[0].dryRun = { visualizerId: 'does-not-exist', input: {} };
    const res = validatePayload({ questions: [bad] });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.questions[0].solutions[0].dryRun).toBeNull();
      expect(res.warnings.length).toBe(1);
    }
  });
});

describe('merge / replace', () => {
  const existing = [q('a', { title: 'Old A' }), q('b')];
  const incoming = [q('a', { title: 'New A' }), q('c')];

  it('analyzes conflicts', () => {
    expect(analyzeImport(existing, incoming)).toMatchObject({ incoming: 2, newCount: 1, conflictCount: 1 });
  });

  it('merge preferring imported overwrites conflicts', () => {
    const res = applyImport(existing, incoming, 'merge', 'imported');
    expect(res.questions.map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(res.questions[0].title).toBe('New A');
    expect(res).toMatchObject({ added: 1, updated: 1, skipped: 0 });
  });

  it('merge keeping existing skips conflicts', () => {
    const res = applyImport(existing, incoming, 'merge', 'existing');
    expect(res.questions[0].title).toBe('Old A');
    expect(res).toMatchObject({ added: 1, updated: 0, skipped: 1 });
  });

  it('replace discards existing data', () => {
    const res = applyImport(existing, incoming, 'replace');
    expect(res.questions.map((x) => x.id)).toEqual(['a', 'c']);
    expect(res.removed).toBe(2);
  });
});

describe('stats and filters', () => {
  it('derives stats from data', () => {
    const s = computeStats(SAMPLE_QUESTIONS);
    expect(s.total).toBe(SAMPLE_QUESTIONS.length);
    expect(s.byStatus.Solved + s.byStatus.Attempted + s.byStatus['Not Started']).toBe(s.total);
    expect(s.byCategory.DSA.total + s.byCategory.JavaScript.total + s.byCategory.React.total).toBe(s.total);
    expect(s.bookmarked).toBe(SAMPLE_QUESTIONS.filter((x) => x.bookmarked).length);
    expect(computeStats([]).total).toBe(0);
  });

  it('filters by multi-term query and facets', () => {
    const res = filterQuestions(SAMPLE_QUESTIONS, { ...DEFAULT_FILTERS, query: 'hash two' });
    expect(res.map((x) => x.id)).toContain('sample-two-sum');
    const react = filterQuestions(SAMPLE_QUESTIONS, { ...DEFAULT_FILTERS, category: 'React' });
    expect(react.every((x) => x.category === 'React')).toBe(true);
    const tag = filterQuestions(SAMPLE_QUESTIONS, { ...DEFAULT_FILTERS, tag: 'Stack' });
    expect(tag.length).toBeGreaterThan(0);
  });

  it('sorts by title', () => {
    const sorted = sortQuestions(SAMPLE_QUESTIONS, 'title').map((x) => x.title);
    expect(sorted).toEqual([...sorted].sort((a, b) => a.localeCompare(b)));
  });
});
