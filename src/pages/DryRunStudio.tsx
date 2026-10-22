import { AlertCircle, Info, Play, RotateCcw, Save, Settings2, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CodeViewer } from '../components/code/CodeViewer';
import { VisualizerInputs, VisualizerSelect } from '../components/solutions/DryRunConfigEditor';
import { PlayerControls } from '../components/studio/PlayerControls';
import { TraceVisualization, VariablesPanel } from '../components/studio/TraceVisualization';
import { useTracePlayer } from '../components/studio/useTracePlayer';
import { ApproachBadge, ComplexityChip, DifficultyBadge } from '../components/ui/Badges';
import { Button, buttonClass } from '../components/ui/Button';
import { PageHeader } from '../components/ui/EmptyState';
import { Field, Select } from '../components/ui/Field';
import { RichText } from '../components/ui/RichText';
import { useToast } from '../components/ui/Toast';
import { useQuestions } from '../store/QuestionsContext';
import type { Question, Solution } from '../types';
import { getVisualizer, suggestVisualizers, VISUALIZERS } from '../visualizer/registry';
import type { Visualizer } from '../visualizer/types';

const DEFAULT_VISUALIZER = 'two-sum-hashmap';

export function DryRunStudio() {
  const { questions, getQuestion, saveSolution } = useQuestions();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const question = getQuestion(params.get('q') ?? undefined);
  const solution = question?.solutions.find((s) => s.id === params.get('s')) ?? null;
  const [previewId, setPreviewId] = useState<string | null>(null);

  const withSolutions = useMemo(
    () => [...questions].filter((q) => q.solutions.length > 0).sort((a, b) => a.title.localeCompare(b.title)),
    [questions],
  );

  // Selecting a question without a solution: default to its first solution.
  useEffect(() => {
    if (question && !solution && question.solutions.length > 0) {
      setParams({ q: question.id, s: question.solutions[0].id }, { replace: true });
    }
  }, [question, solution, setParams]);

  useEffect(() => setPreviewId(null), [solution?.id]);

  const update = (next: Record<string, string>) => setParams(next, { replace: false });

  // Resolve what to trace.
  const linked = solution?.dryRun ? getVisualizer(solution.dryRun.visualizerId) : undefined;
  let visualizer: Visualizer | undefined;
  let baseInput: Record<string, string> = {};
  let mode: 'linked' | 'preview' | 'unconfigured' | 'playground';
  if (solution) {
    if (linked) {
      mode = 'linked';
      visualizer = linked;
      baseInput = { ...linked.defaultInput, ...solution.dryRun!.input };
    } else if (previewId && getVisualizer(previewId)) {
      mode = 'preview';
      visualizer = getVisualizer(previewId)!;
      baseInput = { ...visualizer.defaultInput };
    } else {
      mode = 'unconfigured';
    }
  } else {
    mode = 'playground';
    visualizer = getVisualizer(params.get('v')) ?? getVisualizer(DEFAULT_VISUALIZER)!;
    baseInput = { ...visualizer.defaultInput };
  }

  const attach = (visualizerId: string, input: Record<string, string>) => {
    if (!question || !solution) return;
    saveSolution(question.id, { ...solution, dryRun: { visualizerId, input } });
    setPreviewId(null);
    toast.success('Dry-run configuration saved to this solution.');
  };

  return (
    <div>
      <PageHeader
        title="Dry Run Studio"
        description="Step through deterministic traces of classic patterns. Edit the input and regenerate at any time."
      />

      <div className="panel mb-4 grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        <Field label="Question" htmlFor="studio-question">
          <Select
            id="studio-question"
            value={question?.id ?? ''}
            onChange={(e) => (e.target.value ? update({ q: e.target.value }) : update(visualizer ? { v: visualizer.id } : {}))}
          >
            <option value="">Playground — no question</option>
            {withSolutions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </Select>
        </Field>
        {question ? (
          <Field label="Solution" htmlFor="studio-solution">
            <Select id="studio-solution" value={solution?.id ?? ''} onChange={(e) => update({ q: question.id, s: e.target.value })}>
              {question.solutions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.approach} — {s.title}
                  {s.dryRun ? '' : ' (no visualizer)'}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Visualizer" htmlFor="studio-visualizer">
            <Select id="studio-visualizer" value={visualizer?.id ?? ''} onChange={(e) => update({ v: e.target.value })}>
              {VISUALIZERS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {question && (
          <Link to={`/questions/${question.id}`} className={buttonClass('ghost', 'md', 'md:mb-0')}>
            Open question
          </Link>
        )}
      </div>

      {question && question.solutions.length === 0 && (
        <div className="panel p-6 text-sm text-muted">
          This question has no solutions yet.{' '}
          <Link to={`/questions/${question.id}`} className="text-accent-text hover:underline">
            Add one
          </Link>{' '}
          to dry-run it.
        </div>
      )}

      {question && solution && <ProblemStrip question={question} solution={solution} />}

      {mode === 'unconfigured' && question && solution && (
        <UnsupportedNotice question={question} solution={solution} onPreview={setPreviewId} onAttach={(id) => attach(id, getVisualizer(id)!.defaultInput)} />
      )}

      {visualizer && (
        <Workspace
          key={`${question?.id ?? ''}|${solution?.id ?? ''}|${visualizer.id}|${JSON.stringify(baseInput)}`}
          visualizer={visualizer}
          baseInput={baseInput}
          solution={solution}
          mode={mode}
          onSaveInput={solution ? (input) => attach(visualizer!.id, input) : undefined}
          onCancelPreview={() => setPreviewId(null)}
        />
      )}
    </div>
  );
}

function ProblemStrip({ question, solution }: { question: Question; solution: Solution }) {
  return (
    <details className="panel group mb-4 px-4 py-3">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{question.title}</span>
        <DifficultyBadge difficulty={question.difficulty} />
        <span className="text-muted">·</span>
        <ApproachBadge approach={solution.approach} />
        <span className="text-fg/80">{solution.title}</span>
        <span className="ml-auto text-xs text-muted group-open:hidden">Show problem</span>
        <span className="ml-auto hidden text-xs text-muted group-open:inline">Hide problem</span>
      </summary>
      <div className="mt-3 border-t border-border pt-3">
        {question.statement ? <RichText text={question.statement} /> : <p className="text-sm text-muted">No problem statement.</p>}
        {solution.explanation && (
          <div className="mt-3">
            <h3 className="section-title mb-1">Approach</h3>
            <RichText text={solution.explanation} />
          </div>
        )}
      </div>
    </details>
  );
}

function UnsupportedNotice({
  question,
  solution,
  onPreview,
  onAttach,
}: {
  question: Question;
  solution: Solution;
  onPreview(id: string): void;
  onAttach(id: string): void;
}) {
  const context = `${question.title} ${question.topic} ${question.tags.join(' ')} ${solution.title}`;
  const suggested = useMemo(() => suggestVisualizers(context), [context]);
  const [choice, setChoice] = useState(suggested[0]?.id ?? VISUALIZERS[0].id);

  return (
    <div className="panel mb-4 p-5">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <Info className="h-4 w-4 text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">No visualizer is configured for this solution</h2>
          <p className="mt-1 text-sm text-muted">
            Astra never executes your code. Dry runs come from built-in, deterministic trace generators for specific patterns. Pick a compatible
            one to preview it, or attach it to “{solution.title}” so it opens automatically next time.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field label="Compatible visualizer" htmlFor="unsupported-visualizer" className="sm:w-80">
              <VisualizerSelect id="unsupported-visualizer" value={choice} onChange={setChoice} contextText={context} allowNone={false} />
            </Field>
            <div className="flex gap-2">
              <Button onClick={() => onPreview(choice)}>
                <Play /> Preview trace
              </Button>
              <Button variant="primary" onClick={() => onAttach(choice)}>
                <Save /> Attach to solution
              </Button>
            </div>
          </div>
          {suggested.length === 0 && (
            <p className="mt-3 text-xs text-muted">No visualizer matches this question’s title, topic, or tags — any of them can still be used for practice.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Workspace({
  visualizer,
  baseInput,
  solution,
  mode,
  onSaveInput,
  onCancelPreview,
}: {
  visualizer: Visualizer;
  baseInput: Record<string, string>;
  solution: Solution | null;
  mode: 'linked' | 'preview' | 'unconfigured' | 'playground';
  onSaveInput?(input: Record<string, string>): void;
  onCancelPreview(): void;
}) {
  const [draft, setDraft] = useState(baseInput);
  const [applied, setApplied] = useState(baseInput);
  const [inputErrors, setInputErrors] = useState<string[]>([]);
  const [codeTab, setCodeTab] = useState<'trace' | 'mine'>('trace');

  const result = useMemo(() => visualizer.run(applied), [visualizer, applied]);
  const steps = result.ok ? result.steps : [];
  const player = useTracePlayer(steps.length, steps);
  const step = steps[player.index];

  const draftDirty = JSON.stringify(draft) !== JSON.stringify(applied);
  const differsFromSaved = JSON.stringify(applied) !== JSON.stringify(baseInput);

  const regenerate = () => {
    const res = visualizer.run(draft);
    if (!res.ok) {
      setInputErrors(res.errors);
      return;
    }
    setInputErrors([]);
    setApplied({ ...draft });
  };

  const resetInput = () => {
    setDraft(baseInput);
    setApplied(baseInput);
    setInputErrors([]);
  };

  // Keyboard shortcuts, ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"], .cm-editor') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === ' ' && t.closest('button, a, summary')) return;
      if (e.key === 'ArrowRight') player.next();
      else if (e.key === 'ArrowLeft') player.prev();
      else if (e.key === ' ') player.toggle();
      else if (e.key === 'Home') player.reset();
      else if (e.key === 'End') player.toEnd();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [player]);

  const displayErrors = inputErrors.length ? inputErrors : result.ok ? [] : result.errors;

  return (
    <div className="space-y-4">
      {mode === 'preview' && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm">
          <span>
            <Sparkles className="mr-1.5 inline h-4 w-4 text-accent-text" />
            Previewing <strong>{visualizer.name}</strong> — not yet attached to this solution.
          </span>
          <div className="flex gap-2">
            <Button size="sm" onClick={onCancelPreview}>
              Cancel
            </Button>
            {onSaveInput && (
              <Button size="sm" variant="primary" onClick={() => onSaveInput(applied)}>
                <Save /> Attach with this input
              </Button>
            )}
          </div>
        </div>
      )}

      <section className="panel p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted" />
            <h2 className="text-sm font-semibold">Input</h2>
            <span className="text-xs text-muted">{visualizer.name}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <ComplexityChip label="Time" value={visualizer.timeComplexity} />
            <ComplexityChip label="Space" value={visualizer.spaceComplexity} />
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <VisualizerInputs visualizer={visualizer} input={draft} onChange={setDraft} idPrefix="studio" onSubmit={regenerate} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={regenerate}>
              <Play /> {draftDirty ? 'Run with new input' : 'Regenerate'}
            </Button>
            <Button onClick={resetInput} disabled={!draftDirty && !differsFromSaved} title={mode === 'linked' ? 'Reset to saved input' : 'Reset to default input'}>
              <RotateCcw /> Reset
            </Button>
            {mode === 'linked' && onSaveInput && differsFromSaved && !draftDirty && (
              <Button onClick={() => onSaveInput(applied)}>
                <Save /> Save input
              </Button>
            )}
          </div>
        </div>
        {displayErrors.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-rose-500" role="alert">
            {displayErrors.map((e) => (
              <li key={e} className="flex items-start gap-1.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {e}
              </li>
            ))}
          </ul>
        )}
      </section>

      {step ? (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <section className="panel min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">
                <span className="mr-2 font-mono text-xs text-muted">line {step.line}</span>
                {step.title}
              </h2>
              <span className="text-xs text-muted">{visualizer.pattern}</span>
            </div>
            <div className="p-4">
              <TraceVisualization step={step} />
            </div>
            <div className="border-t border-border bg-subtle/40 px-4 py-3">
              <p className="text-sm leading-relaxed" aria-live="polite">
                {step.explanation}
              </p>
            </div>
            <div className="border-t border-border px-4 py-3">
              <PlayerControls player={player} />
            </div>
          </section>

          <div className="min-w-0 space-y-4">
            <section className="panel min-w-0">
              <div className="flex items-center gap-1 border-b border-border px-2 pt-2" role="tablist">
                <TabButton active={codeTab === 'trace'} onClick={() => setCodeTab('trace')}>
                  Traced code
                </TabButton>
                {solution && (
                  <TabButton active={codeTab === 'mine'} onClick={() => setCodeTab('mine')}>
                    Your solution
                  </TabButton>
                )}
              </div>
              <div className="p-3">
                {codeTab === 'trace' || !solution ? (
                  <>
                    <CodeViewer code={visualizer.code} highlightLine={step.line} title={visualizer.name} maxHeight="22rem" />
                    <p className="mt-2 text-[11px] text-muted">Highlighting follows Astra’s reference implementation of this pattern.</p>
                  </>
                ) : (
                  <>
                    <CodeViewer code={solution.code} title={solution.title} maxHeight="22rem" emptyText="This solution has no code yet." />
                    <p className="mt-2 text-[11px] text-muted">Your code is shown for comparison only. It is never executed.</p>
                  </>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold">Variables</h2>
              </div>
              <div className="p-2">
                <VariablesPanel step={step} />
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="panel p-8 text-center text-sm text-muted">Fix the input above to generate a trace.</div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick(): void; children: string }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${active ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'}`}
    >
      {children}
    </button>
  );
}
