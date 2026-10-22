import { describe, expect, it } from 'vitest';
import { getVisualizer, suggestVisualizers, VISUALIZERS } from './registry';
import type { TraceStep } from './types';

function run(id: string, input: Record<string, string>): TraceStep[] {
  const v = getVisualizer(id);
  if (!v) throw new Error(`missing visualizer ${id}`);
  const res = v.run(input);
  if (!res.ok) throw new Error(res.errors.join('; '));
  return res.steps;
}

const last = (steps: TraceStep[]) => steps[steps.length - 1];
const lineCount = (code: string) => code.split('\n').length;

describe('registry', () => {
  it('has unique ids', () => {
    expect(new Set(VISUALIZERS.map((v) => v.id)).size).toBe(VISUALIZERS.length);
  });

  it.each(VISUALIZERS.map((v) => [v.id, v]))('%s: default input runs and every step points at a real code line', (_id, v) => {
    const res = v.run(v.defaultInput);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const lines = lineCount(v.code);
    expect(res.steps.length).toBeGreaterThan(2);
    for (const s of res.steps) {
      expect(s.line).toBeGreaterThanOrEqual(1);
      expect(s.line).toBeLessThanOrEqual(lines);
      expect(s.explanation.length).toBeGreaterThan(0);
    }
    expect(last(res.steps).result).toBeTruthy();
  });

  it('suggests by pattern before incidental keywords', () => {
    expect(suggestVisualizers('Min Stack stack design Store (value, minSoFar) pairs')[0].pattern).toBe('Stack');
    expect(suggestVisualizers('Two Sum Arrays & Hashing hash map')[0].id).toBe('two-sum-hashmap');
    expect(suggestVisualizers('Longest Substring Sliding Window')[0].id).toBe('sliding-window-max-sum');
    expect(suggestVisualizers('Merge Intervals')).toEqual([]);
  });

  it.each(VISUALIZERS.map((v) => [v.id, v]))('%s: is deterministic', (_id, v) => {
    expect(v.run(v.defaultInput)).toEqual(v.run(v.defaultInput));
  });
});

describe('Two Sum — hash map', () => {
  const steps = run('two-sum-hashmap', { nums: '2, 7, 11, 15', target: '9' });

  it('returns [0, 1] for [2,7,11,15], 9', () => {
    expect(last(steps).result).toEqual({ value: '[0, 1]', success: true });
    expect(last(steps).line).toBe(6);
  });

  it('records the map write of 2 → 0 and the hit on 2', () => {
    const set = steps.find((s) => s.map?.highlight?.kind === 'set');
    expect(set?.map?.entries).toEqual([{ key: '2', value: '0' }]);
    expect(set?.line).toBe(8);
    const hit = steps.find((s) => s.map?.highlight?.kind === 'hit');
    expect(hit?.map?.highlight?.key).toBe('2');
    expect(hit?.comparison).toEqual({ expression: 'seen.has(2)', result: true });
  });

  it('marks both answer indices as matched on the final step', () => {
    expect(last(steps).array?.tones).toMatchObject({ 0: 'match', 1: 'match' });
  });

  it('flags changed variables relative to the previous step', () => {
    const complementStep = steps.find((s) => s.line === 4)!;
    expect(complementStep.variables.find((v) => v.name === 'complement')?.changed).toBe(true);
    expect(complementStep.variables.find((v) => v.name === 'target')?.changed).toBe(false);
  });

  it('handles duplicates like [3,3]', () => {
    expect(last(run('two-sum-hashmap', { nums: '3, 3', target: '6' })).result?.value).toBe('[0, 1]');
  });

  it('reports no pair', () => {
    expect(last(run('two-sum-hashmap', { nums: '1, 2', target: '10' })).result).toEqual({ value: '[]', success: false });
  });
});

describe('Two Sum — brute force', () => {
  it('returns [0, 1] and compares nums[0] + nums[1]', () => {
    const steps = run('two-sum-brute', { nums: '[2,7,11,15]', target: '9' });
    expect(last(steps).result?.value).toBe('[0, 1]');
    const cmp = steps.filter((s) => s.comparison);
    expect(cmp).toHaveLength(1);
    expect(cmp[0].comparison?.result).toBe(true);
  });

  it('checks every pair when there is no answer', () => {
    const steps = run('two-sum-brute', { nums: '1, 2, 3, 4', target: '100' });
    expect(steps.filter((s) => s.line === 4)).toHaveLength(6);
    expect(last(steps).line).toBe(9);
  });

  it('rejects invalid input', () => {
    const res = getVisualizer('two-sum-brute')!.run({ nums: '1, x', target: '' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.length).toBe(2);
  });
});

describe('Binary Search', () => {
  it('finds 9 at index 4', () => {
    expect(last(run('binary-search', { nums: '-1,0,3,5,9,12', target: '9' })).result?.value).toBe('4');
  });
  it('returns -1 when missing', () => {
    const steps = run('binary-search', { nums: '-1,0,3,5,9,12', target: '2' });
    expect(last(steps).result).toEqual({ value: '-1', success: false });
  });
  it('requires sorted input', () => {
    expect(getVisualizer('binary-search')!.run({ nums: '3, 1, 2', target: '1' }).ok).toBe(false);
  });
});

describe('Two Pointers', () => {
  it('finds [2, 3] for target 10', () => {
    expect(last(run('two-pointers-pair-sum', { nums: '1,3,4,6,8,11', target: '10' })).result?.value).toBe('[2, 3]');
  });
});

describe('Sliding Window', () => {
  it('max sum of size 3 is 9 with best window [2..4]', () => {
    const steps = run('sliding-window-max-sum', { nums: '2,1,5,1,3,2', k: '3' });
    expect(last(steps).result?.value).toBe('9');
    expect(last(steps).array?.range).toMatchObject({ start: 2, end: 4 });
  });
  it('validates k', () => {
    expect(getVisualizer('sliding-window-max-sum')!.run({ nums: '1,2', k: '5' }).ok).toBe(false);
  });
});

describe('Stack visualizers', () => {
  it('valid parentheses', () => {
    expect(last(run('stack-valid-parentheses', { s: '({[]})' })).result?.value).toBe('true');
    expect(last(run('stack-valid-parentheses', { s: '(]' })).result?.value).toBe('false');
    expect(last(run('stack-valid-parentheses', { s: ')' })).result?.value).toBe('false');
    expect(last(run('stack-valid-parentheses', { s: '((' })).result?.value).toBe('false');
  });

  it('stack operations output', () => {
    const steps = run('stack-operations', { ops: 'push 1, push 2, peek, pop, push 3, pop, pop, pop' });
    expect(last(steps).output).toEqual(['2', '2', '3', '1', 'null']);
    expect(last(steps).stack?.items).toEqual([]);
  });
});
