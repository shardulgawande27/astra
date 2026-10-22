export const CATEGORIES = ['DSA', 'JavaScript', 'React'] as const;
export type Category = (typeof CATEGORIES)[number];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const STATUSES = ['Not Started', 'Attempted', 'Solved'] as const;
export type Status = (typeof STATUSES)[number];

export const APPROACH_TYPES = ['Brute Force', 'Better', 'Optimal', 'Custom'] as const;
export type ApproachType = (typeof APPROACH_TYPES)[number];

export interface Example {
  id: string;
  input: string;
  output: string;
  explanation: string;
}

/** Links a solution to one of Astra's built-in, deterministic trace generators. */
export interface DryRunConfig {
  visualizerId: string;
  /** Raw input values keyed by the visualizer's input field keys. */
  input: Record<string, string>;
}

export interface Solution {
  id: string;
  approach: ApproachType;
  title: string;
  code: string;
  explanation: string;
  intuition: string;
  timeComplexity: string;
  spaceComplexity: string;
  tradeoffs: string;
  notes: string;
  dryRun: DryRunConfig | null;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  title: string;
  statement: string;
  category: Category;
  topic: string;
  difficulty: Difficulty;
  tags: string[];
  examples: Example[];
  constraints: string[];
  sourceUrl: string;
  notes: string;
  edgeCases: string[];
  status: Status;
  bookmarked: boolean;
  solutions: Solution[];
  createdAt: string;
  updatedAt: string;
}

export const EXPORT_VERSION = 1;

export interface AstraExport {
  app: 'astra';
  version: number;
  exportedAt: string;
  questions: Question[];
}

export type Theme = 'dark' | 'light';

export interface Settings {
  theme: Theme;
}
