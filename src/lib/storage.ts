import { EXPORT_VERSION, type AstraExport, type Question, type Settings } from '../types';
import { SAMPLE_QUESTIONS } from '../data/sampleQuestions';
import { validatePayload } from './validation';

export const DATA_KEY = 'astra:data';
export const META_KEY = 'astra:meta';
export const SETTINGS_KEY = 'astra:settings';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface Meta {
  /** Set once sample data has been offered, so deleting samples never brings them back. */
  seeded: boolean;
}

export interface LoadResult {
  questions: Question[];
  seeded: boolean;
  /** Set when stored data was unreadable; the raw value is backed up under `backupKey`. */
  error?: string;
  backupKey?: string;
  /** True when unreadable data could not be backed up; saving would destroy it. */
  readOnly?: boolean;
}

function defaultStore(): KeyValueStore | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readMeta(store: KeyValueStore): Meta {
  try {
    const raw = store.getItem(META_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return { seeded: parsed?.seeded === true };
  } catch {
    return { seeded: false };
  }
}

function writeMeta(store: KeyValueStore, meta: Meta) {
  store.setItem(META_KEY, JSON.stringify(meta));
}

export function loadQuestions(store: KeyValueStore | null = defaultStore()): LoadResult {
  if (!store) return { questions: [], seeded: false, error: 'Browser storage is unavailable. Changes will not persist.' };

  const raw = store.getItem(DATA_KEY);
  if (raw === null) {
    const meta = readMeta(store);
    if (meta.seeded) return { questions: [], seeded: false };
    // First launch: seed samples exactly once.
    const questions = structuredClone(SAMPLE_QUESTIONS);
    saveQuestions(questions, store);
    writeMeta(store, { seeded: true });
    return { questions, seeded: true };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return quarantine(store, raw, 'Saved data is not valid JSON.');
  }
  const result = validatePayload(parsed);
  if (!result.ok) return quarantine(store, raw, result.errors[0]);
  // Existing data implies the user has been here before; never seed over it.
  if (!readMeta(store).seeded) writeMeta(store, { seeded: true });
  return { questions: result.questions, seeded: false };
}

/** Keep unreadable data instead of silently overwriting it on the next save. */
function quarantine(store: KeyValueStore, raw: string, reason: string): LoadResult {
  const backupKey = `astra:data:backup-${Date.now()}`;
  try {
    store.setItem(backupKey, raw);
  } catch {
    // Could not back it up (quota). Leave the original in place and refuse to overwrite it.
    return {
      questions: [],
      seeded: false,
      readOnly: true,
      error: `Saved data could not be loaded (${reason}) and could not be backed up. Saving is disabled to protect it — export or clear it from Settings.`,
    };
  }
  store.removeItem(DATA_KEY);
  writeMeta(store, { seeded: true });
  return {
    questions: [],
    seeded: false,
    error: `Saved data could not be loaded (${reason}). A copy was kept in localStorage under "${backupKey}".`,
    backupKey,
  };
}

export function buildPayload(questions: Question[]): AstraExport {
  return { app: 'astra', version: EXPORT_VERSION, exportedAt: new Date().toISOString(), questions };
}

/** Throws if storage is full or unavailable so callers can surface the error. */
export function saveQuestions(questions: Question[], store: KeyValueStore | null = defaultStore()): void {
  if (!store) throw new Error('Browser storage is unavailable.');
  store.setItem(DATA_KEY, JSON.stringify(buildPayload(questions)));
}

export function storageSizeBytes(store: KeyValueStore | null = defaultStore()): number {
  const raw = store?.getItem(DATA_KEY);
  return raw ? new Blob([raw]).size : 0;
}

export function loadSettings(store: KeyValueStore | null = defaultStore()): Settings {
  try {
    const parsed = JSON.parse(store?.getItem(SETTINGS_KEY) ?? '{}');
    return { theme: parsed.theme === 'light' ? 'light' : 'dark' };
  } catch {
    return { theme: 'dark' };
  }
}

export function saveSettings(settings: Settings, store: KeyValueStore | null = defaultStore()): void {
  try {
    store?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* non-critical */
  }
}
