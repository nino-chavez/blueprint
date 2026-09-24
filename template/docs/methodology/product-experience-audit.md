---
canonical: true
status: pilot
---

# Product experience audit

Use this procedure to determine whether people can understand and complete the
jobs an existing product promises. Audit real journeys, the screens encountered
along them, and the product's visual character. A route inventory alone does
not answer those questions.

**Status:** a documented procedure for scoped use. It adds no stage, schema
field, automatic pass, or blocking reviewer. Record pilot results before
proposing executable checks. An audit report is evidence of the audit's
findings, not evidence that the proposed fixes have shipped.

## Ownership and stage boundaries

Blueprint owns this procedure. `/blueprint-research` is its entry point. A
client-site playbook such as Forge-site can call it during Recon and consume
its findings; it does not need another copy of the procedure.

For an audit-first initiative, use `variant: brownfield` and the existing stages:

| Stage | Work and output |
|---|---|
| 0 — Application Legibility | Establish access, observe the live product, capture reproducible states. |
| 1 — Diagnose | Run the reviews below. End `01-diagnose.md` with evidenced, named gaps and coverage limits. |
| 2 — Prescription | In `02-prescription.yml`, tie proposed changes and acceptance checks to finding IDs. When proceeding to design, declare the selected `design_intent` in `blueprint.yml`: `preserve`, `refit`, or `rethink`. |
| 3 — Design Brief | In `03-design-brief.md`, define the direction for the prescribed changes. Follow the existing design-intent requirements for briefs, concepts, and selection. |
| 4 — Prototype, when justified | Render the proposed experience on representative states. |
| 5 — Fact-Check | Verify the claims and the proposed result, including when no prototype was needed. |

Stage numbers follow the initiative's variant. In brownfield, declare the
design intent during Stage 2 Prescription; fulfill its brief, concept, and
selection obligations during Stage 3 Design Brief. The judged-screen pattern's
general Stage 2 design references do not move those obligations into Diagnose.
An audit-only request can end with a diagnosis without declaring a redesign
intent. Undeclared does not mean `preserve`. This procedure does not renumber
the stage model. A targeted audit can
also supply evidence to an existing midstream initiative without changing its
variant or restarting its lifecycle.

The [surface and component audit](../../methodology/design/audit-template.md)
remains the inventory subtrack. Its exclusions of brand identity and specialist
accessibility work bound that inventory, not this broader audit. Diagnose the
current art direction and accessibility here; create a replacement identity
or design system only in the subsequent authorized design work.

## Establish the scope and access

Start by stating the intended outcome, the people involved, their jobs, and the
assumptions. Inventory available browser/device tools, existing captures,
accounts, environments, and domain records. Ask only for information or
authorization that cannot be obtained or reasonably inferred. Honor permission
already provided; do not add a confirmation pause to routine, reversible work.

Write a brief naming:

- The product, target environment/build, audit boundary, and intended reader.
- The jobs and consequential decisions each role must complete.
- The screens, journeys, devices, appearances, and states to cover.
- The available tools, access limits, authorized synthetic mutations, and
  actions that still require the owner's decision.
- Which review tracks below are in scope. A comprehensive request includes
  every track; record a specific reason for any exclusion or unavailable check.
- The success criteria, review assignments, and evidence locations.

Separate the person preparing access from the person forming a cold verdict.
Environment instructions and necessary safety constraints may be read during
setup. A session that has read product code, prior conclusions, or design intent
cannot later describe its own review as blind. Use a fresh reviewer for that
part, or label the review informed and leave the cold review pending.

Identify the environment behind a local URL before changing data. Use owned
synthetic identities and authorized test resources. Confine messages and
payments to the approved destinations and test modes. Keep credentials, login
tokens, and unrelated personal data out of review packets. Ask before a
consequential action outside the authorization already given.

## Observe the product before explaining it

