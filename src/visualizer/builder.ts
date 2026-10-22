import type { Scalar, TraceStep, VisualizerDefinition, Visualizer } from './types';

export const MAX_STEPS = 2000;

export class TraceLimitError extends Error {
  constructor() {
    super(`Trace exceeded ${MAX_STEPS} steps. Try a smaller input.`);
  }
}

export type StepInput = Omit<TraceStep, 'variables'> & { vars?: Record<string, Scalar> };

/** Collects snapshots and derives `changed` flags for variables between consecutive steps. */
export class TraceBuilder {
  readonly steps: TraceStep[] = [];
  private prevVars: Record<string, Scalar> | null = null;

  push({ vars = {}, ...rest }: StepInput): void {
    if (this.steps.length >= MAX_STEPS) throw new TraceLimitError();
    const prev = this.prevVars;
    const variables = Object.entries(vars).map(([name, value]) => ({
      name,
      value,
      changed: prev !== null && (!(name in prev) || prev[name] !== value),
    }));
    this.prevVars = { ...vars };
    this.steps.push({ ...rest, variables });
  }
}

export function defineVisualizer<T>(def: VisualizerDefinition<T>): Visualizer {
  const { parse, generate, ...meta } = def;
  return {
    ...meta,
    run(raw) {
      const parsed = parse({ ...def.defaultInput, ...raw });
      if (!parsed.ok) return parsed;
      try {
        return { ok: true, steps: generate(parsed.value) };
      } catch (err) {
        return { ok: false, errors: [err instanceof Error ? err.message : 'Could not generate trace.'] };
      }
    },
  };
}
