import { ArrowLeft, FileQuestion, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TagInput } from '../components/questions/TagInput';
import { Button, buttonClass } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import { ConfirmDialog } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { emptyExample, emptyQuestion } from '../lib/factories';
import { uniqueSorted } from '../lib/filters';
import { isHttpUrl } from '../lib/validation';
import { useQuestions } from '../store/QuestionsContext';
import { CATEGORIES, DIFFICULTIES, STATUSES, type Category, type Difficulty, type Question, type Status } from '../types';

type Errors = Partial<Record<string, string>>;

const toLines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

function validate(q: Question): Errors {
  const e: Errors = {};
  if (!q.title.trim()) e.title = 'Title is required.';
  else if (q.title.trim().length > 200) e.title = 'Keep the title under 200 characters.';
  if (q.topic.length > 60) e.topic = 'Keep the topic under 60 characters.';
  if (q.sourceUrl.trim() && !isHttpUrl(q.sourceUrl.trim())) e.sourceUrl = 'Enter a full URL starting with http:// or https://';
  q.examples.forEach((ex, i) => {
    const touched = ex.input.trim() || ex.output.trim() || ex.explanation.trim();
    if (touched && !ex.input.trim()) e[`example-${i}-input`] = 'Input is required.';
    if (touched && !ex.output.trim()) e[`example-${i}-output`] = 'Output is required.';
  });
  return e;
}

export function QuestionFormPage() {
  const { id } = useParams();
  const { getQuestion, saveQuestion, questions } = useQuestions();
  const existing = getQuestion(id);
  const isEdit = Boolean(id);

  if (isEdit && !existing) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Question not found"
        description="It may have been deleted."
        action={
          <Link to="/questions" className={buttonClass('secondary')}>
            Back to library
          </Link>
        }
      />
    );
  }
  return <QuestionForm key={existing?.id ?? 'new'} initial={existing ?? emptyQuestion()} isEdit={isEdit} onSave={saveQuestion} all={questions} />;
}

