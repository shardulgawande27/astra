import {
  Atom,
  Bookmark,
  Braces,
  Code2,
  LayoutDashboard,
  Library,
  PlayCircle,
  Settings,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuestions } from '../../store/QuestionsContext';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  end?: boolean;
}

export function Sidebar({ open, onClose }: { open: boolean; onClose(): void }) {
  const { questions } = useQuestions();

  const counts = useMemo(() => {
    const c = { all: questions.length, DSA: 0, JavaScript: 0, React: 0, bookmarks: 0 };
    for (const q of questions) {
      c[q.category]++;
      if (q.bookmarked) c.bookmarks++;
    }
    return c;
  }, [questions]);

  const groups: { label?: string; items: NavItem[] }[] = [
    { items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
    {
      label: 'Library',
      items: [
        { to: '/questions', label: 'All Questions', icon: Library, count: counts.all, end: true },
        { to: '/dsa', label: 'DSA', icon: Code2, count: counts.DSA },
        { to: '/javascript', label: 'JavaScript', icon: Braces, count: counts.JavaScript },
        { to: '/react', label: 'React', icon: Atom, count: counts.React },
      ],
    },
    {
      label: 'Practice',
      items: [
        { to: '/studio', label: 'Dry Run Studio', icon: PlayCircle },
        { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark, count: counts.bookmarks },
      ],
    },
    { items: [{ to: '/settings', label: 'Settings', icon: Settings }] },
  ];

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-panel transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Primary"
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-4">
          <NavLink to="/" className="flex items-center gap-2" onClick={onClose}>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15">
              <Sparkles className="h-4 w-4 text-accent-text" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Astra</span>
          </NavLink>
          <button className="rounded p-1 text-muted hover:text-fg lg:hidden" onClick={onClose} aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {groups.map((g, i) => (
            <div key={i} className={i > 0 ? 'mt-4' : ''}>
              {g.label && <div className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted/80">{g.label}</div>}
              <ul className="space-y-0.5">
                {g.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors ${
                          isActive ? 'bg-subtle font-medium text-fg' : 'text-muted hover:bg-subtle/60 hover:text-fg'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={`h-4 w-4 ${isActive ? 'text-accent-text' : ''}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.count !== undefined && <span className="font-mono text-[11px] text-muted">{item.count}</span>}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border px-4 py-3 text-[11px] leading-relaxed text-muted">
          Saved locally in this browser. Back up from <NavLink to="/settings" onClick={onClose} className="text-accent-text hover:underline">Settings</NavLink>.
        </div>
      </aside>
    </>
  );
}
