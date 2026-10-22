import type { Question } from '../types';
import { buildPayload } from './storage';

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'question'
  );
}

const dateStamp = () => new Date().toISOString().slice(0, 10);

export function exportAll(questions: Question[]): void {
  downloadJson(`astra-backup-${dateStamp()}.json`, buildPayload(questions));
}

export function exportQuestion(question: Question): void {
  downloadJson(`astra-${slugify(question.title)}.json`, buildPayload([question]));
}
