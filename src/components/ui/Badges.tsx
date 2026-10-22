import { CheckCircle2, Circle, CircleDashed } from 'lucide-react';
import type { ApproachType, Category, Difficulty, Status } from '../../types';

const base = 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap';

const difficultyTone: Record<Difficulty, string> = {
  Easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Hard: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`${base} ${difficultyTone[difficulty]}`}>{difficulty}</span>;
}

const statusMeta: Record<Status, { icon: typeof Circle; tone: string }> = {
  'Not Started': { icon: Circle, tone: 'text-muted' },
  Attempted: { icon: CircleDashed, tone: 'text-amber-600 dark:text-amber-400' },
  Solved: { icon: CheckCircle2, tone: 'text-emerald-600 dark:text-emerald-400' },
};

export function StatusIcon({ status, className = 'h-3.5 w-3.5' }: { status: Status; className?: string }) {
  const { icon: Icon, tone } = statusMeta[status];
  return <Icon className={`${className} ${tone}`} aria-hidden />;
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`${base} px-0 text-muted`}>
      <StatusIcon status={status} />
      <span className="text-fg/80">{status}</span>
    </span>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  return <span className={`${base} border border-border bg-subtle text-fg/80`}>{category}</span>;
}

const approachTone: Record<ApproachType, string> = {
  'Brute Force': 'bg-zinc-500/10 text-fg/70',
  Better: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  Optimal: 'bg-accent/10 text-accent-text',
  Custom: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
};

export function ApproachBadge({ approach }: { approach: ApproachType }) {
  return <span className={`${base} ${approachTone[approach]}`}>{approach}</span>;
}

export function Tag({ children, onClick, active }: { children: string; onClick?: () => void; active?: boolean }) {
  const cls = `${base} font-mono ${active ? 'bg-accent/15 text-accent-text' : 'bg-subtle text-muted'} ${onClick ? 'hover:text-fg cursor-pointer' : ''}`;
  return onClick ? (
    <button type="button" className={cls} onClick={onClick}>
      #{children}
    </button>
  ) : (
    <span className={cls}>#{children}</span>
  );
}

export function ComplexityChip({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg px-2 py-0.5 text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </span>
  );
}
