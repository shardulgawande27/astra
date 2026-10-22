import { Bookmark, FilterX, Library, Plus, Search, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QuestionRow } from '../components/questions/QuestionRow';
import { Button, buttonClass } from '../components/ui/Button';
import { EmptyState, PageHeader } from '../components/ui/EmptyState';
import { Select } from '../components/ui/Field';
import { DEFAULT_FILTERS, filterQuestions, SORT_OPTIONS, sortQuestions, uniqueSorted, type QuestionFilters, type SortKey } from '../lib/filters';
import { pluralize } from '../lib/format';
import { useQuestions } from '../store/QuestionsContext';
import { CATEGORIES, DIFFICULTIES, STATUSES, type Category } from '../types';

export function QuestionLibrary({
  title,
  description,
  category,
  bookmarkedOnly = false,
}: {
  title: string;
  description: string;
  category?: Category;
  bookmarkedOnly?: boolean;
}) {
  const { questions } = useQuestions();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const [filters, setFilters] = useState<Omit<QuestionFilters, 'query'>>({
    ...DEFAULT_FILTERS,
    category: category ?? 'all',
    bookmarkedOnly,
  });
  const [sort, setSort] = useState<SortKey>('updated');

  const scoped = useMemo(
    () => questions.filter((q) => (!category || q.category === category) && (!bookmarkedOnly || q.bookmarked)),
    [questions, category, bookmarkedOnly],
  );
  const topics = useMemo(() => uniqueSorted(scoped.map((q) => q.topic)), [scoped]);
  const tags = useMemo(() => uniqueSorted(scoped.flatMap((q) => q.tags)), [scoped]);

  const visible = useMemo(
    () => sortQuestions(filterQuestions(scoped, { ...filters, query }), sort),
    [scoped, filters, query, sort],
  );

  const setQuery = (q: string) => {
    const next = new URLSearchParams(params);
    if (q) next.set('q', q);
    else next.delete('q');
    setParams(next, { replace: true });
  };
  const set = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => setFilters((f) => ({ ...f, [key]: value }));

  const activeFilterCount =
    (query ? 1 : 0) +
    (!category && filters.category !== 'all' ? 1 : 0) +
    (filters.difficulty !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.topic ? 1 : 0) +
    (filters.tag ? 1 : 0) +
    (!bookmarkedOnly && filters.bookmarkedOnly ? 1 : 0);

  const clearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS, category: category ?? 'all', bookmarkedOnly });
    setQuery('');
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Link to="/questions/new" className={buttonClass('primary')}>
            <Plus /> New question
          </Link>
        }
      />

      {scoped.length === 0 ? (
        <div className="panel">
          {bookmarkedOnly ? (
            <EmptyState
              icon={Bookmark}
              title="No bookmarks yet"
              description="Bookmark questions you want to revise — they’ll appear here."
              action={
                <Link to="/questions" className={buttonClass('secondary')}>
                  Browse questions
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon={Library}
              title={category ? `No ${category} questions yet` : 'Your library is empty'}
              description="Add your first question. You can save it before you’ve solved it."
              action={
                <Link to="/questions/new" className={buttonClass('primary')}>
                  <Plus /> Add question
                </Link>
              }
            />
          )}
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Filter ${title.toLowerCase()}…`}
                className="input-base h-9 pl-9"
                aria-label="Filter questions"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              {!category && (
                <Select value={filters.category} onChange={(e) => set('category', e.target.value as QuestionFilters['category'])} aria-label="Category" className="sm:w-36">
                  <option value="all">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              )}
              <Select value={filters.difficulty} onChange={(e) => set('difficulty', e.target.value as QuestionFilters['difficulty'])} aria-label="Difficulty" className="sm:w-36">
                <option value="all">All difficulties</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
              <Select value={filters.status} onChange={(e) => set('status', e.target.value as QuestionFilters['status'])} aria-label="Status" className="sm:w-36">
                <option value="all">Any status</option>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
              <Select value={filters.topic} onChange={(e) => set('topic', e.target.value)} aria-label="Topic" className="sm:w-40" disabled={!topics.length}>
                <option value="">All topics</option>
                {topics.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
              <Select value={filters.tag} onChange={(e) => set('tag', e.target.value)} aria-label="Tag" className="sm:w-36" disabled={!tags.length}>
                <option value="">All tags</option>
                {tags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </Select>
              {!bookmarkedOnly && (
                <Button
                  variant={filters.bookmarkedOnly ? 'primary' : 'secondary'}
                  onClick={() => set('bookmarkedOnly', !filters.bookmarkedOnly)}
                  aria-pressed={filters.bookmarkedOnly}
                >
                  <Bookmark fill={filters.bookmarkedOnly ? 'currentColor' : 'none'} /> Bookmarked
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 lg:ml-auto">
              <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort by" className="sm:w-44">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>
              {visible.length === scoped.length
                ? pluralize(scoped.length, 'question')
                : `${visible.length} of ${pluralize(scoped.length, 'question')}`}
            </span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1 hover:text-fg">
                <FilterX className="h-3.5 w-3.5" /> Clear filters ({activeFilterCount})
              </button>
            )}
          </div>

          <div className="panel overflow-hidden">
            {visible.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No matching questions"
                description="Try a different search term or remove some filters."
                action={<Button onClick={clearFilters}>Clear filters</Button>}
                compact
              />
            ) : (
              <ul className="divide-y divide-border">
                {visible.map((q) => (
                  <QuestionRow key={q.id} question={q} showCategory={!category} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
