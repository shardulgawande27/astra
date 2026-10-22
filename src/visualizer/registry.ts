import { binarySearch } from './generators/binarySearch';
import { slidingWindow } from './generators/slidingWindow';
import { stackOperations } from './generators/stackOperations';
import { twoPointers } from './generators/twoPointers';
import { twoSumBrute } from './generators/twoSumBrute';
import { twoSumHashMap } from './generators/twoSumHashMap';
import { validParentheses } from './generators/validParentheses';
import type { Visualizer } from './types';

export const VISUALIZERS: Visualizer[] = [
  twoSumBrute,
  twoSumHashMap,
  binarySearch,
  twoPointers,
  slidingWindow,
  validParentheses,
  stackOperations,
];

const byId = new Map(VISUALIZERS.map((v) => [v.id, v]));

export function getVisualizer(id: string | null | undefined): Visualizer | undefined {
  return id ? byId.get(id) : undefined;
}

/**
 * Rank visualizers by keyword overlap with a question/solution's text. Best matches first.
 * Naming the visualizer's pattern (e.g. "stack", "sliding window") outweighs incidental keywords.
 */
export function suggestVisualizers(text: string): Visualizer[] {
  const haystack = text.toLowerCase();
  const score = (v: Visualizer) =>
    v.keywords.filter((k) => haystack.includes(k)).length + (haystack.includes(v.pattern.toLowerCase()) ? 2 : 0);
  return VISUALIZERS.map((v) => ({ v, score: score(v) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.v);
}
