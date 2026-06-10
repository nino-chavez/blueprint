import * as NavBar from '@blueprint/ui/navbar';

// Blueprint — the product brand. (This portal is Blueprint's own product site,
// a bespoke instance; the generic Pattern A reference lives in template/apps/portal.)
const PROJECT_NAME = 'Blueprint';

// Product nav — a linear adoption path, not an audience-routed lane switcher.
// Anchors jump to the home sections so the story stays on one page ("don't make
// people think"); Docs opens the deeper reference portal.
const NAV = [
  { href: '/learn', label: 'Learn' },
  { href: '/#commands', label: 'Commands' },
  { href: '/#contribute', label: 'Contribute' },
  { href: '/discover', label: 'Docs' },
] as const;

const NPM_URL = 'https://www.npmjs.com/package/@nino-chavez-labs/blueprint-cli';

export interface PortalNavProps {
  currentPath: string;
}

/**
 * Product-site nav. Brand + linear path + npm link. No audience switcher —
 * that's a stakeholder-dashboard feature; a product homepage gives one path.
 */
export function PortalNav({ currentPath }: PortalNavProps) {
  const onLearn = currentPath === '/learn' || currentPath.startsWith('/learn/');
  const onDocs = currentPath !== '/' && currentPath !== '' && !onLearn;

  return (
    <>
      <NavBar.Root>
        <NavBar.Brand href="/">
          <img src="/project-logo.svg" alt={PROJECT_NAME} className="h-5 w-5 object-contain" />
          <span>{PROJECT_NAME}</span>
        </NavBar.Brand>
        <NavBar.Switcher>
          {NAV.map((item) => (
            <NavBar.Item
              key={item.href}
              href={item.href}
              active={(item.label === 'Learn' && onLearn) || (item.label === 'Docs' && onDocs)}
            >
              {item.label}
            </NavBar.Item>
          ))}
        </NavBar.Switcher>
        <NavBar.Actions>
          <a
            href={NPM_URL}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[12px] uppercase tracking-wide text-contrast-500 transition-colors hover:text-brand"
          >
            npm ↗
          </a>
        </NavBar.Actions>
      </NavBar.Root>
      {/* NavBar.Switcher is display:none below md with no hamburger behind it —
          on mobile the 4 destinations must still be reachable from the chrome,
          so they render as a wrapped row under the bar (no JS, fits the sparse
          chrome better than a disclosure menu). */}
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pb-2 md:hidden" aria-label="Primary, compact">
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="font-mono text-[12px] uppercase tracking-wide text-contrast-500 transition-colors hover:text-brand"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </>
  );
}
