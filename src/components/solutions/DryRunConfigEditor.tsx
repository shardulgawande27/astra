import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';
import type { DryRunConfig } from '../../types';
import { getVisualizer, suggestVisualizers, VISUALIZERS } from '../../visualizer/registry';
import type { Visualizer } from '../../visualizer/types';
import { Field, Input, Select } from '../ui/Field';

export function VisualizerSelect({
  value,
  onChange,
  contextText,
  allowNone = true,
  id,
}: {
  value: string;
  onChange(id: string): void;
  contextText: string;
  allowNone?: boolean;
  id?: string;
}) {
  const suggested = useMemo(() => suggestVisualizers(contextText), [contextText]);
  const others = VISUALIZERS.filter((v) => !suggested.includes(v));
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {allowNone && <option value="">None — no dry run</option>}
      {suggested.length > 0 && (
        <optgroup label="Suggested for this question">
          {suggested.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label={suggested.length ? 'Other visualizers' : 'Visualizers'}>
        {others.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </optgroup>
    </Select>
  );
}

export function VisualizerInputs({
  visualizer,
  input,
  onChange,
  idPrefix = 'viz',
  onSubmit,
}: {
  visualizer: Visualizer;
  input: Record<string, string>;
  onChange(input: Record<string, string>): void;
  idPrefix?: string;
  onSubmit?(): void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {visualizer.fields.map((f) => (
        <Field key={f.key} label={f.label} htmlFor={`${idPrefix}-${f.key}`} hint={f.help} className={f.kind === 'number' ? '' : 'sm:col-span-2'}>
          <Input
            id={`${idPrefix}-${f.key}`}
            className="font-mono"
            value={input[f.key] ?? ''}
            placeholder={f.placeholder}
            inputMode={f.kind === 'number' ? 'numeric' : undefined}
            onChange={(e) => onChange({ ...input, [f.key]: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onSubmit) {
                e.preventDefault();
                onSubmit();
              }
            }}
            spellCheck={false}
          />
        </Field>
      ))}
    </div>
  );
}

/** Edits a solution's dry-run link and validates the input live against the chosen generator. */
export function DryRunConfigEditor({
  value,
  onChange,
  contextText,
}: {
  value: DryRunConfig | null;
  onChange(value: DryRunConfig | null): void;
  contextText: string;
}) {
  const visualizer = getVisualizer(value?.visualizerId);
  const check = useMemo(() => (visualizer && value ? visualizer.run(value.input) : null), [visualizer, value]);

  return (
    <div className="space-y-3">
      <Field
        label="Visualizer"
        htmlFor="dryrun-visualizer"
        hint="Traces run on Astra’s built-in reference implementation of the pattern — your code is never executed."
      >
        <VisualizerSelect
          id="dryrun-visualizer"
          value={value?.visualizerId ?? ''}
          contextText={contextText}
          onChange={(id) => {
            const v = getVisualizer(id);
            onChange(v ? { visualizerId: v.id, input: { ...v.defaultInput } } : null);
          }}
        />
      </Field>
      {visualizer && value && (
        <>
          <p className="text-xs text-muted">{visualizer.summary}</p>
          <VisualizerInputs visualizer={visualizer} input={value.input} onChange={(input) => onChange({ ...value, input })} idPrefix="dryrun" />
          {check &&
            (check.ok ? (
              <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Trace ready: {check.steps.length} steps, result {check.steps[check.steps.length - 1].result?.value ?? '—'}
              </p>
            ) : (
              <ul className="space-y-1 text-xs text-rose-500">
                {check.errors.map((e) => (
                  <li key={e} className="flex items-start gap-1.5">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {e}
                  </li>
                ))}
              </ul>
            ))}
        </>
      )}
    </div>
  );
}
