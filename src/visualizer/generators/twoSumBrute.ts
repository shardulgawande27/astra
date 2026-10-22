import { defineVisualizer, TraceBuilder } from '../builder';
import { formatArray, parseInteger, parseNumberArray } from '../parse';
import type { ArrayState, CellTone } from '../types';

const code = `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`;

interface Input {
  nums: number[];
  target: number;
}

export const twoSumBrute = defineVisualizer<Input>({
  id: 'two-sum-brute',
  name: 'Two Sum — Brute Force',
  pattern: 'Nested Loops',
  summary: 'Check every pair (i, j) with i < j until one adds up to the target.',
  code,
  timeComplexity: 'O(n²)',
  spaceComplexity: 'O(1)',
  keywords: ['two sum', 'pair', 'brute'],
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
    const n = nums.length;
    const array = (pointers: ArrayState['pointers'], tones: Record<number, CellTone>): ArrayState => ({
      label: 'nums',
      values: nums,
      pointers,
      tones,
    });

    t.push({
      line: 1,
      title: 'Start',
      explanation: `Call twoSum with nums = ${formatArray(nums)} and target = ${target}. We will try every pair of indices.`,
      vars: { target, 'nums.length': n },
      array: array([], {}),
    });

    for (let i = 0; i < n; i++) {
      t.push({
        line: 2,
        title: `Outer loop: i = ${i}`,
        explanation: `Fix nums[${i}] = ${nums[i]} as the first number of the pair.`,
        vars: { target, i, 'nums[i]': nums[i] },
        array: array([{ name: 'i', index: i }], { [i]: 'active' }),
      });

      for (let j = i + 1; j < n; j++) {
        const pointers = [
          { name: 'i', index: i },
          { name: 'j', index: j },
        ];
        t.push({
          line: 3,
          title: `Inner loop: j = ${j}`,
          explanation: `Pair nums[${i}] = ${nums[i]} with nums[${j}] = ${nums[j]}.`,
          vars: { target, i, j, 'nums[i]': nums[i], 'nums[j]': nums[j] },
          array: array(pointers, { [i]: 'active', [j]: 'compare' }),
        });

        const sum = nums[i] + nums[j];
        const found = sum === target;
        t.push({
          line: 4,
          title: found ? 'Match' : 'No match',
          explanation: found
            ? `${nums[i]} + ${nums[j]} = ${sum}, which equals the target ${target}.`
            : `${nums[i]} + ${nums[j]} = ${sum}, which is not ${target}. Move j forward.`,
          vars: { target, i, j, 'nums[i]': nums[i], 'nums[j]': nums[j], sum },
          array: array(pointers, { [i]: found ? 'match' : 'active', [j]: found ? 'match' : 'compare' }),
          comparison: { expression: `nums[${i}] + nums[${j}] = ${nums[i]} + ${nums[j]} = ${sum} === ${target}`, result: found },
        });

        if (found) {
          t.push({
            line: 5,
            title: 'Return result',
            explanation: `Return the indices [${i}, ${j}].`,
            vars: { target, i, j, 'nums[i]': nums[i], 'nums[j]': nums[j], sum },
            array: array(pointers, { [i]: 'match', [j]: 'match' }),
            result: { value: `[${i}, ${j}]`, success: true },
          });
          return t.steps;
        }
      }
    }

    t.push({
      line: 9,
      title: 'No pair found',
      explanation: `Every pair was checked and none adds up to ${target}. Return an empty array.`,
      vars: { target },
      array: array([], {}),
      result: { value: '[]', success: false },
    });
    return t.steps;
  },
});
