# `tools/object-box-count`

Reference implementation of the optional object-box style count named in
`judged-screen-pattern.md` § 4. It is a per-screen measure recorded beside a
slice's debt line and closeout line. Not a required field. Not a DoD gate.

## What's in here

- `measure.js` — paste into the browser console on the rendered screen, or
  evaluate it from a browser automation tool. Counts distinct object-box
  styles (fill/border/radius/shadow combinations). Excludes controls (links,
  buttons, fields, tabs, pill shapes). Returns `{ styleCount, rows }` and
  prints a table.

## Before trusting a number from this script

Calibrate against a real frame first. The two constants at the top of
`measure.js` — `MIN_RADIUS_PX` and `CONTROL_SELECTOR` — are rally-hq's
defaults. Its object-box recipe uses 12px and 22px radii. A product whose
recipe is a square-cornered hairline border will read zero boxes with these
defaults. That is the script under-reporting, not the screen having none.

Adjust the constants to the product's own recipe. Then check the count by eye
against a real frame. Rally-hq's first version of this script, before these
defaults were tuned, returned 12 on a frame whose real count was 6 — a wide
button and a search field both counted as boxes.

## Why this exists

Rally HQ's card-debt remediation (`docs/design/card-debt-2026-09-21/PLAN.md`,
finding F14) needed a mechanical check for "too many boxes." Three
independent reviews had reached that same complaint with no shared measure.

`judged-screen-pattern.md` § 4 records this pattern's promotion status. The
debt line and the numeric ceiling are one consumer's evidence so far. A
second consumer (630 Volleyball) adopted the qualitative rule — one
object-box recipe per screen — without running this measurement. Treat this
script as a candidate tool, not an enforced standard, until a second product
actually runs it against a real frame.
