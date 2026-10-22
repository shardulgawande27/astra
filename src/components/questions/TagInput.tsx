import { X } from 'lucide-react';
import { useState } from 'react';

export function TagInput({ value, onChange, id, suggestions = [] }: { value: string[]; onChange(tags: string[]): void; id?: string; suggestions?: string[] }) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const parts = raw
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    if (!parts.length) return;
    const lower = new Set(value.map((t) => t.toLowerCase()));
    const next = [...value];
    for (const p of parts) {
      if (!lower.has(p.toLowerCase()) && p.length <= 32) {
        next.push(p);
        lower.add(p.toLowerCase());
      }
    }
    onChange(next);
    setDraft('');
  };

  const listId = id ? `${id}-suggestions` : undefined;

  return (
    <div className="input-base flex min-h-9 flex-wrap items-center gap-1.5 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded bg-subtle px-1.5 py-0.5 font-mono text-xs">
          #{t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="text-muted hover:text-fg" aria-label={`Remove tag ${t}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        list={listId}
        onChange={(e) => {
          if (e.target.value.endsWith(',')) add(e.target.value);
          else setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        placeholder={value.length ? '' : 'array, hash map… (Enter or comma to add)'}
        className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
      />
      {listId && (
        <datalist id={listId}>
          {suggestions
            .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))
            .map((s) => (
              <option key={s} value={s} />
            ))}
        </datalist>
      )}
    </div>
  );
}
