import { ArrowDown, CheckCircle2, XCircle } from 'lucide-react';
import type { ArrayState, CellTone, MapState, Scalar, StackState, TraceStep } from '../../visualizer/types';

const toneClass: Record<CellTone, string> = {
  default: 'border-border bg-bg',
  active: 'border-accent bg-accent/15 text-accent-text',
  compare: 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  match: 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  eliminated: 'border-border bg-bg opacity-35',
  window: 'border-sky-500/70 bg-sky-500/10',
};

const toneLabel: Record<CellTone, string> = {
  default: '',
  active: 'current',
  compare: 'comparing',
  match: 'match',
  eliminated: 'excluded',
  window: 'in window',
};

const swatch: Record<CellTone, string> = {
  default: '',
  active: 'border-accent bg-accent/30',
  compare: 'border-amber-500 bg-amber-500/30',
  match: 'border-emerald-500 bg-emerald-500/30',
  eliminated: 'border-border bg-bg opacity-40',
  window: 'border-sky-500 bg-sky-500/25',
};

export function formatScalar(v: Scalar): string {
  if (v === null) return 'null';
  if (typeof v === 'string') return v === 'null' || v === 'undefined' ? v : `'${v}'`;
  return String(v);
}

const CELL = '3rem';

export function ArrayView({ array }: { array: ArrayState }) {
  const n = array.values.length;
  const columns = `repeat(${n}, ${CELL})`;
  const usedTones = [...new Set(Object.values(array.tones))].filter((t) => t !== 'default');

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted">{array.label}</span>
        {usedTones.length > 0 && (
          <ul className="flex flex-wrap gap-3 text-[11px] text-muted" aria-label="Legend">
            {usedTones.map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-sm border ${swatch[t]}`} /> {toneLabel[t]}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-grid gap-x-1.5 gap-y-1" style={{ gridTemplateColumns: columns }}>
          {array.values.map((_, i) => (
            <div key={`i${i}`} className="text-center font-mono text-[10px] text-muted">
              {i}
            </div>
          ))}
          {array.values.map((v, i) => {
            const tone = array.tones[i] ?? 'default';
            return (
              <div
                key={`v${i}`}
                className={`flex h-12 items-center justify-center rounded-md border-2 font-mono text-sm font-medium transition-colors duration-200 ${toneClass[tone]}`}
                aria-label={`index ${i}: ${v}${toneLabel[tone] ? `, ${toneLabel[tone]}` : ''}`}
              >
                {v}
              </div>
            );
          })}
          {array.values.map((_, i) => {
            const ptrs = array.pointers.filter((p) => p.index === i);
            return (
              <div key={`p${i}`} className="flex min-h-[2.25rem] flex-col items-center pt-0.5">
                {ptrs.length > 0 && <ArrowDown className="h-3 w-3 rotate-180 text-accent-text" aria-hidden />}
                {ptrs.map((p) => (
                  <span key={p.name} className="font-mono text-[11px] font-semibold leading-tight text-accent-text">
                    {p.name}
                  </span>
                ))}
              </div>
            );
          })}
          {array.range && (
            <div
              className="mt-0.5 flex flex-col items-center"
              style={{ gridColumn: `${array.range.start + 1} / ${array.range.end + 2}` }}
            >
              <div className="h-2 w-full rounded-b border-x-2 border-b-2 border-sky-500/70" />
              <span className="mt-0.5 whitespace-nowrap text-[10px] text-sky-600 dark:text-sky-400">
                {array.range.label} [{array.range.start}..{array.range.end}]
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MapView({ map }: { map: MapState }) {
  const h = map.highlight;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted">{map.label}</span>
        {h && (
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${
              h.kind === 'miss' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {h.kind === 'set' ? `set(${h.key})` : h.kind === 'hit' ? `has(${h.key}) → true` : `has(${h.key}) → false`}
          </span>
        )}
      </div>
      {map.entries.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-3 text-center font-mono text-xs text-muted">empty Map {'{}'}</p>
      ) : (
        <table className="w-full max-w-xs overflow-hidden rounded-md border border-border font-mono text-sm">
          <thead className="bg-subtle/60 text-[11px] text-muted">
            <tr>
              <th className="px-3 py-1 text-left font-medium">key</th>
              <th className="px-3 py-1 text-left font-medium">value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {map.entries.map((e) => {
              const lit = h && h.key === e.key && h.kind !== 'miss';
              return (
                <tr key={e.key} className={`transition-colors ${lit ? 'bg-emerald-500/15' : ''}`}>
                  <td className="px-3 py-1">{e.key}</td>
                  <td className="px-3 py-1">{e.value}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function StackView({ stack }: { stack: StackState }) {
  const items = [...stack.items].reverse();
  const op = stack.op;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted">
          {stack.label} <span className="text-muted/70">(top first)</span>
        </span>
        {op && (
          <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] text-accent-text">
            {op.kind}
            {op.kind === 'push' ? `(${op.value})` : ` → ${op.value}`}
          </span>
        )}
      </div>
      <div className="flex w-36 flex-col gap-1">
        {op?.kind === 'pop' && op.value !== 'undefined' && op.value !== 'null' && (
          <div className="flex h-9 items-center justify-center rounded-md border-2 border-dashed border-rose-500/50 font-mono text-sm text-rose-500/80 line-through">
            {op.value}
          </div>
        )}
        {items.length === 0 ? (
          <div className="flex h-9 items-center justify-center rounded-md border border-dashed border-border font-mono text-xs text-muted">empty</div>
        ) : (
          items.map((item, i) => {
            const top = i === 0;
            const lit = top && (op?.kind === 'push' || op?.kind === 'peek');
            return (
              <div
                key={`${items.length - i}-${item}`}
                className={`flex h-9 items-center justify-between rounded-md border-2 px-3 font-mono text-sm transition-colors ${
                  lit ? 'border-accent bg-accent/15 text-accent-text' : 'border-border bg-bg'
                }`}
              >
                <span>{item}</span>
                {top && <span className="text-[10px] text-muted">top</span>}
              </div>
            );
          })
        )}
        <div className="h-1 rounded-full bg-border" aria-hidden />
      </div>
    </div>
  );
}

export function TraceVisualization({ step }: { step: TraceStep }) {
  const hasStructures = step.array || step.map || step.stack;
  return (
    <div className="space-y-5">
      {step.array && <ArrayView array={step.array} />}
      {(step.map || step.stack || step.output) && (
        <div className="flex flex-wrap gap-8">
          {step.map && (
            <div className="min-w-[12rem] flex-1">
              <MapView map={step.map} />
            </div>
          )}
          {step.stack && <StackView stack={step.stack} />}
          {step.output && (
            <div>
              <span className="mb-2 block font-mono text-xs text-muted">output</span>
              <div className="flex flex-wrap gap-1 font-mono text-sm">
                [
                {step.output.map((o, i) => (
                  <span key={i}>
                    {o}
                    {i < step.output!.length - 1 ? ',' : ''}
                  </span>
                ))}
                ]
              </div>
            </div>
          )}
        </div>
      )}
      {!hasStructures && <p className="text-sm text-muted">No data structures at this step.</p>}

      {step.comparison && (
        <div
          className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
            step.comparison.result ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5'
          }`}
        >
          <code className="min-w-0 break-words font-mono text-[13px]">{step.comparison.expression}</code>
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-xs font-semibold ${
              step.comparison.result ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
            }`}
          >
            {String(step.comparison.result)}
          </span>
        </div>
      )}

      {step.result && (
        <div
          className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm ${
            step.result.success ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-rose-500/40 bg-rose-500/10'
          }`}
          role="status"
        >
          {step.result.success ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-500" />}
          <span className="text-muted">Returns</span>
          <code className="font-mono font-semibold">{step.result.value}</code>
        </div>
      )}
    </div>
  );
}

export function VariablesPanel({ step }: { step: TraceStep }) {
  if (step.variables.length === 0) return <p className="text-sm text-muted">No variables in scope yet.</p>;
  return (
    <table className="w-full font-mono text-sm">
      <tbody className="divide-y divide-border">
        {step.variables.map((v) => (
          <tr key={v.name} className={v.changed ? 'bg-amber-500/10' : ''}>
            <td className="py-1.5 pl-2 pr-4 text-muted">{v.name}</td>
            <td className="py-1.5 pr-2 text-right">
              {v.changed && <span className="mr-2 font-sans text-[10px] text-amber-600 dark:text-amber-400">changed</span>}
              {formatScalar(v.value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
