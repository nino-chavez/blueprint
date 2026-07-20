import * as NavBar from '@blueprint/ui/navbar';
import { AudienceSwitcher, useAudiencePreference } from '@blueprint/ui';

// REPLACE_FOR_PROJECT_NAME — the initiative's display name (brand label).
// Stamped from blueprint.yml `name` at stamp time; matches the token the
// Layout uses for <title> / footer so the brand reads consistently.
const PROJECT_NAME = 'REPLACE_FOR_PROJECT_NAME';

// The legacy 7-verb IA spine — renders only when the initiative has NOT
// adopted the actor-output contract (Blueprint decisions/05). Once
// derived/portal-views.json exists, nav entries come from the manifest's
// declared views (reader-job labels) and this spine retires.
const VERBS = [
  { href: '/discover', label: 'Discover' },
  { href: '/try',      label: 'Try' },
  { href: '/build',    label: 'Build' },
  { href: '/operate',  label: 'Operate' },
  { href: '/inspect',  label: 'Inspect' },
  { href: '/roadmap',  label: 'Roadmap' },
  { href: '/strategy', label: 'Strategy' },
] as const;

export interface PortalNavProps {
  currentPath: string;
  /** Reader-job views from portalConfig().views — null on legacy consumers. */
  views?: { path: string; label: string }[] | null;
}

/**
 * Whole nav as a React island. Dual-mode: with derived views it renders the
 * reader-job nav (one declared viewer, one order — no audience switcher);
 * without them it renders the legacy verb spine + audience chip group. The
 * current entry is highlighted from the SSR-passed currentPath.
 */
export function PortalNav({ currentPath, views = null }: PortalNavProps) {
  const [audience, setAudience] = useAudiencePreference();
  const entries = views?.length
    ? views.map((v) => ({ href: v.path, label: v.label }))
    : VERBS.map((v) => ({ href: v.href, label: v.label }));

  return (
    <NavBar.Root>
      <NavBar.Brand href="/">
        <img src="/project-logo.png" alt={PROJECT_NAME} className="h-5 w-5 object-contain" />
        <span>{PROJECT_NAME}</span>
      </NavBar.Brand>
      <NavBar.Switcher>
        {entries.map((entry) => (
          <NavBar.Item
            key={entry.href}
            href={entry.href}
            active={
              currentPath === entry.href || currentPath.startsWith(`${entry.href}/`)
            }
          >
            {entry.label}
          </NavBar.Item>
        ))}
      </NavBar.Switcher>
      {!views?.length && (
        <NavBar.Actions>
          <AudienceSwitcher value={audience} onChange={setAudience} />
        </NavBar.Actions>
      )}
    </NavBar.Root>
  );
}
