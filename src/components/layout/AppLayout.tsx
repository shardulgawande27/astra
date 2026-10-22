import { Menu, Moon, Plus, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useQuestions } from '../../store/QuestionsContext';
import { useSettings } from '../../store/SettingsContext';
import { Button, buttonClass } from '../ui/Button';
import { GlobalSearch } from './GlobalSearch';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const { settings, toggleTheme } = useSettings();
  const { loadError } = useQuestions();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-full">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open navigation">
            <Menu />
          </Button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={settings.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={settings.theme === 'dark' ? 'Light theme' : 'Dark theme'}
            >
              {settings.theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
            <Link to="/questions/new" className={buttonClass('primary', 'md', 'max-sm:w-9 max-sm:px-0')} aria-label="New question">
              <Plus />
              <span className="hidden sm:inline">New question</span>
            </Link>
          </div>
        </header>
        {loadError && (
          <div className="border-b border-rose-500/30 bg-rose-500/10 px-6 py-2 text-sm text-rose-600 dark:text-rose-300" role="alert">
            {loadError}
          </div>
        )}
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
