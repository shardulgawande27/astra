import { defineVisualizer, TraceBuilder } from '../builder';
import { MAX_STRING_LENGTH } from '../parse';
import type { ArrayState, CellTone, StackState } from '../types';

const code = `function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
    } else {
      if (stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;
}`;

const PAIRS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
const OPEN = new Set(['(', '[', '{']);

export const validParentheses = defineVisualizer<{ s: string }>({
  id: 'stack-valid-parentheses',
  name: 'Stack — Valid Parentheses',
  pattern: 'Stack',
  summary: 'Push opening brackets; every closing bracket must pop its matching opener.',
  code,
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(n)',
  keywords: ['parentheses', 'brackets', 'stack', 'valid', 'balanced'],
  fields: [{ key: 's', label: 's', kind: 'string', placeholder: '({[]})', help: 'Only the characters ( ) [ ] { }' }],
  defaultInput: { s: '({[]})' },

  parse(raw) {
    const s = (raw.s ?? '').replace(/\s+/g, '');
    if (!s) return { ok: false, errors: ['s must contain at least one bracket.'] };
    if (s.length > MAX_STRING_LENGTH) return { ok: false, errors: [`s can have at most ${MAX_STRING_LENGTH} characters.`] };
    const bad = [...s].find((c) => !OPEN.has(c) && !(c in PAIRS));
    if (bad) return { ok: false, errors: [`"${bad}" is not a bracket. Use only ( ) [ ] { }.`] };
    return { ok: true, value: { s } };
  },

  generate({ s }) {
    const t = new TraceBuilder();
    const chars = [...s];
    const stack: string[] = [];

    const array = (i: number | null, tone: CellTone = 'active'): ArrayState => {
      const tones: Record<number, CellTone> = {};
      if (i !== null) {
        for (let x = 0; x < i; x++) tones[x] = 'eliminated';
        tones[i] = tone;
      }
      return { label: 's', values: chars, pointers: i === null ? [] : [{ name: 'ch', index: i }], tones };
    };
    const stackState = (op: StackState['op'] = null): StackState => ({ label: 'stack', items: [...stack], op });

    t.push({
      line: 1,
      title: 'Start',
      explanation: `Check whether "${s}" is balanced.`,
      vars: { 's.length': chars.length },
      array: array(null),
    });
    t.push({
      line: 2,
      title: 'Create stack',
      explanation: 'An empty stack will hold opening brackets that are waiting for a match.',
      vars: { 'stack.length': 0 },
      array: array(null),
      stack: stackState(),
    });
    t.push({
      line: 3,
      title: 'Pairs lookup',
      explanation: 'pairs maps each closing bracket to the opener it needs.',
      vars: { 'stack.length': 0 },
      array: array(null),
      stack: stackState(),
    });

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      t.push({
        line: 4,
        title: `ch = '${ch}'`,
        explanation: `Read character ${i}: '${ch}'.`,
        vars: { i, ch, 'stack.length': stack.length },
        array: array(i),
        stack: stackState(),
      });

      const isOpen = OPEN.has(ch);
      t.push({
        line: 5,
        title: isOpen ? 'Opening bracket' : 'Closing bracket',
        explanation: isOpen ? `'${ch}' opens a group.` : `'${ch}' closes a group, so it must match the top of the stack.`,
        vars: { i, ch, 'stack.length': stack.length },
        array: array(i, 'compare'),
        stack: stackState(),
        comparison: { expression: `'${ch}' is an opening bracket`, result: isOpen },
      });

      if (isOpen) {
        stack.push(ch);
        t.push({
          line: 6,
          title: `push '${ch}'`,
          explanation: `Push '${ch}' onto the stack.`,
          vars: { i, ch, 'stack.length': stack.length },
          array: array(i),
          stack: stackState({ kind: 'push', value: ch }),
        });
        continue;
      }

      const popped = stack.pop();
      const expected = PAIRS[ch];
      const ok = popped === expected;
      t.push({
        line: 8,
        title: ok ? 'Matched' : 'Mismatch',
        explanation:
          popped === undefined
            ? `The stack is empty, so '${ch}' has no opener. Return false.`
            : ok
              ? `Popped '${popped}', which matches '${ch}'.`
              : `Popped '${popped}', but '${ch}' needs '${expected}'. Return false.`,
        vars: { i, ch, popped: popped ?? 'undefined', 'pairs[ch]': expected, 'stack.length': stack.length },
        array: array(i, ok ? 'match' : 'compare'),
        stack: stackState({ kind: 'pop', value: popped ?? 'undefined' }),
        comparison: { expression: `stack.pop() !== pairs['${ch}'] → '${popped ?? 'undefined'}' !== '${expected}'`, result: !ok },
        result: ok ? null : { value: 'false', success: false },
      });
      if (!ok) return t.steps;
    }

    const empty = stack.length === 0;
    t.push({
      line: 11,
      title: empty ? 'Balanced' : 'Unclosed brackets',
      explanation: empty
        ? 'Every opener was matched and the stack is empty. Return true.'
        : `${stack.length} opening bracket(s) were never closed. Return false.`,
      vars: { 'stack.length': stack.length },
      array: array(null),
      stack: stackState(),
      comparison: { expression: `stack.length === 0 → ${stack.length} === 0`, result: empty },
      result: { value: String(empty), success: empty },
    });
    return t.steps;
  },
});
