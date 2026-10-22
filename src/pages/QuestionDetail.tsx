import { ArrowLeft, Download, ExternalLink, FileQuestion, Pencil, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BookmarkButton } from '../components/questions/QuestionRow';
import { SolutionsPanel } from '../components/solutions/SolutionsPanel';
import { CategoryBadge, DifficultyBadge, StatusIcon, Tag } from '../components/ui/Badges';
import { Button, buttonClass } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Select } from '../components/ui/Field';
import { ConfirmDialog } from '../components/ui/Modal';
import { RichText } from '../components/ui/RichText';
import { useToast } from '../components/ui/Toast';
import { exportQuestion } from '../lib/download';
import { formatDate, pluralize } from '../lib/format';
import { useQuestions } from '../store/QuestionsContext';
import { STATUSES, type Status } from '../types';

export function QuestionDetail() {
  const { id } = useParams();
  const { getQuestion, setStatus, deleteQuestion } = useQuestions();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const question = getQuestion(id);

  if (!question) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Question not found"
        description="It may have been deleted or the link is wrong."
        action={
          <Link to="/questions" className={buttonClass('secondary')}>
            Back to library
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-5">
        <button onClick={() => (location.key === 'default' ? navigate('/questions') : navigate(-1))} className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{question.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <CategoryBadge category={question.category} />
              <DifficultyBadge difficulty={question.difficulty} />
              {question.topic && <span>{question.topic}</span>}
              <span aria-hidden>·</span>
              <span>Updated {formatDate(question.updatedAt)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <label className="relative flex items-center">
              <span className="sr-only">Status</span>
              <span className="pointer-events-none absolute left-2.5">
                <StatusIcon status={question.status} />
              </span>
              <Select
                value={question.status}
                onChange={(e) => {
                  setStatus(question.id, e.target.value as Status);
                  toast.success(`Marked as ${e.target.value}.`);
                }}
                className="w-40 pl-8"
                aria-label="Status"
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </label>
            <BookmarkButton question={question} size="md" />
            <Button variant="ghost" size="icon" onClick={() => exportQuestion(question)} aria-label="Export question as JSON" title="Export as JSON">
              <Download />
            </Button>
            <Link to={`/questions/${question.id}/edit`} className={buttonClass('secondary')}>
              <Pencil /> Edit
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)} aria-label="Delete question" title="Delete question">
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <article className="panel min-w-0 divide-y divide-border">
          <Block title="Problem">
            {question.statement.trim() ? <RichText text={question.statement} /> : <p className="text-sm text-muted">No problem statement yet.</p>}
          </Block>

          {question.examples.length > 0 && (
            <Block title="Examples">
              <ol className="space-y-3">
                {question.examples.map((ex, i) => (
                  <li key={ex.id} className="rounded-md border border-border bg-bg p-3 text-sm">
                    <div className="mb-1.5 text-xs font-medium text-muted">Example {i + 1}</div>
                    <dl className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 font-mono text-xs">
                      <dt className="text-muted">Input</dt>
                      <dd className="whitespace-pre-wrap break-words">{ex.input}</dd>
                      <dt className="text-muted">Output</dt>
                      <dd className="whitespace-pre-wrap break-words">{ex.output}</dd>
                    </dl>
                    {ex.explanation && <p className="mt-2 text-xs text-muted">{ex.explanation}</p>}
                  </li>
                ))}
              </ol>
            </Block>
          )}

          {question.constraints.length > 0 && (
            <Block title="Constraints">
              <ul className="space-y-1 font-mono text-xs">
                {question.constraints.map((c, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted">•</span>
                    <span className="break-words">{c}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {question.edgeCases.length > 0 && (
            <Block title="Edge cases">
              <ul className="space-y-1 text-sm">
                {question.edgeCases.map((c, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {question.notes.trim() && (
            <Block title="Personal notes">
              <RichText text={question.notes} />
            </Block>
          )}

          <Block title="Details">
            <dl className="grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted">Tags</dt>
              <dd className="flex flex-wrap gap-1">
                {question.tags.length ? question.tags.map((t) => <Tag key={t}>{t}</Tag>) : <span className="text-muted">—</span>}
              </dd>
              <dt className="text-muted">Source</dt>
              <dd className="min-w-0">
                {question.sourceUrl ? (
                  <a href={question.sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex max-w-full items-center gap-1 text-accent-text hover:underline">
                    <span className="truncate">{question.sourceUrl.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </dd>
              <dt className="text-muted">Created</dt>
              <dd>{formatDate(question.createdAt)}</dd>
            </dl>
          </Block>
        </article>

        <SolutionsPanel key={question.id} question={question} />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete question?"
        message={
          <>
            <strong>{question.title}</strong> and its {pluralize(question.solutions.length, 'solution')} will be permanently deleted from this browser.
            Consider exporting it first.
          </>
        }
        confirmLabel="Delete question"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteQuestion(question.id);
          toast.success('Question deleted.');
          navigate('/questions', { replace: true });
        }}
      />
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="px-5 py-4">
      <h2 className="section-title mb-2.5">{title}</h2>
      {children}
    </section>
  );
}