Walk the entry paths and primary jobs as a person would, through the frontend.
Record what the interface makes discoverable, what requires guessing, and what
happens after each meaningful action. Capture the initial observations before
consulting implementation details, prior audit verdicts, or competitor designs.

Walk journeys rather than collecting one screenshot per route. A single route
may contain several decisions, dialogs, loading states, and role-dependent
controls. Conversely, repeated screens can share a finding. Inventory all
distinct surfaces and material states in scope, and explicitly justify any
representative sampling. Do not claim every function was tested from one happy
path or from seeing its control.

If no screenshots exist, produce them during the walk. If authentication, bot
verification, or another entry barrier fails, preserve the visible failure and
the attempted recovery. Check whether it also affects ordinary use when that
can be observed. Distinguish a tool limitation from a product failure; do not
bypass the barrier or label the inaccessible screens defective by inference.
Continue with independent reachable work and identify the smallest remaining
access dependency.

### Simulate distinct roles and realistic conditions

Build a scenario matrix from the product's real operating records and stated
rules. Label inferred or invented cases. Use separate application identities
for different permissions. One workflow driver can operate several identities;
one model agent per synthetic person is unnecessary.

For a tournament product, the roles may include organizer, captain, player,
scorekeeper, and spectator. A realistic baseline may require uneven team counts,
multiple courts, pool-to-bracket progression, roster changes, late arrivals,
withdrawals, forfeits, corrections, tied standings, delayed schedules, and
completion. Derive which cases apply from the actual event format. Another
product should substitute its own roles, lifecycle, and exceptions.

Include, when applicable:

- Signed-out entry, invitation, sign-in, verification/terms, expired links,
  session recovery, and switching accounts on a shared device.
- Creation, joining, editing, handoffs between roles, live changes, completion,
  and revisiting completed work.
- Empty, loading, populated, dense, invalid, denied, failed, and recovery states.
- Back/cancel, refresh, deep links, interruption, stale data, and conflicting
  changes from another authorized session.
- For native applications: permission grant/deny/revoke, foreground/background
  and termination/restore, offline/sync recovery, notification entry, and
  supported orientation changes. Use authorized test settings and identities.

Record the acting identity and verify it in the rendered product at role
transitions. After an action, check the resulting state in the relevant other
role. Keep a coherent event chronology. Use the frontend for the behavior under
test; setup APIs or fixtures may prepare prerequisites, but disclose every step
they replace. Synthetic execution does not measure real-user comprehension,
conversion, or satisfaction.

### Keep evidence tied to what it proves

The [judged-screen pattern](judged-screen-pattern.md) owns evidence authority:
rendered frames support appearance claims; observed actions support interaction
claims; accessibility trees and assistive-technology behavior support
accessibility claims; source and tests support implementation claims. Reuse its
capture and review records when the initiative already has them.

For each capture, record a stable ID, file path, timestamp, route/screen, role
and identity label (`anonymous` where appropriate), lifecycle state, environment/build where known,
device/browser, viewport, scroll position, appearance, accessibility settings,
and the actions used to reach it. Record whether data is live, seeded, or mocked.
Verify the actual rendered settings before relying on them. An unknown build
stays unknown. A desktop browser at a phone-sized viewport is an emulated
capture, not evidence of physical-phone acceptance.

Capture complete viewports for hierarchy judgments. Use additional crops for
specific defects, retaining the complete-screen reference. Cover supported
light/dark appearances, narrow/wide layouts, large text/zoom, increased contrast,
and reduced motion where relevant. Record unsupported or unavailable states;
do not manufacture them through styling changes and present them as shipped UI.
Screenshots cannot prove motion, keyboard behavior, or screen-reader operation.

Maintain a coverage ledger with the journey/state, role, expected result,
observed result, evidence IDs, assessment status, and remaining dependency.
Use statuses that distinguish assessed, failed, blocked, and not assessed.
Absence of evidence never becomes a pass.

## Run independent reviews, then add context

