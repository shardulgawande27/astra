import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        if (await copyText(text)) setCopied(true);
        else toast.error('Could not copy to clipboard.');
      }}
      aria-label={copied ? 'Copied' : `${label} code`}
      disabled={!text}
    >
      {copied ? <Check className="text-emerald-500" /> : <Copy />}
      {copied ? 'Copied' : label}
    </Button>
  );
}
