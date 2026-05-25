/**
 * EXAMPLE catalog file — copy to a real name (e.g. `phase-1.ts`,
 * `auth.ts`, `billing.ts`) and edit. Files starting with `_` are skipped
 * by the catalog loader so this never runs.
 *
 * A catalog file declares one or more `Capability[]` arrays. Every export
 * matching that shape is picked up automatically by `npm run derive`.
 *
 * The mental model:
 *   - Spec/BRD/roadmap says "X is shipped."
 *   - Catalog encodes the mechanical evidence for X.
 *   - `derive` runs the checks and writes COMPLIANT/PARTIAL/NON-COMPLIANT.
 *   - The rendered doc becomes the single source of truth for what is
 *     actually shipped, separate from what docs claim.
 *
 * Catalog files should group capabilities by domain (auth, billing, etc.)
 * or by spec section (BRD §3.1, epic-04, sprint-12). Keep each file under
 * ~30 capabilities so reviewers can scan it.
 */

import type { Capability } from '../types.ts';

export const exampleCapabilities: Capability[] = [
  {
    id: 'example-auth-magic-link',
    category: 'capability',
    description: 'Magic-link login flow exists with token verification',
    reference: 'BRD §2.1 / Auth ADR-003',
    derivation: [
      {
        type: 'file_exists',
        path: 'src/routes/auth/magic-link/+page.svelte',
        description: 'magic-link request page',
      },
      {
        type: 'file_exists',
        path: 'src/routes/auth/verify/+server.ts',
        description: 'token verification endpoint',
      },
      {
        type: 'grep_present',
        path: 'src/routes/auth/verify/+server.ts',
        pattern: 'verifyOtp|exchangeCodeForSession',
        description: 'endpoint verifies the token via Supabase',
      },
    ],
  },
  {
    id: 'example-billing-stripe-webhook',
    category: 'capability',
    description: 'Stripe webhook handler with signature verification',
    reference: 'BRD §4.2',
    derivation: [
      {
        type: 'file_exists',
        path: 'src/routes/api/webhooks/stripe/+server.ts',
      },
      {
        type: 'grep_present',
        path: 'src/routes/api/webhooks/stripe/+server.ts',
        pattern: 'constructEvent|verifyHeader',
        description: 'webhook signature is verified',
      },
      {
        type: 'schema_has_table',
        table: 'subscriptions',
        description: 'subscription persistence exists',
      },
    ],
  },
  {
    id: 'example-convention-no-raw-color-tokens',
    category: 'convention',
    description: 'Components use semantic CSS tokens, not raw color tokens',
    invert: true,
    derivation: [
      {
        type: 'grep_present',
        path: 'src/lib/components',
        pattern: 'var\\(--color-arena-(50|100|200|900)\\)',
        flags: 'g',
        description: 'find components using raw arena color tokens (anti-pattern)',
      },
    ],
  },
];
