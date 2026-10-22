import { CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { filterQuestions, DEFAULT_FILTERS, sortQuestions } from '../../lib/filters';
import { useQuestions } from '../../store/QuestionsContext';
import { CategoryBadge, DifficultyBadge, StatusIcon } from '../ui/Badges';

const MAX_RESULTS = 6;

export function GlobalSearch() {
  const { questions } = useQuestions();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return sortQuestions(filterQuestions(questions, { ...DEFAULT_FILTERS, query }), 'updated').slice(0, MAX_RESULTS);
  }, [questions, query]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showAll = () => {
    const q = query.trim();
    navigate(q ? `/questions?q=${encodeURIComponent(q)}` : '/questions');
    setOpen(false);
    inputRef.current?.blur();
  };

  const go = (id: string) => {
    navigate(`/questions/${id}`);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[active]) go(results[active].id);
            else showAll();
          } else if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        placeholder="Search questions, topics, tags…"
        className="input-base h-9 pl-9 pr-14"
        aria-label="Search all questions"
        role="combobox"
        aria-expanded={open && !!query.trim()}
        aria-controls="global-search-results"
        autoComplete="off"
      />
      <span className="kbd pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 sm:block">Ctrl K</span>

      {open && query.trim() && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-border bg-panel shadow-xl shadow-black/30"
        >
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted">No questions match “{query.trim()}”.</p>
          ) : (
            <ul className="py-1">
              {results.map((q, i) => (
                <li key={q.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(q.id)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${i === active ? 'bg-subtle' : ''}`}
                  >
                    <StatusIcon status={q.status} />
                    <span className="min-w-0 flex-1 truncate">{q.title}</span>
                    <span className="hidden sm:inline">
                      <CategoryBadge category={q.category} />
                    </span>
                    <DifficultyBadge difficulty={q.difficulty} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={showAll}
            className={`flex w-full items-center justify-between border-t border-border px-3 py-2 text-xs text-muted hover:text-fg ${
              active === results.length ? 'bg-subtle text-fg' : ''
            }`}
          >
            <span>See all results in library</span>
            <CornerDownLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
