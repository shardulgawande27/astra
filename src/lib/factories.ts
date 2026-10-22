import type { Example, Question, Solution } from '../types';
import { createId, nowIso } from './id';

export function emptyQuestion(): Question {
  const now = nowIso();
  return {
    id: createId('q'),
    title: '',
    statement: '',
    category: 'DSA',
    topic: '',
    difficulty: 'Easy',
    tags: [],
    examples: [],
    constraints: [],
    sourceUrl: '',
    notes: '',
    edgeCases: [],
    status: 'Not Started',
    bookmarked: false,
    solutions: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function emptySolution(): Solution {
  const now = nowIso();
  return {
    id: createId('s'),
    approach: 'Brute Force',
    title: '',
    code: '',
    explanation: '',
    intuition: '',
    timeComplexity: '',
    spaceComplexity: '',
    tradeoffs: '',
    notes: '',
    dryRun: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function emptyExample(): Example {
  return { id: createId('ex'), input: '', output: '', explanation: '' };
}
