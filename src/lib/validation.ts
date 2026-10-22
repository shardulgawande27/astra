import {
  APPROACH_TYPES,
  CATEGORIES,
  DIFFICULTIES,
  EXPORT_VERSION,
  STATUSES,
  type ApproachType,
  type Category,
  type Difficulty,
  type DryRunConfig,
  type Example,
  type Question,
  type Solution,
  type Status,
} from '../types';
import { getVisualizer } from '../visualizer/registry';
import { createId, nowIso } from './id';

export type ValidationResult =
  | { ok: true; questions: Question[]; warnings: string[]; version: number }
  | { ok: false; errors: string[] };

const MAX_REPORTED_ERRORS = 25;

type Rec = Record<string, unknown>;
const isRecord = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);

class Collector {
  errors: string[] = [];
  warnings: string[] = [];
  error(msg: string) {
    this.errors.push(msg);
  }
  warn(msg: string) {
    this.warnings.push(msg);
  }
}

function optString(obj: Rec, key: string, path: string, c: Collector): string {
  const v = obj[key];
  if (v === undefined || v === null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  c.error(`${path}.${key} must be a string.`);
  return '';
}

function stringList(obj: Rec, key: string, path: string, c: Collector): string[] {
  const v = obj[key];
  if (v === undefined || v === null) return [];
  if (typeof v === 'string') return v.split('\n').map((s) => s.trim()).filter(Boolean);
  if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return (v as string[]).map((s) => s.trim()).filter(Boolean);
  c.error(`${path}.${key} must be an array of strings.`);
  return [];
}

function oneOf<T extends string>(
  obj: Rec,
  key: string,
  allowed: readonly T[],
  path: string,
  c: Collector,
  fallback?: T,
): T {
  const v = obj[key];
  if (typeof v === 'string') {
    const match = allowed.find((a) => a.toLowerCase() === v.trim().toLowerCase());
    if (match) return match;
  }
  if ((v === undefined || v === null) && fallback !== undefined) return fallback;
  c.error(`${path}.${key} must be one of: ${allowed.join(', ')}${v === undefined ? ' (missing)' : ` (got ${JSON.stringify(v)})`}.`);
  return fallback ?? allowed[0];
}

function isoDate(obj: Rec, key: string, path: string, c: Collector, fallback: string): string {
  const v = obj[key];
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'string' && !Number.isNaN(Date.parse(v))) return new Date(v).toISOString();
  c.warn(`${path}.${key} is not a valid date; using the current time.`);
  return fallback;
}

function idOf(obj: Rec, path: string, prefix: string, c: Collector): string {
  const v = obj.id;
  if (typeof v === 'string' && v.trim()) return v.trim();
  c.warn(`${path} has no id; a new one was generated.`);
  return createId(prefix);
}

function validateDryRun(v: unknown, path: string, c: Collector): DryRunConfig | null {
  if (v === undefined || v === null) return null;
  if (!isRecord(v) || typeof v.visualizerId !== 'string') {
    c.error(`${path}.dryRun must be null or an object with a visualizerId.`);
    return null;
  }
  if (!getVisualizer(v.visualizerId)) {
    c.warn(`${path}.dryRun refers to unknown visualizer "${v.visualizerId}"; it was removed.`);
    return null;
  }
  const input: Record<string, string> = {};
  if (v.input !== undefined) {
    if (!isRecord(v.input)) {
      c.error(`${path}.dryRun.input must be an object of strings.`);
      return null;
    }
    for (const [k, val] of Object.entries(v.input)) {
      if (typeof val === 'string' || typeof val === 'number') input[k] = String(val);
      else c.error(`${path}.dryRun.input.${k} must be a string.`);
    }
  }
  return { visualizerId: v.visualizerId, input };
}

function validateSolution(v: unknown, path: string, c: Collector): Solution | null {
  if (!isRecord(v)) {
    c.error(`${path} must be an object.`);
    return null;
  }
  const now = nowIso();
  const approach = oneOf<ApproachType>(v, 'approach', APPROACH_TYPES, path, c, 'Custom');
  const createdAt = isoDate(v, 'createdAt', path, c, now);
  const title = optString(v, 'title', path, c).trim() || approach;
  return {
    id: idOf(v, path, 's', c),
    approach,
    title,
    code: optString(v, 'code', path, c),
    explanation: optString(v, 'explanation', path, c),
    intuition: optString(v, 'intuition', path, c),
    timeComplexity: optString(v, 'timeComplexity', path, c),
    spaceComplexity: optString(v, 'spaceComplexity', path, c),
    tradeoffs: optString(v, 'tradeoffs', path, c),
    notes: optString(v, 'notes', path, c),
    dryRun: validateDryRun(v.dryRun, path, c),
    createdAt,
    updatedAt: isoDate(v, 'updatedAt', path, c, createdAt),
  };
}

function validateExample(v: unknown, path: string, c: Collector): Example | null {
  if (!isRecord(v)) {
    c.error(`${path} must be an object.`);
    return null;
  }
  return {
    id: typeof v.id === 'string' && v.id ? v.id : createId('ex'),
    input: optString(v, 'input', path, c),
    output: optString(v, 'output', path, c),
    explanation: optString(v, 'explanation', path, c),
  };
}

