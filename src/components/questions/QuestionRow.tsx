import { Bookmark, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { relativeTime } from '../../lib/format';
import { useQuestions } from '../../store/QuestionsContext';
import type { Question } from '../../types';
import { CategoryBadge, DifficultyBadge, StatusIcon } from '../ui/Badges';

export function BookmarkButton({ question, size = 'sm' }: { question: Question; size?: 'sm' | 'md' }) {
  const { toggleBookmark } = useQuestions();
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBookmark(question.id);
      }}
      className={`flex ${dim} shrink-0 items-center justify-center rounded-md transition-colors hover:bg-subtle ${
        question.bookmarked ? 'text-amber-500' : 'text-muted/60 hover:text-fg'
      }`}
      aria-pressed={question.bookmarked}
      aria-label={question.bookmarked ? `Remove bookmark from ${question.title}` : `Bookmark ${question.title}`}
      title={question.bookmarked ? 'Remove bookmark' : 'Bookmark'}
    >
      <Bookmark className="h-4 w-4" fill={question.bookmarked ? 'currentColor' : 'none'} />
    </button>
  );
}

export function QuestionRow({ question, showCategory = true }: { question: Question; showCategory?: boolean }) {
  return (
    <li className="group relative flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-subtle/50 sm:px-4">
      <span title={question.status} className="shrink-0">
        <StatusIcon status={question.status} className="h-4 w-4" />
        <span className="sr-only">{question.status}</span>
      </span>
      <div className="min-w-0 flex-1">
        <Link
          to={`/questions/${question.id}`}
          className="block truncate text-sm font-medium after:absolute after:inset-0 after:content-[''] group-hover:text-accent-text"
        >
          {question.title}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          {question.topic && <span>{question.topic}</span>}
          {question.tags.slice(0, 3).map((t) => (
            <span key={t} className="font-mono">
              #{t}
            </span>
          ))}
          {question.tags.length > 3 && <span>+{question.tags.length - 3}</span>}
        </div>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        {showCategory && <CategoryBadge category={question.category} />}
      </div>
      <DifficultyBadge difficulty={question.difficulty} />
      <span className="hidden w-14 items-center justify-end gap-1 text-xs text-muted sm:flex" title={`${question.solutions.length} solution(s)`}>
        <Layers className="h-3.5 w-3.5" />
        {question.solutions.length}
      </span>
      <span className="hidden w-20 text-right text-xs text-muted lg:block">{relativeTime(question.updatedAt)}</span>
      <div className="relative z-10">
        <BookmarkButton question={question} />
      </div>
    </li>
  );
}
