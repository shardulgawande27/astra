import { classHighlighter, highlightCode } from '@lezer/highlight';
import { parser as jsParser } from '@lezer/javascript';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { CopyButton } from './CopyButton';

const parser = jsParser.configure({ dialect: 'jsx' });

type Token = { text: string; cls: string };

function tokenize(code: string): Token[][] {
  const lines: Token[][] = [[]];
  highlightCode(
    code,
    parser.parse(code),
    classHighlighter,
    (text, cls) => lines[lines.length - 1].push({ text, cls }),
    () => lines.push([]),
  );
  return lines;
}

export function CodeViewer({
  code,
  highlightLine,
  title,
  actions,
  maxHeight = '28rem',
  showCopy = true,
  emptyText = 'No code yet.',
}: {
  code: string;
  /** 1-based line to emphasise (used by the dry-run studio). */
  highlightLine?: number | null;
  title?: ReactNode;
  actions?: ReactNode;
  maxHeight?: string;
  showCopy?: boolean;
  emptyText?: string;
}) {
  const lines = useMemo(() => tokenize(code), [code]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gutter = String(lines.length).length;

  useEffect(() => {
    if (!highlightLine || !scrollRef.current) return;
    const el = scrollRef.current.querySelector<HTMLElement>(`[data-line="${highlightLine}"]`);
    if (!el) return;
    const box = scrollRef.current;
    const top = el.offsetTop;
    if (top < box.scrollTop + 24 || top > box.scrollTop + box.clientHeight - 48) {
      box.scrollTo({ top: Math.max(0, top - box.clientHeight / 3), behavior: 'smooth' });
    }
  }, [highlightLine]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg">
      {(title || actions || showCopy) && (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-panel px-3 py-1.5">
          <div className="min-w-0 truncate text-xs font-medium text-muted">{title ?? 'JavaScript'}</div>
          <div className="flex items-center gap-1">
            {actions}
            {showCopy && <CopyButton text={code} />}
          </div>
        </div>
      )}
      {code.trim() ? (
        <div ref={scrollRef} className="code-view relative overflow-auto py-2" style={{ maxHeight }}>
          <pre className="min-w-max font-mono text-[12.5px] leading-[1.6]">
            {lines.map((tokens, i) => {
              const n = i + 1;
              const active = n === highlightLine;
              return (
                <div
                  key={i}
                  data-line={n}
                  className={`flex pr-4 ${active ? 'bg-accent/15' : ''}`}
                  aria-current={active ? 'step' : undefined}
                >
                  <span
                    className={`sticky left-0 select-none bg-bg px-3 text-right ${active ? 'text-accent-text shadow-[inset_2px_0_0_rgb(var(--accent))]' : 'text-muted/60'}`}
                    style={{ minWidth: `${gutter + 2.5}ch` }}
                  >
                    {n}
                  </span>
                  <code className="whitespace-pre">
                    {tokens.length === 0 ? ' ' : tokens.map((t, j) => (t.cls ? <span key={j} className={t.cls}>{t.text}</span> : t.text))}
                  </code>
                </div>
              );
            })}
          </pre>
        </div>
      ) : (
        <p className="px-4 py-6 text-center text-sm text-muted">{emptyText}</p>
      )}
    </div>
  );
}
