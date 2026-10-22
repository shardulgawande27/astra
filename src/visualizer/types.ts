export type Scalar = string | number | boolean | null;

export type CellTone = 'default' | 'active' | 'compare' | 'match' | 'eliminated' | 'window';

export interface Pointer {
  name: string;
  index: number;
}

export interface ArrayState {
  label: string;
  values: (number | string)[];
  pointers: Pointer[];
  /** Tone per index; indices not listed render as `default`. */
  tones: Record<number, CellTone>;
  /** Inclusive range drawn as a bracket under the cells (search range, window). */
  range?: { start: number; end: number; label: string } | null;
}

export interface MapState {
  label: string;
  entries: { key: string; value: string }[];
  /** `set` = key written this step, `hit`/`miss` = lookup result for `key`. */
  highlight?: { key: string; kind: 'set' | 'hit' | 'miss' } | null;
}

export interface StackState {
  label: string;
  /** Bottom → top. */
  items: string[];
  op?: { kind: 'push' | 'pop' | 'peek'; value: string } | null;
}

export interface Comparison {
  expression: string;
  result: boolean;
}

export interface VariableEntry {
  name: string;
  value: Scalar;
  /** True when the value differs from (or did not exist in) the previous step. */
  changed: boolean;
}

/** A complete snapshot of execution state. Steps never depend on each other at render time. */
export interface TraceStep {
  /** 1-based line in the visualizer's reference code. */
  line: number;
  title: string;
  explanation: string;
  variables: VariableEntry[];
  array?: ArrayState;
  map?: MapState;
  stack?: StackState;
  comparison?: Comparison | null;
  /** Accumulated output values (e.g. results of pop/peek). */
  output?: string[];
  result?: { value: string; success: boolean } | null;
}

export type InputKind = 'numberArray' | 'number' | 'string';

export interface InputField {
  key: string;
  label: string;
  kind: InputKind;
  placeholder?: string;
  help?: string;
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

export type RunResult = { ok: true; steps: TraceStep[] } | { ok: false; errors: string[] };

export interface VisualizerMeta {
  id: string;
  name: string;
  /** Algorithmic pattern this visualizer demonstrates, e.g. "Hash Map". */
  pattern: string;
  summary: string;
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
  fields: InputField[];
  defaultInput: Record<string, string>;
  /** Lowercase keywords used to suggest this visualizer for a question. */
  keywords: string[];
}

export interface VisualizerDefinition<TInput> extends VisualizerMeta {
  parse(raw: Record<string, string>): ParseResult<TInput>;
  generate(input: TInput): TraceStep[];
}

export interface Visualizer extends VisualizerMeta {
  /** Validates raw input and produces a deterministic trace. Never throws. */
  run(raw: Record<string, string>): RunResult;
}
