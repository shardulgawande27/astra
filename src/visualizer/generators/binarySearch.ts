import { defineVisualizer, TraceBuilder } from '../builder';
import { formatArray, isSortedAscending, parseInteger, parseNumberArray } from '../parse';
import type { ArrayState, CellTone } from '../types';

const code = `function binarySearch(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return -1;
}`;

interface Input {
  nums: number[];
  target: number;
}

export const binarySearch = defineVisualizer<Input>({
  id: 'binary-search',
  name: 'Binary Search',
  pattern: 'Binary Search',
  summary: 'Halve the search range [lo, hi] each step by comparing the middle element to the target.',
  code,
  timeComplexity: 'O(log n)',
  spaceComplexity: 'O(1)',
  keywords: ['binary search', 'sorted', 'search', 'mid'],
  fields: [
    { key: 'nums', label: 'nums (sorted ascending)', kind: 'numberArray', placeholder: '-1, 0, 3, 5, 9, 12' },
    { key: 'target', label: 'target', kind: 'number', placeholder: '9' },
  ],
  defaultInput: { nums: '-1, 0, 3, 5, 9, 12', target: '9' },

  parse(raw) {
    const nums = parseNumberArray(raw.nums, 'nums');
    const target = parseInteger(raw.target, 'target');
    const errors = [nums.error, target.error].filter((e): e is string => !!e);
    if (!nums.error && !isSortedAscending(nums.value!)) errors.push('nums must be sorted in ascending order for binary search.');
    if (errors.length) return { ok: false, errors };
    return { ok: true, value: { nums: nums.value!, target: target.value! } };
  },

  generate({ nums, target }) {
    const t = new TraceBuilder();
    const n = nums.length;

    const array = (lo: number, hi: number, mid: number | null, midTone: CellTone = 'active'): ArrayState => {
      const tones: Record<number, CellTone> = {};
      for (let k = 0; k < n; k++) if (k < lo || k > hi) tones[k] = 'eliminated';
      if (mid !== null) tones[mid] = midTone;
      const pointers = [
        { name: 'lo', index: lo },
        { name: 'hi', index: hi },
      ].filter((p) => p.index >= 0 && p.index < n);
      if (mid !== null) pointers.push({ name: 'mid', index: mid });
      return {
        label: 'nums',
        values: nums,
        pointers,
        tones,
        range: lo <= hi ? { start: lo, end: hi, label: 'search range' } : null,
      };
    };

    t.push({
      line: 1,
      title: 'Start',
      explanation: `Search for ${target} in the sorted array ${formatArray(nums)}.`,
      vars: { target },
      array: { label: 'nums', values: nums, pointers: [], tones: {} },
    });

    let lo = 0;
    let hi = n - 1;
    t.push({
      line: 2,
      title: 'Initialize bounds',
      explanation: `The whole array is the search range: lo = 0, hi = ${hi}.`,
      vars: { target, lo, hi },
      array: array(lo, hi, null),
    });

    for (;;) {
      const cont = lo <= hi;
      t.push({
        line: 3,
        title: cont ? 'Range not empty' : 'Range empty',
        explanation: cont
          ? `lo (${lo}) <= hi (${hi}), so there are still candidates to check.`
          : `lo (${lo}) > hi (${hi}): the range is empty, the target is not present.`,
        vars: { target, lo, hi },
        array: array(lo, hi, null),
        comparison: { expression: `lo <= hi → ${lo} <= ${hi}`, result: cont },
      });
      if (!cont) break;

      const mid = Math.floor((lo + hi) / 2);
      t.push({
        line: 4,
        title: `mid = ${mid}`,
        explanation: `mid = floor((${lo} + ${hi}) / 2) = ${mid}, and nums[${mid}] = ${nums[mid]}.`,
        vars: { target, lo, hi, mid, 'nums[mid]': nums[mid] },
        array: array(lo, hi, mid),
      });

      const equal = nums[mid] === target;
      t.push({
        line: 5,
        title: equal ? 'Found target' : 'Not equal',
        explanation: equal ? `nums[${mid}] = ${nums[mid]} equals the target.` : `nums[${mid}] = ${nums[mid]} is not ${target}.`,
        vars: { target, lo, hi, mid, 'nums[mid]': nums[mid] },
        array: array(lo, hi, mid, equal ? 'match' : 'compare'),
        comparison: { expression: `nums[${mid}] === target → ${nums[mid]} === ${target}`, result: equal },
      });
      if (equal) {
        t.push({
          line: 6,
          title: 'Return index',
          explanation: `Return ${mid}.`,
          vars: { target, lo, hi, mid, 'nums[mid]': nums[mid] },
          array: array(lo, hi, mid, 'match'),
          result: { value: String(mid), success: true },
        });
        return t.steps;
      }

      const less = nums[mid] < target;
      t.push({
        line: 7,
        title: less ? 'Go right' : 'Go left',
        explanation: less
          ? `${nums[mid]} < ${target}, so the target can only be to the right of mid.`
          : `${nums[mid]} > ${target}, so the target can only be to the left of mid.`,
        vars: { target, lo, hi, mid, 'nums[mid]': nums[mid] },
        array: array(lo, hi, mid, 'compare'),
        comparison: { expression: `nums[${mid}] < target → ${nums[mid]} < ${target}`, result: less },
      });

      if (less) {
        lo = mid + 1;
        t.push({
          line: 8,
          title: `lo = ${lo}`,
          explanation: `Discard the left half: lo moves to mid + 1 = ${lo}.`,
          vars: { target, lo, hi, mid, 'nums[mid]': nums[mid] },
          array: array(lo, hi, null),
        });
      } else {
        hi = mid - 1;
        t.push({
          line: 10,
          title: `hi = ${hi}`,
          explanation: `Discard the right half: hi moves to mid - 1 = ${hi}.`,
          vars: { target, lo, hi, mid, 'nums[mid]': nums[mid] },
          array: array(lo, hi, null),
        });
      }
    }

    t.push({
      line: 13,
      title: 'Not found',
      explanation: `${target} is not in the array. Return -1.`,
      vars: { target, lo, hi },
      array: array(lo, hi, null),
      result: { value: '-1', success: false },
    });
    return t.steps;
  },
});
