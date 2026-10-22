export const MAX_ARRAY_LENGTH = 25;
export const MAX_STRING_LENGTH = 40;
const MAX_ABS_VALUE = 1_000_000;

type Parsed<T> = { value: T; error?: undefined } | { value?: undefined; error: string };

/** Accepts `2, 7, 11, 15`, `[2,7,11,15]` or space-separated values. */
export function parseNumberArray(raw: string | undefined, label: string): Parsed<number[]> {
  const text = (raw ?? '').trim().replace(/^\[/, '').replace(/\]$/, '').trim();
  if (!text) return { error: `${label} must contain at least one number.` };
  const parts = text.split(/[\s,]+/).filter(Boolean);
  const values: number[] = [];
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      return { error: `${label}: "${part}" is not an integer.` };
    }
    if (Math.abs(n) > MAX_ABS_VALUE) return { error: `${label}: values must be between -${MAX_ABS_VALUE} and ${MAX_ABS_VALUE}.` };
    values.push(n);
  }
  if (values.length > MAX_ARRAY_LENGTH) {
    return { error: `${label} can have at most ${MAX_ARRAY_LENGTH} elements for visualization.` };
  }
  return { value: values };
}

export function parseInteger(raw: string | undefined, label: string): Parsed<number> {
  const text = (raw ?? '').trim();
  if (!text) return { error: `${label} is required.` };
  const n = Number(text);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return { error: `${label} must be an integer.` };
  if (Math.abs(n) > MAX_ABS_VALUE * 2) return { error: `${label} is out of range.` };
  return { value: n };
}

export function isSortedAscending(values: number[]): boolean {
  for (let i = 1; i < values.length; i++) if (values[i] < values[i - 1]) return false;
  return true;
}

export function formatArray(values: (number | string)[]): string {
  return `[${values.join(', ')}]`;
}
