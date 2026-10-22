import { ArrowRight, Bookmark, Clock, LayoutDashboard, PlayCircle, Plus } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CategoryBadge, DifficultyBadge, StatusIcon } from '../components/ui/Badges';
import { buttonClass } from '../components/ui/Button';
import { EmptyState, PageHeader } from '../components/ui/EmptyState';
import { relativeTime } from '../lib/format';
import { computeStats, type Breakdown } from '../lib/stats';
import { useQuestions } from '../store/QuestionsContext';
import { CATEGORIES, DIFFICULTIES, type Question } from '../types';

const categoryRoute = { DSA: '/dsa', JavaScript: '/javascript', React: '/react' } as const;

export function Dashboard() {
  const { questions } = useQuestions();
  const stats = useMemo(() => computeStats(questions), [questions]);

  if (stats.total === 0) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="panel">
          <EmptyState
            icon={LayoutDashboard}
            title="Nothing to show yet"
            description="Add your first question to start tracking progress. You can also import a backup or load the sample set from Settings."
            action={
              <>
                <Link to="/questions/new" className={buttonClass('primary')}>
                  <Plus /> Add question
                </Link>
                <Link to="/settings" className={buttonClass('secondary')}>
                  Import or load samples
                </Link>
              </>
            }
          />
        </div>
      </div>
    );
  }

  const solvedPct = Math.round((stats.byStatus.Solved / stats.total) * 100);
  const maxCategory = Math.max(...CATEGORIES.map((c) => stats.byCategory[c].total), 1);
  const maxDifficulty = Math.max(...DIFFICULTIES.map((d) => stats.byDifficulty[d].total), 1);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your progress, from the questions saved in this browser."
        actions={
          <Link to="/studio" className={buttonClass('secondary')}>
            <PlayCircle /> Dry Run Studio
          </Link>
        }
      />

      <div className="panel mb-6 grid grid-cols-2 gap-px overflow-hidden bg-border sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Total questions" value={stats.total} />
        <Stat label="Solved" value={stats.byStatus.Solved} sub={`${solvedPct}% of total`} tone="text-emerald-600 dark:text-emerald-400" />
        <Stat label="Attempted" value={stats.byStatus.Attempted} />
        <Stat label="Not started" value={stats.byStatus['Not Started']} />
        <Stat label="Unsolved" value={stats.total - stats.byStatus.Solved} sub="attempted + not started" />
        <Stat label="Bookmarked" value={stats.bookmarked} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card title="By category" legend>
          <ul className="space-y-3.5">
            {CATEGORIES.map((c) => (
              <BarRow key={c} label={c} to={categoryRoute[c]} data={stats.byCategory[c]} max={maxCategory} />
            ))}
          </ul>
        </Card>
        <Card title="By difficulty" legend>
          <ul className="space-y-3.5">
            {DIFFICULTIES.map((d) => (
              <BarRow key={d} label={d} data={stats.byDifficulty[d]} max={maxDifficulty} />
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Recently added" icon={<Clock className="h-4 w-4 text-muted" />} action={<SeeAll to="/questions" />}>
          <QuestionList items={stats.recent} when={(q) => relativeTime(q.createdAt)} empty="No questions yet." />
        </Card>
        <Card title="Bookmarked" icon={<Bookmark className="h-4 w-4 text-muted" />} action={stats.bookmarked > 0 ? <SeeAll to="/bookmarks" /> : null}>
          <QuestionList items={stats.bookmarks} when={(q) => relativeTime(q.updatedAt)} empty="Bookmark questions to revise them later." />
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone = '' }: { label: string; value: number; sub?: string; tone?: string }) {
  return (
    <div className="bg-panel px-4 py-4">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums tracking-tight ${tone}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

function Card({ title, icon, action, legend, children }: { title: string; icon?: ReactNode; action?: ReactNode; legend?: boolean; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </h2>
        {legend && (
          <div className="flex items-center gap-3 text-[11px] text-muted" aria-hidden>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-accent" /> Solved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-accent/30" /> Not yet solved
            </span>
          </div>
        )}
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function BarRow({ label, data, max, to }: { label: string; data: Breakdown; max: number; to?: string }) {
  const totalPct = (data.total / max) * 100;
  const solvedPct = data.total ? (data.solved / data.total) * 100 : 0;
  const summary = `${label}: ${data.total} question${data.total === 1 ? '' : 's'}, ${data.solved} solved`;
  return (
    <li title={summary}>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        {to ? (
          <Link to={to} className="font-medium hover:text-accent-text">
            {label}
          </Link>
        ) : (
          <span className="font-medium">{label}</span>
        )}
        <span className="text-xs tabular-nums text-muted">
          <span className="text-fg">{data.solved}</span> / {data.total} solved
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-subtle" role="img" aria-label={summary}>
        {data.total > 0 && (
          <div className="flex h-full gap-[2px] overflow-hidden rounded-full" style={{ width: `${totalPct}%` }}>
            {data.solved > 0 && <div className="h-full bg-accent" style={{ width: `${solvedPct}%` }} />}
            {data.solved < data.total && <div className="h-full flex-1 bg-accent/30" />}
          </div>
        )}
      </div>
    </li>
  );
}

function QuestionList({ items, when, empty }: { items: Question[]; when(q: Question): string; empty: string }) {
  if (!items.length) return <p className="py-4 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="-my-1 divide-y divide-border">
      {items.map((q) => (
        <li key={q.id}>
          <Link to={`/questions/${q.id}`} className="group flex items-center gap-2.5 py-2 text-sm">
            <StatusIcon status={q.status} />
            <span className="min-w-0 flex-1 truncate group-hover:text-accent-text">{q.title}</span>
            <span className="hidden sm:inline">
              <CategoryBadge category={q.category} />
            </span>
            <DifficultyBadge difficulty={q.difficulty} />
            <span className="w-20 shrink-0 whitespace-nowrap text-right text-xs text-muted">{when(q)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SeeAll({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
      See all <ArrowRight className="h-3 w-3" />
    </Link>
  );
}
