import { defineVisualizer, TraceBuilder } from '../builder';
import { formatArray, parseInteger, parseNumberArray } from '../parse';
import type { ArrayState, CellTone } from '../types';

const code = `function maxSumSubarray(nums, k) {
  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += nums[i];
  }
  let maxSum = windowSum;
  for (let end = k; end < nums.length; end++) {
    windowSum += nums[end] - nums[end - k];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}`;

interface Input {
  nums: number[];
  k: number;
}

export const slidingWindow = defineVisualizer<Input>({
  id: 'sliding-window-max-sum',
  name: 'Sliding Window — Max Sum of Size k',
  pattern: 'Sliding Window',
  summary: 'Slide a fixed window of size k, adding the entering element and removing the leaving one.',
  code,
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(1)',
  keywords: ['sliding window', 'subarray', 'window', 'max sum', 'k'],
  fields: [
    { key: 'nums', label: 'nums', kind: 'numberArray', placeholder: '2, 1, 5, 1, 3, 2' },
    { key: 'k', label: 'k (window size)', kind: 'number', placeholder: '3' },
  ],
  defaultInput: { nums: '2, 1, 5, 1, 3, 2', k: '3' },

  parse(raw) {
    const nums = parseNumberArray(raw.nums, 'nums');
    const k = parseInteger(raw.k, 'k');
    const errors = [nums.error, k.error].filter((e): e is string => !!e);
    if (!nums.error && !k.error && (k.value! < 1 || k.value! > nums.value!.length)) {
      errors.push(`k must be between 1 and ${nums.value!.length} (the length of nums).`);
    }
    if (errors.length) return { ok: false, errors };
    return { ok: true, value: { nums: nums.value!, k: k.value! } };
  },

  generate({ nums, k }) {
    const t = new TraceBuilder();
    const n = nums.length;

    const array = (
      start: number,
      end: number,
      extra: Record<number, CellTone> = {},
      pointers: ArrayState['pointers'] = [],
    ): ArrayState => {
      const tones: Record<number, CellTone> = {};
      for (let x = start; x <= end; x++) tones[x] = 'window';
      return {
        label: 'nums',
        values: nums,
        pointers,
        tones: { ...tones, ...extra },
        range: end >= start ? { start, end, label: `window (size ${end - start + 1})` } : null,
      };
    };

    t.push({
      line: 1,
      title: 'Start',
      explanation: `Find the maximum sum of any ${k} consecutive elements in ${formatArray(nums)}.`,
      vars: { k },
      array: array(0, -1),
    });

    let windowSum = 0;
    t.push({
      line: 2,
      title: 'windowSum = 0',
      explanation: 'Start with an empty window whose sum is 0.',
      vars: { k, windowSum },
      array: array(0, -1),
    });

    for (let i = 0; i < k; i++) {
      t.push({
        line: 3,
        title: `Build window: i = ${i}`,
        explanation: `Add element ${i} to the first window.`,
        vars: { k, windowSum, i },
        array: array(0, i - 1, { [i]: 'active' }, [{ name: 'i', index: i }]),
      });
      windowSum += nums[i];
      t.push({
        line: 4,
        title: `windowSum = ${windowSum}`,
        explanation: `windowSum += nums[${i}] (${nums[i]}) → ${windowSum}.`,
        vars: { k, windowSum, i },
        array: array(0, i, {}, [{ name: 'i', index: i }]),
      });
    }

    let maxSum = windowSum;
    let best: [number, number] = [0, k - 1];
    t.push({
      line: 6,
      title: `maxSum = ${maxSum}`,
      explanation: `The first window [0..${k - 1}] has sum ${windowSum}; it is the best so far.`,
      vars: { k, windowSum, maxSum },
      array: array(0, k - 1),
    });

    for (let end = k; end < n; end++) {
      const start = end - k + 1;
      t.push({
        line: 7,
        title: `Slide: end = ${end}`,
        explanation: `nums[${end}] = ${nums[end]} enters the window and nums[${end - k}] = ${nums[end - k]} leaves it.`,
        vars: { k, windowSum, maxSum, end },
        array: array(start - 1, end - 1, { [end]: 'active', [end - k]: 'eliminated' }, [{ name: 'end', index: end }]),
      });

      const prevSum = windowSum;
      windowSum += nums[end] - nums[end - k];
      t.push({
        line: 8,
        title: `windowSum = ${windowSum}`,
        explanation: `windowSum = ${prevSum} + ${nums[end]} - ${nums[end - k]} = ${windowSum}. Window is now [${start}..${end}].`,
        vars: { k, windowSum, maxSum, end },
        array: array(start, end, { [end - k]: 'eliminated' }, [{ name: 'end', index: end }]),
      });

      const prevMax = maxSum;
      const better = windowSum > prevMax;
      if (better) {
        maxSum = windowSum;
        best = [start, end];
      }
      t.push({
        line: 9,
        title: better ? `New max ${maxSum}` : 'Max unchanged',
        explanation: better
          ? `${windowSum} beats the previous best ${prevMax}, so maxSum becomes ${maxSum}.`
          : `${windowSum} does not beat ${prevMax}, so maxSum stays ${maxSum}.`,
        vars: { k, windowSum, maxSum, end },
        array: array(start, end, {}, [{ name: 'end', index: end }]),
        comparison: { expression: `Math.max(maxSum, windowSum) → max(${prevMax}, ${windowSum}) = ${maxSum}`, result: better },
      });
    }

    const bestTones: Record<number, CellTone> = {};
    for (let x = best[0]; x <= best[1]; x++) bestTones[x] = 'match';
    t.push({
      line: 11,
      title: 'Return maxSum',
      explanation: `The best window is [${best[0]}..${best[1]}] with sum ${maxSum}.`,
      vars: { k, windowSum, maxSum },
      array: { ...array(best[0], best[1], bestTones), range: { start: best[0], end: best[1], label: 'best window' } },
      result: { value: String(maxSum), success: true },
    });
    return t.steps;
  },
});
