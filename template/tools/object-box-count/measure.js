// Object-box style count — reference implementation for the optional measure
// in judged-screen-pattern.md § 4. Paste into the browser console on the
// rendered screen, or evaluate it from a browser automation tool.
//
// This is a manual aid for the judged cold review, not a DoD gate or an
// executable reviewer — nothing in judged-screen-pattern.md requires this
// exact script, and screen-composition-reviewer.mjs does not run it.
//
// Origin: rally-hq's card-debt remediation (docs/design/card-debt-2026-09-21/
// measure.js, commit 61826554). The two constants below are RALLY-HQ'S
// defaults (its Bloom radii are 12px and 22px) — a different product's radius
// scale, or a recipe built from something other than radius (a hairline
// border with a square corner, for instance), needs its own thresholds. Do
// not trust this script's output on a new product without first checking a
// real frame by eye and adjusting MIN_RADIUS_PX or CONTROL_SELECTOR to match.
//
// Calibration is not optional: rally-hq's first version of this script
// excluded controls by size alone and returned 12 on a frame whose real count
// was 6 (a wide button and a search field both counted as boxes). Whatever
// this script reports, open the frame it measured and confirm the number
// against what a person sees before recording it.
(() => {
  // An object box needs at least this much border radius. Rally HQ's two
  // recipe radii are 12px and 22px; a product with a squared-corner recipe
  // (a hairline border, no radius) will read zero boxes with this default —
  // that is this script under-reporting, not the screen having no boxes.
  const MIN_RADIUS_PX = 8

  // Elements matching this selector are controls (links, buttons, fields,
  // tabs), not object boxes, regardless of their fill/border/radius/shadow.
  const CONTROL_SELECTOR =
    'a,button,input,select,textarea,summary,label,[role=tab],[role=tablist],[role=button]'

  const pageBg = getComputedStyle(document.body).backgroundColor
  const boxes = [...document.querySelectorAll('body *')].filter((el) => {
    if (el.matches(CONTROL_SELECTOR)) return false
    const s = getComputedStyle(el)
    const r = parseFloat(s.borderTopLeftRadius) || 0
    if (r < MIN_RADIUS_PX) return false
    const b = el.getBoundingClientRect()
    if (b.width === 0 || b.height === 0) return false
    // Pill-shaped (radius at least half the height) is a control shape, not
    // an object box, whatever its width.
    if (r >= b.height / 2 - 1) return false
    const bordered = s.borderTopWidth !== '0px' && s.borderTopStyle !== 'none'
    const shadowed = s.boxShadow !== 'none'
    const filled = s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== pageBg
    return bordered || shadowed || filled
  })

  const styles = new Map()
  for (const el of boxes) {
    const s = getComputedStyle(el)
    const key = [
      s.backgroundColor,
      s.borderTopWidth,
      s.borderTopLeftRadius,
      s.boxShadow === 'none' ? 'no-shadow' : s.boxShadow
    ].join(' | ')
    const entry = styles.get(key) || { count: 0, examples: [] }
    entry.count++
    if (entry.examples.length < 4) {
      entry.examples.push(el.tagName.toLowerCase() + '.' + ([...el.classList][0] || ''))
    }
    styles.set(key, entry)
  }

  const rows = [...styles].map(([style, v]) => ({
    count: v.count,
    style,
    examples: v.examples.join(', ')
  }))
  console.table(rows)
  return { styleCount: rows.length, rows }
})()
