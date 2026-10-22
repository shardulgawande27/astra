import { AlertCircle, AlertTriangle, FileJson, Upload } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { pluralize } from '../../lib/format';
import { analyzeImport, applyImport, type ConflictStrategy, type ImportMode } from '../../lib/merge';
import { parseJsonText, type ValidationResult } from '../../lib/validation';
import { useQuestions } from '../../store/QuestionsContext';
import { Button } from '../ui/Button';
import { ConfirmDialog, Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

type Valid = Extract<ValidationResult, { ok: true }>;

export function ImportDialog({ open, onClose }: { open: boolean; onClose(): void }) {
  const { questions, replaceAll } = useQuestions();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [parsed, setParsed] = useState<Valid | null>(null);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [strategy, setStrategy] = useState<ConflictStrategy>('imported');
  const [dragging, setDragging] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const reset = () => {
    setFileName('');
    setErrors([]);
    setParsed(null);
    setMode('merge');
    setStrategy('imported');
    if (fileRef.current) fileRef.current.value = '';
  };

  const close = () => {
    reset();
    onClose();
  };

  const readFile = async (file: File) => {
    setFileName(file.name);
    setParsed(null);
    if (file.size > MAX_FILE_BYTES) {
      setErrors([`File is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is 10 MB.`]);
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setErrors(['Could not read the file.']);
      return;
    }
    const res = parseJsonText(text);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    if (res.questions.length === 0) {
      setErrors(['The file is valid but contains no questions.']);
      return;
    }
    setErrors([]);
    setParsed(res);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void readFile(file);
  };

  const analysis = parsed ? analyzeImport(questions, parsed.questions) : null;

  const apply = () => {
    if (!parsed) return;
    const out = applyImport(questions, parsed.questions, mode, strategy);
    replaceAll(out.questions);
    toast.success(
      mode === 'replace'
        ? `Replaced library with ${pluralize(out.added, 'question')}.`
        : `Imported: ${out.added} added, ${out.updated} updated, ${out.skipped} kept as-is.`,
    );
    close();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={close}
        title="Import questions"
        description="Load an Astra JSON backup or a single-question export. Nothing is saved until you confirm."
        footer={
          <>
            <Button onClick={close}>Cancel</Button>
            {parsed && (
              <Button variant={mode === 'replace' ? 'danger' : 'primary'} onClick={() => (mode === 'replace' ? setConfirmReplace(true) : apply())}>
                {mode === 'replace' ? 'Replace all data' : 'Import and merge'}
              </Button>
            )}
          </>
        }
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragging ? 'border-accent bg-accent/5' : 'border-border'
          }`}
        >
          <FileJson className="mb-2 h-6 w-6 text-muted" />
          <p className="text-sm">{fileName ? <span className="font-mono">{fileName}</span> : 'Drop a .json file here'}</p>
          <Button size="sm" className="mt-3" onClick={() => fileRef.current?.click()}>
            <Upload /> {fileName ? 'Choose another file' : 'Choose file'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readFile(f);
            }}
          />
        </div>

        {errors.length > 0 && (
          <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/5 p-3" role="alert">
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-rose-500">
              <AlertCircle className="h-4 w-4" /> This file can’t be imported
            </p>
            <ul className="max-h-48 list-disc space-y-0.5 overflow-y-auto pl-6 text-xs text-fg/80">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {parsed && analysis && (
          <div className="mt-4 space-y-4">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border text-sm sm:grid-cols-4">
              {[
                ['In file', pluralize(analysis.incoming, 'question')],
                ['Solutions', analysis.solutions],
                ['New', analysis.newCount],
                ['Same id as existing', analysis.conflictCount],
              ].map(([k, v]) => (
                <div key={k} className="bg-panel px-3 py-2">
                  <dt className="text-[11px] text-muted">{k}</dt>
                  <dd className="font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>

            {parsed.warnings.length > 0 && (
              <details className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
                <summary className="cursor-pointer text-amber-700 dark:text-amber-300">{pluralize(parsed.warnings.length, 'warning')} — the file was normalized</summary>
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-fg/80">
                  {parsed.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </details>
            )}

            <fieldset className="space-y-2">
              <legend className="mb-2 text-xs font-medium text-fg/80">How should this be imported?</legend>
              <Radio
                checked={mode === 'merge'}
                onChange={() => setMode('merge')}
                title="Merge with existing questions"
                description={`Keep your ${pluralize(analysis.existing, 'question')} and add the new ones.`}
              />
              {mode === 'merge' && analysis.conflictCount > 0 && (
                <div className="ml-7 space-y-2 border-l border-border pl-4">
                  <p className="text-xs text-muted">{pluralize(analysis.conflictCount, 'question')} already exist. For those:</p>
                  <Radio small checked={strategy === 'imported'} onChange={() => setStrategy('imported')} title="Overwrite with the imported version" />
                  <Radio small checked={strategy === 'existing'} onChange={() => setStrategy('existing')} title="Keep my current version" />
                </div>
              )}
              <Radio
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
                title="Replace everything"
                description="Delete all current questions and use only the file’s contents."
              />
            </fieldset>

            {mode === 'replace' && analysis.existing > 0 && (
              <p className="flex items-start gap-2 rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {pluralize(analysis.existing, 'existing question')} will be permanently removed. Export a backup first if unsure.
              </p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmReplace}
        title="Replace all data?"
        message={
          <>
            This removes your {pluralize(questions.length, 'question')} and replaces them with {pluralize(parsed?.questions.length ?? 0, 'question')} from{' '}
            <span className="font-mono">{fileName}</span>. This cannot be undone.
          </>
        }
        confirmLabel="Replace all"
        onCancel={() => setConfirmReplace(false)}
        onConfirm={() => {
          setConfirmReplace(false);
          apply();
        }}
      />
    </>
  );
}

function Radio({ checked, onChange, title, description, small }: { checked: boolean; onChange(): void; title: string; description?: string; small?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-md ${small ? '' : `border p-3 ${checked ? 'border-accent/60 bg-accent/5' : 'border-border'}`}`}>
      <input type="radio" checked={checked} onChange={onChange} className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" />
      <span>
        <span className={`block ${small ? 'text-xs' : 'text-sm font-medium'}`}>{title}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}