Freeze a versioned capture packet before review. Give the blind reviewer an
explicit image allowlist, a neutral description of the person's situation and
job, and a factual manifest subset: capture ID, device/viewport, appearance,
and accessibility settings. Do not ask the reviewer to infer those settings
from pixels. Keep action logs, lifecycle answers, prior findings, code, the
intended hierarchy, brand rules, competitor references, and evaluative
filenames/captions outside that packet. Neutral filenames such as
`07-large-text-dark.png` may identify the test condition without supplying a
verdict. Where the
runtime supports it, launch with no inherited conversation. If that isolation
is unavailable, disclose it rather than claiming a blind review occurred.

The lead must personally open the rendered evidence before issuing a visual
verdict. Another reviewer's account of looking is still secondhand evidence.
Preserve the first blind review unchanged. Later research may qualify it in a
separate informed review; it must not rewrite the initial observations.

### Blind screen review

For each image, in order, record its ID and appearance. Answer from the screen:

1. What is happening now?
2. What happens next?
3. Who is involved?
4. When and where is it?
5. What can this person do right now?

Write "not answered" where appropriate. Explain which questions matter to the
screen's job; a sign-in form need not answer the same questions as a live match.
Then name what the eye lands on first and what competes with it. This is a
first-glance judgment, not a measured five-second human usability test.

Ground the review in particular captures and visible labels. Cover hierarchy,
competing elements, a subtractive pass, apparent control meanings, copy,
typography/color/spacing/shape/depth, accessibility appearances, empty/failure
states, sheets/dialogs, and differences between supported appearances. Classify
each distinct element as correct, usable but visually weak, appealing but
functionally wrong, unnecessary, or defective. In an image-only review,
"functionally wrong" describes a misleading apparent meaning; actual behavior
remains unverified until observed.

Finish with one `ID-appearance: accept` or `ID-appearance: revise` verdict per
image and a reason. These are diagnostic screen verdicts, not functional or
release acceptance. If images look identical, say so. Be concrete and blunt;
do not add praise, infer code, or invent design intent.

The diagnostic packet alone does not satisfy `screen-composition-reviewer`.
When the initiative uses the judged-screen gate, or when this review becomes
the baseline for `rethink`, record the review using that pattern's canonical
surface/build record under `docs/evidence/screen-reviews/`, including its
frontmatter, aggregate verdict, capture references, and release-marker rules.
The per-image analysis can be the body of that record. Link it from the audit
packet; do not create a competing acceptance record or make a second review
claim from the same observation. An `accept` diagnostic verdict cannot close
an unrelated build's acceptance gate.

### Informed review tracks

After the blind verdict is preserved, combine the captures with journey
observations, domain records, applicable standards, and verified comparables.
Use prior audits as leads to recheck, never as current acceptance receipts.

| Track | Questions it must answer |
|---|---|
| Workflow and role boundaries | Can each role finish its jobs? Do handoffs, permissions, corrections, live updates, and recovery behave coherently across sessions? |
| Information architecture (IA) | Do navigation, grouping, naming, page hierarchy, search/filtering, and object relationships match how people find and understand their work? Are role, object type, and lifecycle state being confused? |
| Interaction design | Do controls match their apparent meaning? Are state changes, ownership, feedback, pending work, confirmation, reversal, defaults, focus, and error recovery understandable? |
| Gestalt and hierarchy | Do proximity, similarity, common region, connectedness, continuity, closure, figure/ground, and common motion group the right things? Do visual groups imply relationships the product does not have? |
| Copy and cognitive load | Does the encounter answer the person's immediate questions? What repeats, explains the app instead of the task, hides a decision, or requires remembering another screen? |
| Visual system | Are type, color, spacing, density, shape, depth, icons, responsive composition, motion, and appearances coherent across real content and states? |
| Art direction and creative design | What character does the rendered product actually have? Does it fit its audience and setting, feel distinctive, and remain coherent across operational and public surfaces? Is the direction evidenced, merely conventional, or absent? |
| Accessibility and web/app usability | What works under keyboard, touch, zoom/large text, contrast, reduced motion, and assistive technology? Check focus order/visibility, names/roles/states, errors, dialogs, target use, and alternatives to color or gestures. Identify applicable criteria and untested areas. |
| Domain and comparable products | How do live comparable products solve the same jobs and states? Which patterns transfer, which would harm this product, and why? |

