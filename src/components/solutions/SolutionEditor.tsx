import { useState } from 'react';
import { getVisualizer } from '../../visualizer/registry';
import { APPROACH_TYPES, type ApproachType, type Question, type Solution } from '../../types';
import { CodeEditor } from '../code/CodeEditor';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { ConfirmDialog, Modal } from '../ui/Modal';
import { DryRunConfigEditor } from './DryRunConfigEditor';

export function SolutionEditor({
  question,
  initial,
  isNew,
  onSave,
  onClose,
}: {
  question: Question;
  initial: Solution;
  isNew: boolean;
  onSave(solution: Solution): void;
  onClose(): void;
}) {
  const [draft, setDraft] = useState<Solution>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  const set = <K extends keyof Solution>(key: K, value: Solution[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const save = () => {
    const e: Record<string, string> = {};
    if (draft.title.trim().length > 120) e.title = 'Keep the title under 120 characters.';
    if (draft.dryRun) {
      const v = getVisualizer(draft.dryRun.visualizerId);
      const res = v?.run(draft.dryRun.input);
      if (!res?.ok) e.dryRun = 'Fix the dry-run input or choose “None”.';
    }
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    onSave({ ...draft, title: draft.title.trim() || draft.approach });
  };

  const close = () => (dirty ? setConfirmDiscard(true) : onClose());

  return (
    <>
      <Modal
        open
        onClose={close}
        size="lg"
        title={isNew ? 'Add solution' : 'Edit solution'}
        description={question.title}
        footer={
          <>
            <Button onClick={close}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              {isNew ? 'Add solution' : 'Save solution'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
            <Field label="Approach" htmlFor="sol-approach" required>
              <Select id="sol-approach" value={draft.approach} onChange={(e) => set('approach', e.target.value as ApproachType)}>
                {APPROACH_TYPES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </Select>
            </Field>
            <Field label="Title" htmlFor="sol-title" error={errors.title} hint={`Defaults to “${draft.approach}” when empty.`}>
              <Input id="sol-title" value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. One-pass hash map" invalid={!!errors.title} />
            </Field>
          </div>

          <Field label="JavaScript code" htmlFor="sol-code">
            <CodeEditor id="sol-code" value={draft.code} onChange={(code) => set('code', code)} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Time complexity" htmlFor="sol-time">
              <Input id="sol-time" className="font-mono" value={draft.timeComplexity} onChange={(e) => set('timeComplexity', e.target.value)} placeholder="O(n)" />
            </Field>
            <Field label="Space complexity" htmlFor="sol-space">
              <Input id="sol-space" className="font-mono" value={draft.spaceComplexity} onChange={(e) => set('spaceComplexity', e.target.value)} placeholder="O(1)" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Approach explanation" htmlFor="sol-explanation">
              <Textarea id="sol-explanation" rows={4} value={draft.explanation} onChange={(e) => set('explanation', e.target.value)} placeholder="How the algorithm works, step by step." />
            </Field>
            <Field label="Intuition" htmlFor="sol-intuition">
              <Textarea id="sol-intuition" rows={4} value={draft.intuition} onChange={(e) => set('intuition', e.target.value)} placeholder="Why this idea works / how you’d discover it." />
            </Field>
            <Field label="Trade-offs" htmlFor="sol-tradeoffs">
              <Textarea id="sol-tradeoffs" rows={3} value={draft.tradeoffs} onChange={(e) => set('tradeoffs', e.target.value)} placeholder="Memory vs. speed, input assumptions…" />
            </Field>
            <Field label="Personal notes" htmlFor="sol-notes">
              <Textarea id="sol-notes" rows={3} value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Mistakes I made, things to remember…" />
            </Field>
          </div>

          <div className="rounded-md border border-border bg-bg p-4">
            <h3 className="mb-3 text-sm font-medium">Dry run (optional)</h3>
            <DryRunConfigEditor
              value={draft.dryRun}
              onChange={(v) => set('dryRun', v)}
              contextText={`${question.title} ${question.topic} ${question.tags.join(' ')} ${draft.title}`}
            />
            {errors.dryRun && <p className="mt-2 text-xs text-rose-500">{errors.dryRun}</p>}
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDiscard}
        title="Discard changes?"
        message="Your edits to this solution will be lost."
        confirmLabel="Discard"
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}
