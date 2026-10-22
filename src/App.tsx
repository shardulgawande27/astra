import { FileQuestion } from 'lucide-react';
import { Link, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { buttonClass } from './components/ui/Button';
import { EmptyState } from './components/ui/EmptyState';
import { Dashboard } from './pages/Dashboard';
import { DryRunStudio } from './pages/DryRunStudio';
import { QuestionDetail } from './pages/QuestionDetail';
import { QuestionFormPage } from './pages/QuestionFormPage';
import { QuestionLibrary } from './pages/QuestionLibrary';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="questions" element={<QuestionLibrary key="all" title="All Questions" description="Every question in your knowledge base." />} />
        <Route path="questions/new" element={<QuestionFormPage />} />
        <Route path="questions/:id" element={<QuestionDetail />} />
        <Route path="questions/:id/edit" element={<QuestionFormPage />} />
        <Route path="dsa" element={<QuestionLibrary key="dsa" title="DSA" description="Data structures and algorithms." category="DSA" />} />
        <Route path="javascript" element={<QuestionLibrary key="js" title="JavaScript" description="Language internals, async, and polyfills." category="JavaScript" />} />
        <Route path="react" element={<QuestionLibrary key="react" title="React" description="Hooks, rendering, and patterns." category="React" />} />
        <Route path="bookmarks" element={<QuestionLibrary key="bookmarks" title="Bookmarks" description="Questions you flagged for revision." bookmarkedOnly />} />
        <Route path="studio" element={<DryRunStudio />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="*"
          element={
            <EmptyState
              icon={FileQuestion}
              title="Page not found"
              description="That page doesn’t exist."
              action={
                <Link to="/" className={buttonClass('secondary')}>
                  Go to dashboard
                </Link>
              }
            />
          }
        />
      </Route>
    </Routes>
  );
}
