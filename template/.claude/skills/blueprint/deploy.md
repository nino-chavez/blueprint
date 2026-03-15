# /blueprint-deploy

Deployment phase of a the original employer-prefixed name initiative. Packages prototype + docs as a Vercel site.

## When to use
After prototype and docs are built and validated.

## What it does

1. **Copy deliverables to prototype** — Move HTML doc files to `prototype/docs-*.html`
2. **Update landing page** — Ensure `prototype/index.html` links to all docs and prototype flows
3. **Deploy to Vercel** — `cd prototype && vercel --prod`
4. **Verify** — Open the deployed URL and check:
   - All doc links work
   - All prototype pages load
   - Strategy panels open on each page
   - Current-state panels show correct screenshots
   - Footer navigation works across all pages
   - Chat widget connects (if enabled)

## Output
- Deployed URL (e.g., `my-initiative.vercel.app`)
- This is the primary deliverable — share this one link with all stakeholders
