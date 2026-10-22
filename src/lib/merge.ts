import type { Question } from '../types';

export type ImportMode = 'merge' | 'replace';
/** On id conflicts during a merge: take the imported copy, or keep what is already saved. */
export type ConflictStrategy = 'imported' | 'existing';

export interface ImportAnalysis {
  incoming: number;
  solutions: number;
  newCount: number;
  conflictCount: number;
  existing: number;
}

export function analyzeImport(existing: Question[], incoming: Question[]): ImportAnalysis {
  const ids = new Set(existing.map((q) => q.id));
  const conflictCount = incoming.filter((q) => ids.has(q.id)).length;
  return {
    incoming: incoming.length,
    solutions: incoming.reduce((n, q) => n + q.solutions.length, 0),
    newCount: incoming.length - conflictCount,
    conflictCount,
    existing: existing.length,
  };
}

export interface ImportOutcome {
  questions: Question[];
  added: number;
  updated: number;
  skipped: number;
  removed: number;
}

export function applyImport(
  existing: Question[],
  incoming: Question[],
  mode: ImportMode,
  strategy: ConflictStrategy = 'imported',
): ImportOutcome {
  if (mode === 'replace') {
    return { questions: incoming, added: incoming.length, updated: 0, skipped: 0, removed: existing.length };
  }

  const incomingById = new Map(incoming.map((q) => [q.id, q]));
  let updated = 0;
  let skipped = 0;
  const merged = existing.map((q) => {
    const replacement = incomingById.get(q.id);
    if (!replacement) return q;
    if (strategy === 'imported') {
      updated++;
      return replacement;
    }
    skipped++;
    return q;
  });
  const existingIds = new Set(existing.map((q) => q.id));
  const additions = incoming.filter((q) => !existingIds.has(q.id));
  return { questions: [...merged, ...additions], added: additions.length, updated, skipped, removed: 0 };
}
