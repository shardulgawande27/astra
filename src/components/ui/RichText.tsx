/** Renders plain text, preserving line breaks and turning `backticks` into inline code. */
export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(/(`[^`\n]+`)/g);
  return (
    <p className={`prose-text ${className}`}>
      {parts.map((p, i) =>
        p.startsWith('`') && p.endsWith('`') && p.length > 2 ? (
          <code key={i} className="rounded bg-subtle px-1 py-0.5 font-mono text-[0.85em]">
            {p.slice(1, -1)}
          </code>
        ) : (
          p
        ),
      )}
    </p>
  );
}
