import { defineVisualizer, TraceBuilder } from '../builder';
import { formatArray, isSortedAscending, parseInteger, parseNumberArray } from '../parse';
import type { ArrayState, CellTone } from '../types';

const code = `function pairSum(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) {
      return [left, right];
    } else if (sum < target) {
      left++;
    } else {
      right--;
    }
  }
  return [];
}`;

interface Input {
  nums: number[];
  target: number;
}

export const twoPointers = defineVisualizer<Input>({
  id: 'two-pointers-pair-sum',
  name: 'Two Pointers — Pair Sum (sorted)',
  pattern: 'Two Pointers',
  summary: 'Move pointers inward from both ends of a sorted array until their sum hits the target.',
  code,
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(1)',
  keywords: ['two pointers', 'pair', 'sorted', 'two sum ii', 'left right'],
  fields: [
    { key: 'nums', label: 'nums (sorted ascending)', kind: 'numberArray', placeholder: '1, 3, 4, 6, 8, 11' },
    { key: 'target', label: 'target', kind: 'number', placeholder: '10' },
  ],
  defaultInput: { nums: '1, 3, 4, 6, 8, 11', target: '10' },

  parse(raw) {
    const nums = parseNumberArray(raw.nums, 'nums');
    const target = parseInteger(raw.target, 'target');
    const errors = [nums.error, target.error].filter((e): e is string => !!e);
    if (!nums.error && !isSortedAscending(nums.value!)) errors.push('nums must be sorted in ascending order for two pointers.');
    if (errors.length) return { ok: false, errors };
    return { ok: true, value: { nums: nums.value!, target: target.value! } };
  },

  generate({ nums, target }) {
    const t = new TraceBuilder();
    const n = nums.length;

    const array = (left: number, right: number, tone: CellTone = 'active'): ArrayState => {
      const tones: Record<number, CellTone> = {};
      for (let k = 0; k < n; k++) if (k < left || k > right) tones[k] = 'eliminated';
      if (left < n) tones[left] = tone;
      if (right >= 0) tones[right] = tone;
      return {
        label: 'nums',
        values: nums,
        pointers: [
          { name: 'left', index: left },
          { name: 'right', index: right },
        ].filter((p) => p.index >= 0 && p.index < n),
        tones,
      };
    };

    t.push({
      line: 1,
      title: 'Start',
      explanation: `Find two numbers in the sorted array ${formatArray(nums)} that add up to ${target}.`,
      vars: { target },
      array: { label: 'nums', values: nums, pointers: [], tones: {} },
    });

    let left = 0;
    let right = n - 1;
    t.push({
      line: 2,
      title: 'Place pointers',
      explanation: `left starts at the smallest value (index 0), right at the largest (index ${right}).`,
      vars: { target, left, right },
      array: array(left, right),
    });

    for (;;) {
      const cont = left < right;
      t.push({
        line: 3,
        title: cont ? 'Pointers not crossed' : 'Pointers met',
        explanation: cont ? `left (${left}) < right (${right}), keep going.` : `left (${left}) is no longer less than right (${right}). Stop.`,
        vars: { target, left, right },
        array: array(left, right),
        comparison: { expression: `left < right → ${left} < ${right}`, result: cont },
      });
      if (!cont) break;

      const sum = nums[left] + nums[right];
      t.push({
        line: 4,
        title: `sum = ${sum}`,
        explanation: `nums[${left}] + nums[${right}] = ${nums[left]} + ${nums[right]} = ${sum}.`,
        vars: { target, left, right, sum },
        array: array(left, right, 'compare'),
      });

      const equal = sum === target;
      t.push({
        line: 5,
        title: equal ? 'Match' : 'Not equal',
        explanation: equal ? `${sum} equals the target.` : `${sum} is not ${target}.`,
        vars: { target, left, right, sum },
        array: array(left, right, equal ? 'match' : 'compare'),
        comparison: { expression: `sum === target → ${sum} === ${target}`, result: equal },
      });
      if (equal) {
        t.push({
          line: 6,
          title: 'Return result',
          explanation: `Return [${left}, ${right}].`,
          vars: { target, left, right, sum },
          array: array(left, right, 'match'),
          result: { value: `[${left}, ${right}]`, success: true },
        });
        return t.steps;
      }

      const less = sum < target;
      t.push({
        line: 7,
        title: less ? 'Sum too small' : 'Sum too large',
        explanation: less
          ? `${sum} < ${target}: we need a bigger sum, so move left rightwards.`
          : `${sum} > ${target}: we need a smaller sum, so move right leftwards.`,
        vars: { target, left, right, sum },
        array: array(left, right, 'compare'),
        comparison: { expression: `sum < target → ${sum} < ${target}`, result: less },
      });
      if (less) {
        left++;
        t.push({
          line: 8,
          title: `left = ${left}`,
          explanation: `left moves to index ${left}.`,
          vars: { target, left, right, sum },
          array: array(left, right),
        });
      } else {
        right--;
        t.push({
          line: 10,
          title: `right = ${right}`,
          explanation: `right moves to index ${right}.`,
          vars: { target, left, right, sum },
          array: array(left, right),
        });
      }
    }

    t.push({
      line: 13,
      title: 'No pair found',
      explanation: `No two numbers add up to ${target}. Return [].`,
      vars: { target, left, right },
      array: array(left, right),
      result: { value: '[]', success: false },
    });
    return t.steps;
  },
});