**A source-grounded principle scan is one way to run the Gestalt/hierarchy and visual-system tracks.** Take principles from a named, cited source — a design-teaching video, a written standard, a prior audit — with timestamps or section references, and pair each principle with the product's own screen rather than a paraphrase of the source's general advice. Rank findings by the audience's actual question on that screen, not by which fix is easiest, and record which principles the screen already meets, not only the gaps. Two consumers ran this technique against a live site before any redesign work started; in both cases it produced direct fixes as well as evidence for a later `rethink` (`redesign-evaluation-pattern.md` § 8 and § 9 carry the citations). It is a Diagnose-stage technique, not a Stage-2 concept exercise — it does not substitute for the divergent concepts `judged-screen-pattern.md` § 2c requires when the intent is `rethink`.

Use existing review contracts where they fit:
[screen composition](../../.claude/agents/blueprint/reviewers/screen-composition-reviewer.md)
for rendered judgment,
[encounter audit](../../.claude/agents/blueprint/reviewers/encounter-audit-reviewer.md)
for copy/control comprehension,
[sibling scanning](../../.claude/agents/blueprint/reviewers/research-sibling-scanner.md)
for prior implementations, and
[reference grading](../../.claude/agents/blueprint/reviewers/research-reference-grader.md)
for comparables. Their mechanical
results cover only their implemented checks. They do not stand in for the
observed reviews above.

For standards work, consult current primary guidance for the target platform
and the named accessibility target, such as WCAG 2.2 AA for web work. Cite the
specific criterion and measured or observed condition. Distinguish a standards
failure, a usability heuristic, and a creative judgment. An automated scan is
one source of findings, not an accessibility certification.

For comparables, record the inspected URL/screen, date, role/access level, and
state. Compare equivalent jobs and realistic data density. Marketing captures
and inaccessible pages remain limited evidence. Treat competitor and vendor
claims as claims to verify; popularity does not establish good design. Separate
functional benchmarks from visual references, and explain any proposed transfer.

For art direction, first describe the rendered character without brand
rationales. Then inspect the product's owned identity sources and prior design
decisions. Name the mismatch, if any, between the observed result and the
intended audience, character, content, and setting. Missing documentation alone
does not prove weak design. Passing token checks does not prove strong design.
Borrow review methods from other products without borrowing their visual identity.

## Assign work by judgment and dependency

Use the host's current model-routing policy and available models. Record the
actual model, effort, evidence access, and responsibility in the run brief.
The following allocation is a starting hypothesis, not a benchmark or another
model registry:

| Responsibility | Capability tier | Starting effort |
|---|---|---|
| Lead: scope, reconciliation, verification, final recommendation | Strongest available reasoning model | High |
| Frontend simulation and capture | Balanced execution model | High |
| Blind screen judgment | Deep review model | High |
| Informed Gestalt and art-direction critique | Deep review model | High |
| IA, interaction, and product-model critique | Deep review model | High |
| Accessibility checks and competitor observation | Balanced execution model | High |
| Inventory, coverage indexing, evidence organization | Fast model | Medium |

Resolve those tiers through the runtime's existing routing policy. Blueprint's
`cost.model_tier` enum is defined by [cost-dial.mjs](../../tools/lib/cost-dial.mjs);
do not insert unsupported provider model names into it. Prefer a scoped effort
increase for an unresolved judgment over raising the whole session's effort.
Reassess assignments from observed failures and review quality.

Run dependent work in sequence and independent work in waves:

1. **Collect:** one driver owns mutations to each shared browser/event state.
   Inventory and separate competitor research may proceed independently.
