import { Columns2, Lightbulb, Pencil, PlayCircle, Plus, Scale, StickyNote, Trash2, Workflow } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { emptySolution } from '../../lib/factories';
import { useQuestions } from '../../store/QuestionsContext';
import type { Question, Solution } from '../../types';
import { getVisualizer } from '../../visualizer/registry';
import { CodeViewer } from '../code/CodeViewer';
import { ApproachBadge, ComplexityChip } from '../ui/Badges';
import { Button, buttonClass } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmDialog } from '../ui/Modal';
import { RichText } from '../ui/RichText';
import { useToast } from '../ui/Toast';
import { CompareSolutions } from './CompareSolutions';
import { SolutionEditor } from './SolutionEditor';

export function SolutionsPanel({ question }: { question: Question }) {
  const { saveSolution, deleteSolution } = useQuestions();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(question.solutions[0]?.id ?? null);
  const [editing, setEditing] = useState<{ solution: Solution; isNew: boolean } | null>(null);
  const [deleting, setDeleting] = useState<Solution | null>(null);
  const [comparing, setComparing] = useState(false);

  const selected = question.solutions.find((s) => s.id === selectedId) ?? question.solutions[0] ?? null;

  return (
    <section className="panel flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">
          Solutions <span className="ml-1 font-mono text-xs text-muted">{question.solutions.length}</span>
        </h2>
        <div className="flex gap-2">
          {question.solutions.length >= 2 && (
            <Button size="sm" onClick={() => setComparing(true)}>
              <Columns2 /> Compare
            </Button>
          )}
          <Button size="sm" variant="primary" onClick={() => setEditing({ solution: emptySolution(), isNew: true })}>
            <Plus /> Add solution
          </Button>
        </div>
      </div>

      {!selected ? (
        <EmptyState
          icon={Workflow}
          title="No solutions yet"
          description="That’s fine — save the question now and add brute force, better, or optimal approaches as you go."
          action={
            <Button variant="primary" onClick={() => setEditing({ solution: emptySolution(), isNew: true })}>
              <Plus /> Add first solution
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto border-b border-border px-2 pt-2" role="tablist" aria-label="Solutions">
            {question.solutions.map((s) => {
              const active = s.id === selected.id;
              return (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedId(s.id)}
                  className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors ${
                    active ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'
                  }`}
                >
                  <ApproachBadge approach={s.approach} />
                  <span className="max-w-[12rem] truncate">{s.title}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4 p-4" role="tabpanel">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <ComplexityChip label="Time" value={selected.timeComplexity} />
                <ComplexityChip label="Space" value={selected.spaceComplexity} />
                {!selected.timeComplexity && !selected.spaceComplexity && <span className="text-xs text-muted">Complexity not recorded</span>}
              </div>
              <div className="flex gap-1">
                <Link to={`/studio?q=${question.id}&s=${selected.id}`} className={buttonClass('secondary', 'sm')}>
                  <PlayCircle /> Dry run
                </Link>
                <Button size="sm" variant="ghost" onClick={() => setEditing({ solution: selected, isNew: false })}>
                  <Pencil /> Edit
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(selected)} aria-label={`Delete solution ${selected.title}`}>
                  <Trash2 />
                </Button>
              </div>
            </div>

            <CodeViewer code={selected.code} emptyText="No code saved for this approach yet." />

            <DryRunSummary solution={selected} />

            <div className="grid gap-4 xl:grid-cols-2">
              <Section icon={Workflow} title="Approach" text={selected.explanation} />
              <Section icon={Lightbulb} title="Intuition" text={selected.intuition} />
              <Section icon={Scale} title="Trade-offs" text={selected.tradeoffs} />
              <Section icon={StickyNote} title="Notes" text={selected.notes} />
            </div>
          </div>
        </>
      )}

      {editing && (
        <SolutionEditor
          question={question}
          initial={editing.solution}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            saveSolution(question.id, s);
            setSelectedId(s.id);
            setEditing(null);
            toast.success(editing.isNew ? 'Solution added.' : 'Solution saved.');
          }}
        />
      )}
      {comparing && <CompareSolutions question={question} onClose={() => setComparing(false)} />}
      <ConfirmDialog
        open={!!deleting}
        title="Delete solution?"
        message={
          <>
            “{deleting?.title}” and its notes will be permanently removed from <strong>{question.title}</strong>.
          </>
        }
        confirmLabel="Delete solution"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteSolution(question.id, deleting.id);
            toast.success('Solution deleted.');
          }
          setDeleting(null);
        }}
      />
    </section>
  );
}

function DryRunSummary({ solution }: { solution: Solution }) {
  const v = getVisualizer(solution.dryRun?.visualizerId);
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2 text-xs">
      <PlayCircle className={`h-3.5 w-3.5 ${v ? 'text-accent-text' : 'text-muted'}`} />
      {v ? (
        <span>
          Dry run linked to <span className="font-medium">{v.name}</span>
          <span className="text-muted"> · input {Object.values(solution.dryRun!.input).join(' | ')}</span>
        </span>
      ) : (
        <span className="text-muted">No visualizer configured. Open Dry Run to pick a compatible trace.</span>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, text }: { icon: typeof Workflow; title: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <div>
      <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Icon className="h-3.5 w-3.5" /> {title}
      </h3>
      <RichText text={text} />
    </div>
  );
}
