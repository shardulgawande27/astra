import { defineVisualizer, TraceBuilder } from '../builder';
import { formatArray, parseInteger, parseNumberArray } from '../parse';
import type { ArrayState, CellTone, MapState } from '../types';

const code = `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`;

interface Input {
  nums: number[];
  target: number;
}

export const twoSumHashMap = defineVisualizer<Input>({
  id: 'two-sum-hashmap',
  name: 'Two Sum — Hash Map',
  pattern: 'Hash Map',
  summary: 'Store each value → index; for every element, look up the complement in one pass.',
  code,
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(n)',
  keywords: ['two sum', 'hash', 'map', 'complement'],
  fields: [
    { key: 'nums', label: 'nums', kind: 'numberArray', placeholder: '2, 7, 11, 15' },
    { key: 'target', label: 'target', kind: 'number', placeholder: '9' },
  ],
  defaultInput: { nums: '2, 7, 11, 15', target: '9' },

  parse(raw) {
    const nums = parseNumberArray(raw.nums, 'nums');
    const target = parseInteger(raw.target, 'target');
    const errors = [nums.error, target.error].filter((e): e is string => !!e);
    if (errors.length) return { ok: false, errors };
    return { ok: true, value: { nums: nums.value!, target: target.value! } };
  },

  generate({ nums, target }) {
    const t = new TraceBuilder();
    const seen = new Map<number, number>();
    const n = nums.length;

    const array = (i: number | null, tones: Record<number, CellTone> = {}): ArrayState => ({
      label: 'nums',
      values: nums,
      pointers: i === null ? [] : [{ name: 'i', index: i }],
      tones,
    });
    const map = (highlight: MapState['highlight'] = null): MapState => ({
      label: 'seen (value → index)',
      entries: [...seen.entries()].map(([k, v]) => ({ key: String(k), value: String(v) })),
      highlight,
    });

    t.push({
      line: 1,
      title: 'Start',
      explanation: `Call twoSum with nums = ${formatArray(nums)} and target = ${target}.`,
      vars: { target, 'nums.length': n },
      array: array(null),
    });

    t.push({
      line: 2,
      title: 'Create map',
      explanation: 'Create an empty map "seen" that remembers each value we have visited and its index.',
      vars: { target, 'seen.size': 0 },
      array: array(null),
      map: map(),
    });

    for (let i = 0; i < n; i++) {
      t.push({
        line: 3,
        title: `Loop: i = ${i}`,
        explanation: `Visit index ${i}, where nums[${i}] = ${nums[i]}.`,
        vars: { target, i, 'nums[i]': nums[i], 'seen.size': seen.size },
        array: array(i, { [i]: 'active' }),
        map: map(),
      });

      const complement = target - nums[i];
      t.push({
        line: 4,
        title: 'Compute complement',
        explanation: `We need a value that adds to ${nums[i]} to make ${target}: complement = ${target} - ${nums[i]} = ${complement}.`,
        vars: { target, i, 'nums[i]': nums[i], complement, 'seen.size': seen.size },
        array: array(i, { [i]: 'active' }),
        map: map(),
      });

      const has = seen.has(complement);
      const j = has ? seen.get(complement)! : -1;
      t.push({
        line: 5,
        title: has ? 'Complement found' : 'Complement not in map',
        explanation: has
          ? `seen has ${complement} at index ${j}, so nums[${j}] + nums[${i}] = ${complement} + ${nums[i]} = ${target}.`
          : `seen does not contain ${complement} yet, so no earlier element pairs with nums[${i}].`,
        vars: { target, i, 'nums[i]': nums[i], complement, 'seen.size': seen.size },
        array: array(i, has ? { [j]: 'match', [i]: 'match' } : { [i]: 'active' }),
        map: map({ key: String(complement), kind: has ? 'hit' : 'miss' }),
        comparison: { expression: `seen.has(${complement})`, result: has },
      });

      if (has) {
        t.push({
          line: 6,
          title: 'Return result',
          explanation: `Return [seen.get(${complement}), i] = [${j}, ${i}].`,
          vars: { target, i, 'nums[i]': nums[i], complement, 'seen.get(complement)': j },
          array: array(i, { [j]: 'match', [i]: 'match' }),
          map: map({ key: String(complement), kind: 'hit' }),
          result: { value: `[${j}, ${i}]`, success: true },
        });
        return t.steps;
      }

      const overwrite = seen.has(nums[i]);
      seen.set(nums[i], i);
      t.push({
        line: 8,
        title: `Store ${nums[i]} → ${i}`,
        explanation: overwrite
          ? `Update seen: ${nums[i]} now maps to index ${i}.`
          : `Remember that value ${nums[i]} lives at index ${i}, so a later element can pair with it.`,
        vars: { target, i, 'nums[i]': nums[i], complement, 'seen.size': seen.size },
        array: array(i, { [i]: 'active' }),
        map: map({ key: String(nums[i]), kind: 'set' }),
      });
    }

    t.push({
      line: 10,
      title: 'No pair found',
      explanation: `The loop finished without finding a complement. Return an empty array.`,
      vars: { target, 'seen.size': seen.size },
      array: array(null),
      map: map(),
      result: { value: '[]', success: false },
    });
    return t.steps;
  },
});
