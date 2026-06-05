import { useState } from 'react';

export interface CommandBlockProps {
  /** The exact command copied to the clipboard. */
  command: string;
  /** Leading prompt glyph; defaults to "$". Pass "" to omit (e.g. for code). */
  prompt?: string;
  /** Optional caption rendered above the block. */
  label?: string;
}

/**
 * A copy-paste command line. The whole point of a product site: a visitor
 * never retypes a command — one click, it's on their clipboard. Client island
 * (needs the clipboard API + transient "Copied" state).
 */
export function CommandBlock({ command, prompt = '$', label }: CommandBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable (insecure context) — no-op, the text is still selectable */
    }
  };

  return (
    <div>
      {label && (
        <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-contrast-400">
          {label}
        </p>
      )}
      <div className="flex items-center gap-3 rounded-lg border border-contrast-200 bg-contrast-100/60 px-4 py-3">
        <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm text-foreground">
          {prompt && <span className="select-none text-contrast-400">{prompt} </span>}
          {command}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied to clipboard' : 'Copy command to clipboard'}
          className="shrink-0 rounded-md border border-contrast-200 bg-background px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-contrast-500 transition-colors hover:border-brand/60 hover:text-brand"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
