import * as NavBar from '@blueprint/ui/navbar';
import { AudienceSwitcher, useAudiencePreference } from '@blueprint/ui';

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
}

/**
 * Whole nav as a React island. Owns audience preference state; renders
 * brand + verb switcher + audience chip group. The current verb is
 * highlighted from the SSR-passed currentPath.
 */
export function PortalNav({ currentPath }: PortalNavProps) {
  const [audience, setAudience] = useAudiencePreference();

  return (
    <NavBar.Root>
      <NavBar.Brand href="/">
        <img src="/subs-logo.png" alt="BC Subscriptions" className="h-5 w-5 object-contain" />
        <span>bc-subscriptions</span>
      </NavBar.Brand>
      <NavBar.Switcher>
        {VERBS.map((verb) => (
          <NavBar.Item
            key={verb.href}
            href={verb.href}
            active={
              verb.href === '/'
                ? currentPath === '/'
                : currentPath.startsWith(verb.href)
            }
          >
            {verb.label}
          </NavBar.Item>
        ))}
      </NavBar.Switcher>
      <NavBar.Actions>
        <AudienceSwitcher value={audience} onChange={setAudience} />
      </NavBar.Actions>
    </NavBar.Root>
  );
}
