import * as NavBar from '@blueprint/ui/navbar';

// Blueprint — the product brand. (This portal is Blueprint's own product site,
// a bespoke instance; the generic Initiative Portal reference lives in template/apps/portal.)
const PROJECT_NAME = 'Blueprint';

// Product nav — a linear adoption path, not an audience-routed lane switcher.
// Anchors jump to the home sections so the story stays on one page ("don't make
// people think"); Demo plays the live walkthrough; Strategy opens the strategy
// excerpts at /discover (labelled "Docs" before — that lied about the content).
const NAV = [
  { href: '/learn', label: 'Learn' },
  { href: '/try', label: 'Try' },
  { href: '/demo', label: 'Demo' },
  { href: '/#commands', label: 'Commands' },
  { href: '/#contribute', label: 'Contribute' },
  { href: '/discover', label: 'Strategy' },
  { href: '/graph', label: 'Graph' },
  { href: '/states', label: 'Machine' },
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
  // Active = exact or sub-path match on the item's own route, nothing more.
  // The old Strategy catch-all ("anything that isn't home/Learn/Demo") lit
  // Strategy + aria-current="page" on /compare, /faq, /roadmap (agency
  // audit 2026-06-11). Routes not in the nav show no active item; the hash
  // links never match because currentPath carries no fragment.
  const isActive = (href: string) =>
    !href.includes('#') && (currentPath === href || currentPath.startsWith(`${href}/`));

  return (
    <>
      <NavBar.Root>
        <NavBar.Brand href="/">
          <img src="/project-logo.svg" alt={PROJECT_NAME} className="h-5 w-5 object-contain" />
          <span>{PROJECT_NAME}</span>
        </NavBar.Brand>
        <NavBar.Switcher>
          {NAV.map((item) => (
            <NavBar.Item key={item.href} href={item.href} active={isActive(item.href)}>
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
          on mobile every NAV destination must still be reachable from the
          chrome, so they render as a wrapped row under the bar (no JS, fits
          the sparse chrome better than a disclosure menu). Each link carries a
          44px min touch target via min-h-11 — the bare text rows measured 18px
          against the WCAG 2.5.5 / HIG minimum (agency audit 2026-06-11). */}
      <nav className="flex flex-wrap items-center justify-center gap-x-1 pb-1 md:hidden" aria-label="Primary, compact">
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className="inline-flex min-h-11 items-center px-2 font-mono text-[12px] uppercase tracking-wide text-contrast-500 transition-colors hover:text-brand"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </>
  );
}
