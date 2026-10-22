import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '../components/ui/Toast';
import { nowIso } from '../lib/id';
import { DATA_KEY, loadQuestions, saveQuestions } from '../lib/storage';
import { validatePayload } from '../lib/validation';
import type { Question, Solution, Status } from '../types';

interface QuestionsContextValue {
  questions: Question[];
  loadError: string | null;
  getQuestion(id: string | undefined): Question | undefined;
  /** Insert or update a question; stamps `updatedAt`. */
  saveQuestion(question: Question): void;
  deleteQuestion(id: string): void;
  toggleBookmark(id: string): void;
  setStatus(id: string, status: Status): void;
  /** Insert or update a solution on a question. */
  saveSolution(questionId: string, solution: Solution): void;
  deleteSolution(questionId: string, solutionId: string): void;
  replaceAll(questions: Question[]): void;
}

const QuestionsContext = createContext<QuestionsContextValue | null>(null);

export function QuestionsProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [initial] = useState(() => loadQuestions());
  const [questions, setQuestions] = useState<Question[]>(initial.questions);
  const [loadError, setLoadError] = useState<string | null>(initial.error ?? null);
  const readOnly = useRef(initial.readOnly === true);
  const skipSave = useRef(true); // skip the initial render; data was just loaded

  useEffect(() => {
    if (initial.error) toast.error(initial.error);
  }, [initial.error, toast]);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (readOnly.current) return;
    try {
      saveQuestions(questions);
    } catch (err) {
      const quota = err instanceof DOMException && /quota/i.test(err.name + err.message);
      toast.error(
        quota
          ? 'Browser storage is full. Export a backup and remove some data — your latest change was not saved.'
          : 'Could not save to browser storage. Your latest change was not saved.',
      );
    }
  }, [questions, toast]);

  // Keep multiple tabs in sync. Changes from another tab must not be written back (it would loop).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DATA_KEY) return;
      if (e.newValue === null) {
        skipSave.current = true;
        setQuestions([]);
        return;
      }
      try {
        const res = validatePayload(JSON.parse(e.newValue));
        if (res.ok) {
          skipSave.current = true;
          setQuestions(res.questions);
          readOnly.current = false;
          setLoadError(null);
        }
      } catch {
        /* ignore malformed writes from elsewhere */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((id: string, fn: (q: Question) => Question) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...fn(q), updatedAt: nowIso() } : q)));
  }, []);

  const value = useMemo<QuestionsContextValue>(
    () => ({
      questions,
      loadError,
      getQuestion: (id) => (id ? questions.find((q) => q.id === id) : undefined),
      saveQuestion: (question) =>
        setQuestions((qs) => {
          const stamped = { ...question, updatedAt: nowIso() };
          return qs.some((q) => q.id === question.id) ? qs.map((q) => (q.id === question.id ? stamped : q)) : [...qs, stamped];
        }),
      deleteQuestion: (id) => setQuestions((qs) => qs.filter((q) => q.id !== id)),
      toggleBookmark: (id) => update(id, (q) => ({ ...q, bookmarked: !q.bookmarked })),
      setStatus: (id, status) => update(id, (q) => ({ ...q, status })),
      saveSolution: (questionId, solution) =>
        update(questionId, (q) => {
          const stamped = { ...solution, updatedAt: nowIso() };
          const exists = q.solutions.some((s) => s.id === solution.id);
          return {
            ...q,
            solutions: exists ? q.solutions.map((s) => (s.id === solution.id ? stamped : s)) : [...q.solutions, stamped],
          };
        }),
      deleteSolution: (questionId, solutionId) =>
        update(questionId, (q) => ({ ...q, solutions: q.solutions.filter((s) => s.id !== solutionId) })),
      replaceAll: (next) => {
        readOnly.current = false;
        setLoadError(null);
        setQuestions(next);
      },
    }),
    [questions, loadError, update],
  );

  return <QuestionsContext.Provider value={value}>{children}</QuestionsContext.Provider>;
}

export function useQuestions(): QuestionsContextValue {
  const ctx = useContext(QuestionsContext);
  if (!ctx) throw new Error('useQuestions must be used inside QuestionsProvider');
  return ctx;
}
