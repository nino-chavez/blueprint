# Traceability × State Join Pattern

**Purpose:** Wire `_state.json` (capability/AC check results from state-derive) into the traceability registry so the matrix shows a complete spec → prototype → artifacts-present pipeline in one view.

**Extracted from:** `subs-initiative` session 2026-05-16.

> **Scope caveat (wave 52):** `implementationStatus: compliant` is a **presence** signal — state-derive's checks are all static, so "compliant" means the expected code artifacts exist (DoD gate 3), not that the story works or passes its ACs (gates 4–5). subs-initiative proved this the hard way: two artifacts both COMPLIANT, joined by a mismatched selector, feature broken. Render this column as "present," never "shipped/done." See `template/docs/methodology/dod-verification-ladder-pattern.md`.

---

## The Problem

Without this join, the traceability matrix has four metrics that tell disconnected stories:

| Metric | What it actually measures |
|---|---|
| Total entries | Every heading parsed from BRD/PRD/decisions |
| With prototype | Entries with ≥1 prototype page linked |
| Demo-worthy | Entries whose kind is story/epic/decision |
| Coverage gaps | Demo-worthy with no prototype page |

None of these answer "is this story implemented?" The spec-to-prototype axis is visible; the prototype-to-shipped axis is not.

---

## The Solution

`generate-registry.mjs` reads `docs/audits/_state.json` alongside its doc/slice scans. For each `brd-story` entry, it finds all capability checks whose `reference` field starts with `BRD.md §US-X.Y:` and rolls them up into a single `implementationStatus`:

| Value | Meaning |
|---|---|
| `compliant` | Every AC check for this story is COMPLIANT |
| `partial` | Mix of COMPLIANT and MANUAL_REVIEW |
| `manual_review` | All checks are MANUAL_REVIEW (no automated verification yet) |
| `null` | Story has no capability checks in `_state.json` |

Each entry also gets `implementationCapabilityCount` — the total number of AC checks that cover it.

---

## Join Key Convention

The join works because `_state.json` capability references follow this format:

```
BRD.md §US-1.1: Given I click "Install" from the BC Marketplace, When…
```

The regex `BRD\.md §(US-[\d.]+):` extracts `US-1.1` as the join key, which matches the traceability entry `id` field exactly.

**This means:** when writing new capability checks in your initiative's `state-derive` catalog, the `reference` field on every BRD story check must include `BRD.md §US-X.Y:` as a prefix. That's the contract.

---

## Implementation

### `generate-registry.mjs` addition

Add after the GitHub state snapshot loader:

```js
function loadStateJoinMap() {
  const statePath = path.join(REPO_ROOT, 'docs', 'audits', '_state.json');
  if (!fs.existsSync(statePath)) return new Map();
  let data;
  try {
    data = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  } catch (err) {
    console.warn(`  warning: failed to parse _state.json: ${err.message}`);
    return new Map();
  }
  const refPattern = /BRD\.md §(US-[\d.]+):/;
  const byStory = new Map();
  for (const cap of data.capabilities ?? []) {
    const ref = cap.capability?.reference ?? '';
    const m = refPattern.exec(ref);
    if (!m) continue;
    const storyId = m[1];
    if (!byStory.has(storyId)) byStory.set(storyId, { compliant: 0, manual: 0 });
    const counts = byStory.get(storyId);
    if (cap.status === 'COMPLIANT') counts.compliant++;
    else counts.manual++;
  }
  const result = new Map();
  for (const [id, { compliant, manual }] of byStory) {
    const total = compliant + manual;
    let status;
    if (compliant > 0 && manual === 0) status = 'compliant';
    else if (compliant > 0 && manual > 0) status = 'partial';
    else status = 'manual_review';
    result.set(id, { status, capabilityCount: total });
  }
  return result;
}
```

In `build()`, load the map and inject after all other passes:

