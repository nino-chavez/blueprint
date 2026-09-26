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
        <p className="mb-1.5 font-mono text-[12px] uppercase tracking-wide text-contrast-400">
          {label}
        </p>
      )}
      <div className="flex items-start gap-3 rounded-lg border border-contrast-200 bg-contrast-100/60 px-4 py-3 sm:items-center">
        {/* min-w-0: a flex child defaults to min-width:auto and refuses to shrink
            below its nowrap content, which silently disables overflow-x-auto and
            drags the whole page wide on mobile (WCAG 1.4.10).
            Below sm: no scrollbar is reachable on a touch viewport, so a nowrap
            line just gets clipped by the box edge — the command reads truncated
            mid-word with the Copy button flush against the cut (cold-review D2).
            Wrap it instead: break-all so a single long flag/package-name token
            still wraps rather than forcing width, and items-start so Copy stays
            pinned to the first line instead of drifting to the wrapped block's
            vertical center. At sm+ there's room, so the line reverts to the
            original single-line-with-scroll behavior, unchanged. */}
        <code className="min-w-0 flex-1 whitespace-normal break-all font-mono text-sm text-foreground sm:overflow-x-auto sm:whitespace-nowrap sm:break-normal">
          {prompt && <span className="select-none text-contrast-400">{prompt} </span>}
          {command}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied to clipboard' : 'Copy command to clipboard'}
          className="shrink-0 rounded-md border border-contrast-200 bg-background px-2.5 py-1 font-mono text-[12px] uppercase tracking-wide text-contrast-500 transition-colors hover:border-brand/60 hover:text-brand"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
