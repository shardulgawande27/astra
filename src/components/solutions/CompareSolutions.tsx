import { useState } from 'react';
import type { Question } from '../../types';
import { CodeViewer } from '../code/CodeViewer';
import { ApproachBadge } from '../ui/Badges';
import { Modal } from '../ui/Modal';

const MAX_COLUMNS = 3;

export function CompareSolutions({ question, onClose }: { question: Question; onClose(): void }) {
  const [selected, setSelected] = useState<string[]>(() => question.solutions.slice(0, MAX_COLUMNS).map((s) => s.id));
  const chosen = question.solutions.filter((s) => selected.includes(s.id));

  const toggle = (id: string) =>
    setSelected((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : xs.length >= MAX_COLUMNS ? xs : [...xs, id]));

  const rows: { label: string; get: (i: number) => string; mono?: boolean }[] = [
    { label: 'Time', get: (i) => chosen[i].timeComplexity, mono: true },
    { label: 'Space', get: (i) => chosen[i].spaceComplexity, mono: true },
    { label: 'Trade-offs', get: (i) => chosen[i].tradeoffs },
    { label: 'Approach', get: (i) => chosen[i].explanation },
  ];

  return (
    <Modal open onClose={onClose} size="xl" title="Compare solutions" description={question.title}>
      <fieldset className="mb-4">
        <legend className="mb-2 text-xs text-muted">Choose up to {MAX_COLUMNS} solutions</legend>
        <div className="flex flex-wrap gap-2">
          {question.solutions.map((s) => {
            const on = selected.includes(s.id);
            const disabled = !on && selected.length >= MAX_COLUMNS;
            return (
              <label
                key={s.id}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
                  on ? 'border-accent/60 bg-accent/10' : 'border-border'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <input type="checkbox" checked={on} disabled={disabled} onChange={() => toggle(s.id)} className="accent-[rgb(var(--accent))]" />
                <ApproachBadge approach={s.approach} />
                {s.title}
              </label>
            );
          })}
        </div>
      </fieldset>

      {chosen.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">Select at least one solution.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-subtle/60 text-left">
                <tr>
                  <th className="w-28 px-3 py-2 font-medium text-muted" />
                  {chosen.map((s) => (
                    <th key={s.id} className="px-3 py-2 font-medium">
                      <div className="flex items-center gap-2">
                        <ApproachBadge approach={s.approach} />
                        <span className="truncate">{s.title}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="px-3 py-2 text-left align-top text-xs font-medium text-muted">
                      {r.label}
                    </th>
                    {chosen.map((s, i) => (
                      <td key={s.id} className={`px-3 py-2 align-top ${r.mono ? 'font-mono' : 'text-fg/85'}`}>
                        {r.get(i) || <span className="text-muted">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`mt-4 grid gap-3 ${chosen.length > 1 ? 'lg:grid-cols-2' : ''} ${chosen.length > 2 ? 'xl:grid-cols-3' : ''}`}>
            {chosen.map((s) => (
              <div key={s.id} className="min-w-0">
                <CodeViewer code={s.code} title={s.title} maxHeight="24rem" />
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