function QuestionForm({ initial, isEdit, onSave, all }: { initial: Question; isEdit: boolean; onSave(q: Question): void; all: Question[] }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [draft, setDraft] = useState<Question>(initial);
  const [constraintsText, setConstraintsText] = useState(initial.constraints.join('\n'));
  const [edgeCasesText, setEdgeCasesText] = useState(initial.edgeCases.join('\n'));
  const [errors, setErrors] = useState<Errors>({});
  const [confirmLeave, setConfirmLeave] = useState(false);

  const topicSuggestions = useMemo(() => uniqueSorted(all.map((q) => q.topic)), [all]);
  const tagSuggestions = useMemo(() => uniqueSorted(all.flatMap((q) => q.tags)), [all]);

  const build = (): Question => ({
    ...draft,
    title: draft.title.trim(),
    topic: draft.topic.trim(),
    sourceUrl: draft.sourceUrl.trim(),
    constraints: toLines(constraintsText),
    edgeCases: toLines(edgeCasesText),
    examples: draft.examples.filter((ex) => ex.input.trim() || ex.output.trim() || ex.explanation.trim()),
  });

  const dirty =
    JSON.stringify({ ...draft, constraints: toLines(constraintsText), edgeCases: toLines(edgeCasesText) }) !==
    JSON.stringify(initial);

  const set = <K extends keyof Question>(key: K, value: Question[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const setExample = (index: number, key: 'input' | 'output' | 'explanation', value: string) => {
    setDraft((d) => ({ ...d, examples: d.examples.map((ex, i) => (i === index ? { ...ex, [key]: value } : ex)) }));
    setErrors((e) => ({ ...e, [`example-${index}-${key}`]: undefined }));
  };

  const cancelTarget = isEdit ? `/questions/${initial.id}` : '/questions';

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(draft);
    setErrors(found);
    const firstKey = Object.keys(found).find((k) => found[k]);
    if (firstKey) {
      document.getElementById(`field-${firstKey}`)?.focus();
      toast.error('Please fix the highlighted fields.');
      return;
    }
    const q = build();
    onSave(q);
    toast.success(isEdit ? 'Question updated.' : 'Question created.');
    navigate(`/questions/${q.id}`, { replace: true });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => (dirty ? setConfirmLeave(true) : navigate(cancelTarget))} aria-label="Back">
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">{isEdit ? 'Edit question' : 'New question'}</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => (dirty ? setConfirmLeave(true) : navigate(cancelTarget))}>Cancel</Button>
          <Button type="submit" variant="primary">
            {isEdit ? 'Save changes' : 'Create question'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <section className="panel space-y-4 p-5">
          <h2 className="section-title">Basics</h2>
          <Field label="Title" htmlFor="field-title" error={errors.title} required>
            <Input id="field-title" value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Two Sum" invalid={!!errors.title} autoFocus={!isEdit} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category" htmlFor="field-category" required>
              <Select id="field-category" value={draft.category} onChange={(e) => set('category', e.target.value as Category)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Difficulty" htmlFor="field-difficulty" required>
              <Select id="field-difficulty" value={draft.difficulty} onChange={(e) => set('difficulty', e.target.value as Difficulty)}>
                {DIFFICULTIES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </Field>
            <Field label="Status" htmlFor="field-status">
              <Select id="field-status" value={draft.status} onChange={(e) => set('status', e.target.value as Status)}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Topic" htmlFor="field-topic" error={errors.topic} hint="e.g. Sliding Window, Closures, Hooks">
              <Input id="field-topic" list="topic-suggestions" value={draft.topic} onChange={(e) => set('topic', e.target.value)} placeholder="Arrays & Hashing" invalid={!!errors.topic} />
              <datalist id="topic-suggestions">
                {topicSuggestions.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
            <Field label="Source URL" htmlFor="field-sourceUrl" error={errors.sourceUrl}>
              <Input id="field-sourceUrl" type="url" value={draft.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://leetcode.com/problems/…" invalid={!!errors.sourceUrl} />
            </Field>
          </div>
          <Field label="Tags" htmlFor="field-tags">
            <TagInput id="field-tags" value={draft.tags} onChange={(tags) => set('tags', tags)} suggestions={tagSuggestions} />
          </Field>
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.bookmarked} onChange={(e) => set('bookmarked', e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
            Bookmark for revision
          </label>
        </section>

        <section className="panel space-y-4 p-5">
          <h2 className="section-title">Problem</h2>
          <Field label="Problem statement" htmlFor="field-statement" hint="Plain text. Use `backticks` for inline code.">
            <Textarea id="field-statement" rows={7} value={draft.statement} onChange={(e) => set('statement', e.target.value)} placeholder="Describe the problem…" />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-fg/80">Examples</span>
              <Button size="sm" onClick={() => set('examples', [...draft.examples, emptyExample()])}>
                <Plus /> Add example
              </Button>
            </div>
            {draft.examples.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-4 py-5 text-center text-sm text-muted">No examples yet.</p>
            ) : (
              <ol className="space-y-3">
                {draft.examples.map((ex, i) => (
                  <li key={ex.id} className="rounded-md border border-border bg-bg p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted">Example {i + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => set('examples', draft.examples.filter((x) => x.id !== ex.id))}
                        aria-label={`Remove example ${i + 1}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Input" htmlFor={`field-example-${i}-input`} error={errors[`example-${i}-input`]} required>
                        <Textarea id={`field-example-${i}-input`} rows={2} className="font-mono text-xs" value={ex.input} onChange={(e) => setExample(i, 'input', e.target.value)} placeholder="nums = [2,7,11,15], target = 9" invalid={!!errors[`example-${i}-input`]} />
                      </Field>
                      <Field label="Output" htmlFor={`field-example-${i}-output`} error={errors[`example-${i}-output`]} required>
                        <Textarea id={`field-example-${i}-output`} rows={2} className="font-mono text-xs" value={ex.output} onChange={(e) => setExample(i, 'output', e.target.value)} placeholder="[0,1]" invalid={!!errors[`example-${i}-output`]} />
                      </Field>
                    </div>
                    <Field label="Explanation" htmlFor={`field-example-${i}-explanation`} className="mt-3">
                      <Input id={`field-example-${i}-explanation`} value={ex.explanation} onChange={(e) => setExample(i, 'explanation', e.target.value)} placeholder="Optional" />
                    </Field>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Constraints" htmlFor="field-constraints" hint="One per line.">
              <Textarea id="field-constraints" rows={4} className="font-mono text-xs" value={constraintsText} onChange={(e) => setConstraintsText(e.target.value)} placeholder={'2 <= nums.length <= 10^4\nOnly one valid answer exists.'} />
            </Field>
            <Field label="Edge cases" htmlFor="field-edgeCases" hint="One per line.">
              <Textarea id="field-edgeCases" rows={4} value={edgeCasesText} onChange={(e) => setEdgeCasesText(e.target.value)} placeholder={'Empty input\nDuplicate values'} />
            </Field>
          </div>
        </section>

        <section className="panel space-y-4 p-5">
          <h2 className="section-title">Personal notes</h2>
          <Field label="Notes" htmlFor="field-notes" hint="Patterns, pitfalls, follow-ups. Solutions are added from the question page.">
            <Textarea id="field-notes" rows={4} value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder="What to remember next time…" />
          </Field>
        </section>

        <div className="flex justify-end gap-2 pb-4">
          <Button onClick={() => (dirty ? setConfirmLeave(true) : navigate(cancelTarget))}>Cancel</Button>
          <Button type="submit" variant="primary">
            {isEdit ? 'Save changes' : 'Create question'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLeave}
        title="Discard changes?"
        message="You have unsaved changes. Leaving now will discard them."
        confirmLabel="Discard"
        onConfirm={() => navigate(cancelTarget)}
        onCancel={() => setConfirmLeave(false)}
      />
    </form>
  );
}