function validateQuestion(v: unknown, index: number, c: Collector): Question | null {
  const basePath = `questions[${index}]`;
  if (!isRecord(v)) {
    c.error(`${basePath} must be an object.`);
    return null;
  }
  const title = typeof v.title === 'string' ? v.title.trim() : '';
  const path = title ? `${basePath} ("${title.slice(0, 40)}")` : basePath;
  if (!title) c.error(`${basePath}.title is required.`);

  const now = nowIso();
  const createdAt = isoDate(v, 'createdAt', path, c, now);

  const examples: Example[] = [];
  if (v.examples !== undefined && v.examples !== null) {
    if (Array.isArray(v.examples)) {
      v.examples.forEach((ex, i) => {
        const e = validateExample(ex, `${path}.examples[${i}]`, c);
        if (e) examples.push(e);
      });
    } else c.error(`${path}.examples must be an array.`);
  }

  const solutions: Solution[] = [];
  if (v.solutions !== undefined && v.solutions !== null) {
    if (Array.isArray(v.solutions)) {
      const seen = new Set<string>();
      v.solutions.forEach((s, i) => {
        const sol = validateSolution(s, `${path}.solutions[${i}]`, c);
        if (!sol) return;
        if (seen.has(sol.id)) {
          c.warn(`${path}.solutions[${i}] duplicates solution id "${sol.id}"; a new id was generated.`);
          sol.id = createId('s');
        }
        seen.add(sol.id);
        solutions.push(sol);
      });
    } else c.error(`${path}.solutions must be an array.`);
  }

  const sourceUrl = optString(v, 'sourceUrl', path, c).trim();
  if (sourceUrl && !isHttpUrl(sourceUrl)) c.warn(`${path}.sourceUrl is not a valid http(s) URL; it was cleared.`);

  if (v.bookmarked !== undefined && typeof v.bookmarked !== 'boolean') c.error(`${path}.bookmarked must be true or false.`);

  return {
    id: idOf(v, path, 'q', c),
    title,
    statement: optString(v, 'statement', path, c),
    category: oneOf<Category>(v, 'category', CATEGORIES, path, c),
    topic: optString(v, 'topic', path, c).trim(),
    difficulty: oneOf<Difficulty>(v, 'difficulty', DIFFICULTIES, path, c),
    tags: dedupe(stringList(v, 'tags', path, c)),
    examples,
    constraints: stringList(v, 'constraints', path, c),
    sourceUrl: sourceUrl && isHttpUrl(sourceUrl) ? sourceUrl : '',
    notes: optString(v, 'notes', path, c),
    edgeCases: stringList(v, 'edgeCases', path, c),
    status: oneOf<Status>(v, 'status', STATUSES, path, c, 'Not Started'),
    bookmarked: v.bookmarked === true,
    solutions,
    createdAt,
    updatedAt: isoDate(v, 'updatedAt', path, c, createdAt),
  };
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((v) => {
    const key = v.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates an Astra payload (full export, single-question export, or stored data) and
 * returns normalized questions. Unknown fields are dropped; missing optional fields get defaults.
 */
export function validatePayload(raw: unknown): ValidationResult {
  const c = new Collector();
  let list: unknown[];
  let version = EXPORT_VERSION;

  if (Array.isArray(raw)) {
    list = raw;
    c.warn('File is a bare array of questions (no Astra header). It was accepted.');
  } else if (isRecord(raw)) {
    if (raw.app !== undefined && raw.app !== 'astra') {
      return { ok: false, errors: [`This file belongs to "${String(raw.app)}", not Astra.`] };
    }
    if (raw.version !== undefined) {
      if (typeof raw.version !== 'number' || !Number.isInteger(raw.version) || raw.version < 1) {
        return { ok: false, errors: ['"version" must be a positive integer.'] };
      }
      if (raw.version > EXPORT_VERSION) {
        return {
          ok: false,
          errors: [`File version ${raw.version} is newer than this app supports (${EXPORT_VERSION}). Update Astra first.`],
        };
      }
      version = raw.version;
    }
    if (!Array.isArray(raw.questions)) {
      return { ok: false, errors: ['Expected a "questions" array at the top level.'] };
    }
    list = raw.questions;
  } else {
    return { ok: false, errors: ['File must contain a JSON object with a "questions" array.'] };
  }

  const questions: Question[] = [];
  const ids = new Set<string>();
  list.forEach((item, i) => {
    const q = validateQuestion(item, i, c);
    if (!q) return;
    if (ids.has(q.id)) {
      c.error(`questions[${i}] has duplicate id "${q.id}".`);
      return;
    }
    ids.add(q.id);
    questions.push(q);
  });

  if (c.errors.length) {
    const extra = c.errors.length - MAX_REPORTED_ERRORS;
    return {
      ok: false,
      errors: extra > 0 ? [...c.errors.slice(0, MAX_REPORTED_ERRORS), `…and ${extra} more error(s).`] : c.errors,
    };
  }
  return { ok: true, questions, warnings: c.warnings, version };
}

export function parseJsonText(text: string): ValidationResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    return { ok: false, errors: [`Invalid JSON: ${err instanceof Error ? err.message : 'could not parse file.'}`] };
  }
  return validatePayload(raw);
}
