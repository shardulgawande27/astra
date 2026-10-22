import { Database, Download, Moon, PackagePlus, Sun, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ImportDialog } from '../components/settings/ImportDialog';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { SAMPLE_QUESTIONS } from '../data/sampleQuestions';
import { exportAll } from '../lib/download';
import { formatBytes, pluralize } from '../lib/format';
import { applyImport } from '../lib/merge';
import { DATA_KEY, storageSizeBytes } from '../lib/storage';
import { useQuestions } from '../store/QuestionsContext';
import { useSettings } from '../store/SettingsContext';
import { EXPORT_VERSION } from '../types';

export function SettingsPage() {
  const { questions, replaceAll } = useQuestions();
  const { settings, setTheme } = useSettings();
  const toast = useToast();
  const [importOpen, setImportOpen] = useState(false);
  const [confirmSamples, setConfirmSamples] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const solutionCount = questions.reduce((n, q) => n + q.solutions.length, 0);
  const [size, setSize] = useState(0);
  useEffect(() => {
    // The provider persists in its own effect, which runs after this one; read on the next tick.
    const t = setTimeout(() => setSize(storageSizeBytes()), 0);
    return () => clearTimeout(t);
  }, [questions]);
  const missingSamples = useMemo(() => {
    const ids = new Set(questions.map((q) => q.id));
    return SAMPLE_QUESTIONS.filter((q) => !ids.has(q.id));
  }, [questions]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Appearance, backups, and data management." />

      <div className="space-y-6">
        <Section title="Appearance">
          <Row title="Theme" description="Dark is the default. Your choice is remembered in this browser.">
            <div className="flex rounded-md border border-border p-0.5" role="radiogroup" aria-label="Theme">
              {(
                [
                  ['dark', Moon, 'Dark'],
                  ['light', Sun, 'Light'],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  role="radio"
                  aria-checked={settings.theme === value}
                  onClick={() => setTheme(value)}
                  className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
                    settings.theme === value ? 'bg-subtle text-fg' : 'text-muted hover:text-fg'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <Section title="Backup & transfer">
          <Row
            title="Export all data"
            description={`Downloads a versioned JSON file (format v${EXPORT_VERSION}) with ${pluralize(questions.length, 'question')} and ${pluralize(solutionCount, 'solution')}.`}
          >
            <Button
              onClick={() => {
                exportAll(questions);
                toast.success('Backup downloaded.');
              }}
              disabled={questions.length === 0}
            >
              <Download /> Export JSON
            </Button>
          </Row>
          <Row title="Import from JSON" description="Validates the file, shows what will change, and lets you merge or replace before anything is saved.">
            <Button onClick={() => setImportOpen(true)}>
              <Upload /> Import JSON
            </Button>
          </Row>
          <p className="px-5 pb-4 text-xs text-muted">Individual questions can be exported from their page via the download button.</p>
        </Section>

        <Section title="Sample data">
          <Row
            title="Load sample questions"
            description={
              missingSamples.length
                ? `Adds ${pluralize(missingSamples.length, 'sample question')} you don’t currently have. Existing questions are never changed.`
                : 'All sample questions are already in your library.'
            }
          >
            <Button onClick={() => setConfirmSamples(true)} disabled={missingSamples.length === 0}>
              <PackagePlus /> Load samples
            </Button>
          </Row>
        </Section>

        <Section title="Storage">
          <div className="px-5 py-4 text-sm">
            <div className="mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-muted" />
              <span>
                {pluralize(questions.length, 'question')}, {pluralize(solutionCount, 'solution')} · {formatBytes(size)} in localStorage
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              Everything is stored only in this browser under the <code className="font-mono">{DATA_KEY}</code> key and saved automatically after every change.
              Clearing site data, using a private window, or switching browsers or devices means starting fresh, so export backups regularly. Other open Astra
              tabs stay in sync.
            </p>
          </div>
        </Section>

        <Section title="Danger zone" danger>
          <Row title="Delete all questions" description="Permanently removes every question and solution from this browser. Samples will not be re-added automatically.">
            <Button variant="danger" onClick={() => setConfirmClear(true)} disabled={questions.length === 0}>
              <Trash2 /> Delete all
            </Button>
          </Row>
        </Section>
      </div>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />

      <ConfirmDialog
        open={confirmSamples}
        tone="primary"
        title="Load sample questions?"
        message={`${pluralize(missingSamples.length, 'sample question')} will be added to your library.`}
        confirmLabel="Add samples"
        onCancel={() => setConfirmSamples(false)}
        onConfirm={() => {
          const out = applyImport(questions, structuredClone(SAMPLE_QUESTIONS), 'merge', 'existing');
          replaceAll(out.questions);
          setConfirmSamples(false);
          toast.success(`Added ${pluralize(out.added, 'sample question')}.`);
        }}
      />
      <ConfirmDialog
        open={confirmClear}
        title="Delete all questions?"
        message={
          <>
            This permanently deletes {pluralize(questions.length, 'question')} and {pluralize(solutionCount, 'solution')}. Export a backup first if you might need them.
          </>
        }
        confirmLabel="Delete everything"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          replaceAll([]);
          setConfirmClear(false);
          toast.success('All questions deleted.');
        }}
      />
    </div>
  );
}

function Section({ title, children, danger }: { title: string; children: ReactNode; danger?: boolean }) {
  return (
    <section className={`panel ${danger ? 'border-rose-500/30' : ''}`}>
      <h2 className={`border-b px-5 py-3 text-sm font-semibold ${danger ? 'border-rose-500/30 text-rose-600 dark:text-rose-400' : 'border-border'}`}>{title}</h2>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Row({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-0.5 text-xs text-muted">{description}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
