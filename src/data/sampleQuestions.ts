import type { Question, Solution } from '../types';

const T0 = Date.parse('2026-09-01T09:00:00.000Z');
/** Deterministic timestamps so "recently added" ordering is stable for samples. */
const day = (n: number) => new Date(T0 + n * 86_400_000).toISOString();

function sol(partial: Partial<Solution> & Pick<Solution, 'id' | 'approach' | 'title' | 'code'>, at: string): Solution {
  return {
    explanation: '',
    intuition: '',
    timeComplexity: '',
    spaceComplexity: '',
    tradeoffs: '',
    notes: '',
    dryRun: null,
    createdAt: at,
    updatedAt: at,
    ...partial,
  };
}

function question(partial: Partial<Question> & Pick<Question, 'id' | 'title' | 'category' | 'difficulty'>, at: string): Question {
  return {
    statement: '',
    topic: '',
    tags: [],
    examples: [],
    constraints: [],
    sourceUrl: '',
    notes: '',
    edgeCases: [],
    status: 'Not Started',
    bookmarked: false,
    solutions: [],
    createdAt: at,
    updatedAt: at,
    ...partial,
  };
}

export const SAMPLE_QUESTIONS: Question[] = [
  question(
    {
      id: 'sample-two-sum',
      title: 'Two Sum',
      category: 'DSA',
      topic: 'Arrays & Hashing',
      difficulty: 'Easy',
      tags: ['array', 'hash map', 'blind-75'],
      status: 'Solved',
      bookmarked: true,
      sourceUrl: 'https://leetcode.com/problems/two-sum/',
      statement:
        'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
      examples: [
        { id: 'sample-two-sum-ex1', input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9.' },
        { id: 'sample-two-sum-ex2', input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: '' },
        { id: 'sample-two-sum-ex3', input: 'nums = [3,3], target = 6', output: '[0,1]', explanation: '' },
      ],
      constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
      edgeCases: ['Duplicate values, e.g. [3,3] with target 6', 'Negative numbers', 'Answer uses the last element'],
      notes: 'Classic warm-up. Interviewers usually expect the brute force first, then the hash-map optimization. Mention that checking before inserting avoids using the same element twice.',
      solutions: [
        sol(
          {
            id: 'sample-two-sum-brute',
            approach: 'Brute Force',
            title: 'Check every pair',
            code: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`,
            explanation: 'Try every pair (i, j) with j > i and return the first pair whose sum equals the target.',
            intuition: 'If we don’t know anything about the array, the only way to be sure is to look at all pairs.',
            timeComplexity: 'O(n²)',
            spaceComplexity: 'O(1)',
            tradeoffs: 'No extra memory, but quadratic time is too slow for n = 10^4 in tight limits.',
            dryRun: { visualizerId: 'two-sum-brute', input: { nums: '2, 7, 11, 15', target: '9' } },
          },
          day(0),
        ),
        sol(
          {
            id: 'sample-two-sum-hash',
            approach: 'Optimal',
            title: 'One-pass hash map',
            code: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
            explanation: 'Walk the array once. For each element, check whether its complement (target − value) was seen earlier; if so, return both indices. Otherwise remember value → index.',
            intuition: 'Turning “find a partner” into “look up a key” trades memory for constant-time lookups.',
            timeComplexity: 'O(n)',
            spaceComplexity: 'O(n)',
            tradeoffs: 'Linear time but uses O(n) extra memory for the map.',
            notes: 'Check before set — otherwise [3] with target 6 would match itself.',
            dryRun: { visualizerId: 'two-sum-hashmap', input: { nums: '2, 7, 11, 15', target: '9' } },
          },
          day(0),
        ),
      ],
    },
    day(0),
  ),
  question(
    {
      id: 'sample-binary-search',
      title: 'Binary Search',
      category: 'DSA',
      topic: 'Binary Search',
      difficulty: 'Easy',
      tags: ['array', 'binary search'],
      status: 'Solved',
      sourceUrl: 'https://leetcode.com/problems/binary-search/',
      statement:
        'Given an array of integers `nums` sorted in ascending order and an integer `target`, return the index of `target` if it exists, otherwise return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.',
      examples: [
        { id: 'sample-bs-ex1', input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists in nums and its index is 4.' },
        { id: 'sample-bs-ex2', input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist in nums.' },
      ],
      constraints: ['1 <= nums.length <= 10^4', 'All integers in nums are unique.', 'nums is sorted in ascending order.'],
      edgeCases: ['Single element', 'Target smaller than every element', 'Target larger than every element'],
      notes: 'Use `lo <= hi` with `hi = n - 1` (closed interval). Off-by-one bugs come from mixing closed and half-open intervals.',
      solutions: [
        sol(
          {
            id: 'sample-binary-search-iter',
            approach: 'Optimal',
            title: 'Iterative, closed interval',
            code: `function binarySearch(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
            explanation: 'Keep the invariant “if target exists, it is in [lo, hi]”. Compare the middle element and discard the half that cannot contain the target.',
            intuition: 'Sorted order lets one comparison rule out half of the remaining candidates.',
            timeComplexity: 'O(log n)',
            spaceComplexity: 'O(1)',
            tradeoffs: 'Requires sorted input.',
            dryRun: { visualizerId: 'binary-search', input: { nums: '-1, 0, 3, 5, 9, 12', target: '9' } },
          },
          day(1),
        ),
      ],
    },
    day(1),
  ),
  question(
    {
      id: 'sample-pair-sum-sorted',
      title: 'Pair Sum in a Sorted Array',
      category: 'DSA',
      topic: 'Two Pointers',
      difficulty: 'Medium',
      tags: ['array', 'two pointers', 'sorted'],
      status: 'Solved',
      sourceUrl: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/',
      statement:
        'Given an array `nums` sorted in non-decreasing order and an integer `target`, return the 0-based indices [left, right] of two numbers that add up to `target`, or [] if no such pair exists. Use only constant extra space.',
      examples: [{ id: 'sample-ps-ex1', input: 'nums = [1,3,4,6,8,11], target = 10', output: '[2,3]', explanation: '4 + 6 = 10' }],
      constraints: ['2 <= nums.length <= 3 * 10^4', 'nums is sorted in non-decreasing order.'],
      edgeCases: ['No valid pair', 'Pair at the very ends of the array'],
      notes: 'LeetCode 167 uses 1-based indices — add 1 to both when submitting there.',
      solutions: [
        sol(
          {
            id: 'sample-pair-sum-hash',
            approach: 'Better',
            title: 'Hash map (ignores sortedness)',
            code: `function pairSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
            explanation: 'Same as Two Sum: store value → index and look up complements.',
            timeComplexity: 'O(n)',
            spaceComplexity: 'O(n)',
            tradeoffs: 'Correct and linear, but violates the constant-space requirement.',
          },
          day(2),
        ),
        sol(
          {
            id: 'sample-pair-sum-pointers',
            approach: 'Optimal',
            title: 'Two pointers from both ends',
            code: `function pairSum(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [];
}`,
            explanation: 'Start with the smallest and largest values. If the sum is too small, the only way to grow it is to move left; if too large, move right.',
            intuition: 'Each move discards a value that can never be part of the answer.',
            timeComplexity: 'O(n)',
            spaceComplexity: 'O(1)',
            tradeoffs: 'Needs sorted input; constant memory.',
            dryRun: { visualizerId: 'two-pointers-pair-sum', input: { nums: '1, 3, 4, 6, 8, 11', target: '10' } },
          },
          day(2),
        ),
      ],
    },
    day(2),
  ),
  question(
    {
      id: 'sample-max-sum-k',
      title: 'Maximum Sum Subarray of Size K',
      category: 'DSA',
      topic: 'Sliding Window',
      difficulty: 'Easy',
      tags: ['array', 'sliding window'],
      status: 'Solved',
      statement: 'Given an array of integers `nums` and an integer `k`, find the maximum sum of any contiguous subarray of size `k`.',
      examples: [{ id: 'sample-mk-ex1', input: 'nums = [2,1,5,1,3,2], k = 3', output: '9', explanation: 'Subarray [5,1,3] has the maximum sum 9.' }],
      constraints: ['1 <= k <= nums.length <= 10^5'],
      edgeCases: ['k equals nums.length', 'All negative numbers'],
      solutions: [
        sol(
          {
            id: 'sample-max-sum-k-brute',
            approach: 'Brute Force',
            title: 'Sum every window',
            code: `function maxSumSubarray(nums, k) {
  let best = -Infinity;
  for (let i = 0; i + k <= nums.length; i++) {
    let sum = 0;
    for (let j = i; j < i + k; j++) sum += nums[j];
    best = Math.max(best, sum);
  }
  return best;
}`,
            explanation: 'Recompute the sum of every window from scratch.',
            timeComplexity: 'O(n · k)',
            spaceComplexity: 'O(1)',
            tradeoffs: 'Repeats work: adjacent windows share k − 1 elements.',
          },
          day(3),
        ),
        sol(
          {
            id: 'sample-max-sum-k-window',
            approach: 'Optimal',
            title: 'Fixed sliding window',
            code: `function maxSumSubarray(nums, k) {
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += nums[i];
  let maxSum = windowSum;
  for (let end = k; end < nums.length; end++) {
    windowSum += nums[end] - nums[end - k];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}`,
            explanation: 'Build the first window, then slide: add the entering element and subtract the leaving one.',
            intuition: 'Adjacent windows differ by exactly two elements.',
            timeComplexity: 'O(n)',
            spaceComplexity: 'O(1)',
            dryRun: { visualizerId: 'sliding-window-max-sum', input: { nums: '2, 1, 5, 1, 3, 2', k: '3' } },
          },
          day(3),
        ),
      ],
    },
    day(3),
  ),
  question(
    {
      id: 'sample-valid-parentheses',
      title: 'Valid Parentheses',
      category: 'DSA',
      topic: 'Stack',
      difficulty: 'Easy',
      tags: ['string', 'stack', 'blind-75'],
      status: 'Solved',
      bookmarked: true,
      sourceUrl: 'https://leetcode.com/problems/valid-parentheses/',
      statement:
        'Given a string `s` containing just the characters ( ) { } [ ], determine if the input string is valid.\n\nAn input string is valid if open brackets are closed by the same type of brackets, in the correct order, and every close bracket has a corresponding open bracket.',
      examples: [
        { id: 'sample-vp-ex1', input: 's = "()[]{}"', output: 'true', explanation: '' },
        { id: 'sample-vp-ex2', input: 's = "(]"', output: 'false', explanation: '' },
      ],
      constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only.'],
      edgeCases: ['Starts with a closing bracket', 'Only opening brackets', 'Odd length (can return false early)'],
      solutions: [
        sol(
          {
            id: 'sample-valid-parentheses-stack',
            approach: 'Optimal',
            title: 'Stack of openers',
            code: `function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
    } else if (stack.pop() !== pairs[ch]) {
      return false;
    }
  }
  return stack.length === 0;
}`,
            explanation: 'Push every opener. On a closer, the most recent unmatched opener must be its partner.',
            intuition: 'Brackets nest, so the last opened must be the first closed — LIFO.',
            timeComplexity: 'O(n)',
            spaceComplexity: 'O(n)',
            dryRun: { visualizerId: 'stack-valid-parentheses', input: { s: '({[]})' } },
          },
          day(4),
        ),
      ],
    },
    day(4),
  ),
  question(
    {
      id: 'sample-min-stack',
      title: 'Min Stack',
      category: 'DSA',
      topic: 'Stack',
      difficulty: 'Medium',
      tags: ['stack', 'design'],
      status: 'Attempted',
      sourceUrl: 'https://leetcode.com/problems/min-stack/',
      statement: 'Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.',
      examples: [
        {
          id: 'sample-ms-ex1',
          input: 'push(-2), push(0), push(-3), getMin(), pop(), top(), getMin()',
          output: '-3, 0, -2',
          explanation: '',
        },
      ],
      edgeCases: ['Pushing duplicates of the current minimum', 'pop down to empty and push again'],
      notes: 'This solution has no built-in visualizer — the Stack push/pop visualizer can still be attached to practice the base operations.',
      solutions: [
        sol(
          {
            id: 'sample-min-stack-pairs',
            approach: 'Optimal',
            title: 'Store (value, minSoFar) pairs',
            code: `class MinStack {
  constructor() {
    this.stack = [];
  }
  push(val) {
    const min = this.stack.length ? Math.min(val, this.getMin()) : val;
    this.stack.push([val, min]);
  }
  pop() {
    this.stack.pop();
  }
  top() {
    return this.stack[this.stack.length - 1][0];
  }
  getMin() {
    return this.stack[this.stack.length - 1][1];
  }
}`,
            explanation: 'Each entry remembers the minimum of the stack at the time it was pushed.',
            timeComplexity: 'O(1) per operation',
            spaceComplexity: 'O(n)',
            tradeoffs: 'Doubles memory; a separate min-stack that only stores new minimums can save space.',
          },
          day(5),
        ),
      ],
    },
    day(5),
  ),
  question(
    {
      id: 'sample-longest-substring',
      title: 'Longest Substring Without Repeating Characters',
      category: 'DSA',
      topic: 'Sliding Window',
      difficulty: 'Medium',
      tags: ['string', 'sliding window', 'hash map', 'blind-75'],
      status: 'Not Started',
      sourceUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
      statement: 'Given a string `s`, find the length of the longest substring without repeating characters.',
      examples: [
        { id: 'sample-ls-ex1', input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc".' },
        { id: 'sample-ls-ex2', input: 's = "bbbbb"', output: '1', explanation: '' },
      ],
      constraints: ['0 <= s.length <= 5 * 10^4'],
      edgeCases: ['Empty string', 'All identical characters'],
    },
    day(6),
  ),
  question(
    {
      id: 'sample-debounce',
      title: 'Implement debounce',
      category: 'JavaScript',
      topic: 'Functions & Timers',
      difficulty: 'Medium',
      tags: ['closures', 'timers', 'frontend'],
      status: 'Solved',
      bookmarked: true,
      statement:
        'Implement `debounce(fn, wait)` that returns a function which delays invoking `fn` until `wait` milliseconds have elapsed since the last call. The debounced function should preserve `this` and arguments.',
      examples: [
        {
          id: 'sample-db-ex1',
          input: 'const d = debounce(log, 100); d(1); d(2); d(3);',
          output: 'log(3) is called once, ~100ms after the last call',
          explanation: '',
        },
      ],
      edgeCases: ['Calls spaced exactly `wait` apart', 'Preserving `this` when used as a method', 'Cancelling pending calls'],
      notes: 'Follow-ups: leading/trailing options, `cancel()` and `flush()`, and the difference from throttle.',
      solutions: [
        sol(
          {
            id: 'sample-debounce-basic',
            approach: 'Optimal',
            title: 'Timer reset with closure',
            code: `function debounce(fn, wait) {
  let timer = null;
  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  }
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  return debounced;
}`,
            explanation: 'Every call clears the pending timer and schedules a new one, so only the last call in a burst runs.',
            intuition: 'The closure keeps the timer id alive between calls.',
            timeComplexity: 'O(1) per call',
            spaceComplexity: 'O(1)',
            tradeoffs: 'Trailing-edge only; the first call in a burst is delayed.',
          },
          day(7),
        ),
      ],
    },
    day(7),
  ),
  question(
    {
      id: 'sample-closures-counter',
      title: 'Closures: private counter',
      category: 'JavaScript',
      topic: 'Closures & Scope',
      difficulty: 'Easy',
      tags: ['closures', 'scope', 'fundamentals'],
      status: 'Solved',
      statement:
        'Write `createCounter()` that returns an object with `increment`, `decrement`, and `value` methods. The count must not be accessible from outside. Then explain what a closure is.',
      edgeCases: ['Two counters must not share state'],
      notes: 'Classic follow-up: the `var` in a for-loop with setTimeout bug, and how `let` fixes it.',
      solutions: [
        sol(
          {
            id: 'sample-closures-counter-sol',
            approach: 'Optimal',
            title: 'Factory function',
            code: `function createCounter(start = 0) {
  let count = start;
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  };
}

const a = createCounter();
a.increment(); // 1
a.increment(); // 2
console.log(a.value()); // 2`,
            explanation: 'The returned functions close over `count`, which lives on after createCounter returns but cannot be reached directly.',
            intuition: 'A closure is a function bundled with references to the variables in scope where it was created.',
            timeComplexity: 'O(1)',
            spaceComplexity: 'O(1) per counter',
          },
          day(8),
        ),
      ],
    },
    day(8),
  ),
  question(
    {
      id: 'sample-promise-all',
      title: 'Implement Promise.all',
      category: 'JavaScript',
      topic: 'Promises & Async',
      difficulty: 'Medium',
      tags: ['promises', 'async', 'polyfill'],
      status: 'Attempted',
      statement:
        'Implement `promiseAll(iterable)` that behaves like `Promise.all`: resolves with an array of results in input order once every input resolves, and rejects as soon as any input rejects. Non-promise values should be treated as resolved values.',
      edgeCases: ['Empty array resolves to []', 'Mixed promises and plain values', 'Order must match input, not completion time'],
      solutions: [
        sol(
          {
            id: 'sample-promise-all-sol',
            approach: 'Optimal',
            title: 'Counter of settled promises',
            code: `function promiseAll(iterable) {
  const items = Array.from(iterable);
  return new Promise((resolve, reject) => {
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return resolve(results);
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value;
        if (--remaining === 0) resolve(results);
      }, reject);
    });
  });
}`,
            explanation: 'Wrap each value with Promise.resolve, write each result at its own index, and resolve when the counter reaches zero.',
            timeComplexity: 'O(n)',
            spaceComplexity: 'O(n)',
            notes: 'Still need to practise allSettled and race variants.',
          },
          day(9),
        ),
      ],
    },
    day(9),
  ),
  question(
    {
      id: 'sample-useeffect-cleanup',
      title: 'useEffect cleanup and dependencies',
      category: 'React',
      topic: 'Hooks',
      difficulty: 'Medium',
      tags: ['hooks', 'useEffect', 'lifecycle'],
      status: 'Attempted',
      bookmarked: true,
      statement:
        'Explain when a useEffect cleanup function runs, and what happens with an empty, missing, or populated dependency array. Write a component that subscribes to window resize and cleans up correctly.',
      edgeCases: ['StrictMode runs effects twice in development', 'Stale closures when dependencies are missing'],
      notes: 'Cleanup runs before the effect re-runs and on unmount. [] = run once after mount; no array = after every render.',
      solutions: [
        sol(
          {
            id: 'sample-useeffect-cleanup-sol',
            approach: 'Optimal',
            title: 'Resize listener with cleanup',
            code: `function WindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return <p>Width: {width}px</p>;
}`,
            explanation: 'The listener is added after mount and removed on unmount, so no leaks or updates on unmounted components.',
            tradeoffs: 'Fires on every resize event; debounce if the work is expensive.',
          },
          day(10),
        ),
      ],
    },
    day(10),
  ),
  question(
    {
      id: 'sample-use-previous',
      title: 'Build a usePrevious hook',
      category: 'React',
      topic: 'Custom Hooks',
      difficulty: 'Easy',
      tags: ['hooks', 'useRef', 'custom hooks'],
      status: 'Not Started',
      statement: 'Write a `usePrevious(value)` hook that returns the value from the previous render.',
      edgeCases: ['First render should return undefined'],
    },
    day(11),
  ),
];