2. **Review:** after capture, run independent visual/art-direction,
   IA/interaction, and accessibility/usability reviews. Split or combine bounded
   assignments to fit the available slots; reserve capacity for the lead.
3. **Reconcile:** the lead opens the evidence, reproduces consequential findings,
   resolves conflicts, and requests targeted follow-up observations.

Apply the [existing dispatch preflight](../../.claude/skills/blueprint/dispatch.md)
for file ownership and complete briefs, using the current host's routing and
the project's authorization for any subsequent publication or code changes.
Also assign ownership of browser sessions and shared data; disjoint report files
do not make concurrent UI mutations safe. Assistive-technology or additional
interaction checks go through the driver or an explicitly isolated environment.
Keep cold and informed outputs separate even if a worker is reused later.
With no parallel capacity, run the informed tracks serially and retain a fresh
context for the blind review. If no fresh context exists, record that gap.

## Produce one traceable diagnosis

Reuse existing evidence folders and manifests when possible. At the resolved
initiative root, use these brownfield locations:

| Location | Content |
|---|---|
| `research/current-state/experience-audit/<run-id>/` | Run brief, coverage ledger, capture manifest, captures, action observations, and independent review outputs or links to existing records. |
| `research/personas/` | Roles, situations, jobs, and observable acceptance criteria using the existing [persona contract](personas-template.md). |
| `research/funnel/` | Journey and role-handoff analysis linked to the run evidence. |
| `research/competitive/` | Verified standards/comparable observations and their limits. |
| `01-diagnose.md` | Consolidated diagnosis citing all four research legs. |

Use `research/competitive/` for new brownfield work. Preserve legacy
`research/competitive-analysis/` material and reference it from the canonical
directory rather than duplicating or silently deleting it. Keep original
captures unchanged; redact shareable copies when needed. Do not create a portal
unless the reader needs that presentation.

Give each finding a stable ID, exact screen/control label, affected role and
journey, condition and reproduction steps, observed result, expected job,
evidence IDs, consequence/severity, claim type, confidence, and verification
limits. Separate an observed defect from a hypothesis requiring another test.
Consolidate repetitions while retaining every affected state and appearance.
Put the smallest proposed remedy and its acceptance check in Stage 2, linked
back to the finding. Keep accepted observations and unavailable checks outside
the unresolved-findings list.

The diagnosis must include:

- Scope, assumptions, access and environment, provenance, and coverage limits.
- Workflow outcomes and the independently preserved per-image verdicts.
- Findings from every scoped review track, including art direction.
- Element classification and subtractive opportunities, grounded in captures.
- The three findings to address first, ordered by user consequence and supported
  by evidence; use fewer if fewer are substantiated.
- What a stronger experience would feel like, expressed as user outcomes and
  desired qualities rather than a predetermined visual treatment.
- Disagreements, unresolved hypotheses, blocked work, and the precise next
  evidence or owner decision needed.

The lead rechecks the most consequential claims against their primary evidence.
Retain differences between local, fixture, deployed, emulated, and physical
results. Never average disagreement into a score or promote a passed script
into a visual or human-usability verdict.

When the prescription supports `rethink`, the subsequent design brief owes
three divergent whole-screen concepts on the same representative states, plus
the human selection record required by the judged-screen pattern. Art-direction
critique does not authorize a redesign, and selecting a direction does not
prove its implemented result.

Stage 1 audit completion means the declared coverage and reviews are complete.
If a dependency prevents that, deliver a clearly partial diagnosis and identify
the missing evidence or access; the audit remains incomplete. Completion of
the broader brownfield initiative is separate and follows the later stages,
including Fact-Check. Do not silently advance those stages from an audit report.
Run the existing research completeness checks, but do not describe their PASS
as verification that this procedure was performed. Any future executable
obligation should extend an existing reviewer only after repeated use reveals
a stable check with meaningful failure cases.