```js
const stateJoinMap = loadStateJoinMap();

// ... existing passes ...

// Inject implementation status from _state.json
for (const entry of byId.values()) {
  entry.implementationStatus = null;
  entry.implementationCapabilityCount = 0;
  if (entry.kind !== 'brd-story') continue;
  const join = stateJoinMap.get(entry.id);
  if (!join) continue;
  entry.implementationStatus = join.status;
  entry.implementationCapabilityCount = join.capabilityCount;
}
```

### TraceabilityMatrix.tsx additions

Add to the `Entry` interface:

```ts
implementationStatus?: 'compliant' | 'partial' | 'manual_review' | null;
implementationCapabilityCount?: number;
```

Add a 5th KPI card alongside the existing four:

```tsx
<KpiCard>
  <Small color="secondary70" style={{ fontSize: 11 }}>IMPLEMENTED</Small>
  <Text bold marginBottom="none" style={{ fontSize: 24, color: theme.colors.success }}>
    {stats.implemented}
  </Text>
  <Small color="secondary70" style={{ fontSize: 11 }}>
    of {stats.stories} stories · {stats.partial} partial
  </Small>
</KpiCard>
```

Add per-row chip with tooltip showing AC check count. Add filter options: "Implemented (all AC compliant)" and "Not fully implemented (stories)".

---

## Result

The matrix now shows a complete 5-metric pipeline:

```
414 spec entries → 172 with prototype → 260 demo-worthy → 91 coverage gaps → 47 implemented
```

Combined with the phase filter (Phase 1 = 100% prototype coverage), the matrix answers:
- "What's designed?" — with prototype count
- "What's spec-worthy?" — demo-worthy count  
- "What's missing a screen?" — coverage gaps
- "What has its expected artifacts in place?" — implemented count (presence, gate 3 — not "works")

---

## Operationalizing

This pattern is only as good as the `_state.json` refresh cadence. In `subs-initiative`, state-derive runs on every push to main via `derive-state-on-main.yml`. The registry generator also runs on every push (via a separate workflow). Both outputs commit back to the repo so the traceability matrix at `private-demo.example/traceability` always reflects HEAD.

Wire the same two workflows in your initiative at bootstrap time, not as an afterthought.

### Gotcha: `[skip ci]` rederives silently starve the dashboards

The rederive-and-commit workflow commits its derived outputs with **`[skip ci]`** in the message — deliberately, to avoid retriggering itself and racing parallel pushes. But `[skip ci]` suppresses **every** push-triggered workflow for that commit, including the **dashboard deploys** whose path filters include the very derived files (`_state.json`, `_board.json`) the dashboards read.

The result is a silent staleness loop: the rederive *updates the committed state the dashboard reads*, but the dashboard *never rebuilds* — so it lags every release until some unrelated push to a dashboard path happens to fire its deploy. The dashboard looks authoritative while showing pre-release numbers. (Observed: a register-consuming "look under the hood" page stuck several rederives behind, showing a stale ADR count and pre-flip gate statuses.)

**Fix — the rederive that *causes* the staleness explicitly re-triggers the deploys.** Add a final step to the rederive workflow, gated on "state actually changed", that calls `workflow_dispatch` on each dashboard deploy (which `[skip ci]` does *not* gate, since it's an explicit API call, not a push event):

```yaml
permissions:
  actions: write          # to re-trigger the dashboard deploys
# … after the [skip ci] commit + push …
- name: Re-trigger dashboard deploys (state changed → dashboards must rebuild)
  if: steps.diff.outputs.changed == 'true'
  continue-on-error: true   # a deploy-trigger failure must not fail the derive
  env: { GH_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
  run: |
    for wf in deploy-portal.yml deploy-program.yml; do
      gh workflow run "$wf" --ref main || echo "::warning::could not trigger $wf"
    done
```

Corollary: **give the rederive workflow a `workflow_dispatch` trigger** so it (and thus the whole derive→deploy chain) can be forced on demand — otherwise an operator who needs the dashboards current *now* has no lever but a no-op commit.
