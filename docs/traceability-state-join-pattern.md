# Traceability × State Join Pattern

**Purpose:** Wire `_state.json` (capability/AC check results from state-derive) into the traceability registry so the matrix shows a complete spec → prototype → implemented pipeline in one view.

**Extracted from:** `subs-initiative` session 2026-05-16.

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
- "What's actually shipped?" — implemented count

---

## Operationalizing

This pattern is only as good as the `_state.json` refresh cadence. In `subs-initiative`, state-derive runs on every push to main via `derive-state-on-main.yml`. The registry generator also runs on every push (via a separate workflow). Both outputs commit back to the repo so the traceability matrix at `private-demo.example/traceability` always reflects HEAD.

Wire the same two workflows in your initiative at bootstrap time, not as an afterthought.
