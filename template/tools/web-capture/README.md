# `tools/web-capture`

Full-page captures of a rendered web page for a judged-screen review, with the checks that make a
capture safe to hand a reviewer. It is the web counterpart of the device captures in
`judged-screen-pattern.md` § 3a.

## What's in here

- `capture.mjs` — a Node script that drives Playwright. It captures one page in six states, checks each
  image, and writes a `receipt.json` beside the images.

## capture.mjs

    node capture.mjs --page <file-or-url> --out <dir> [--states <list>] [--dark-attr <name=value>]
                     [--artifact-fragment] [--playwright <module>]
    node capture.mjs --selftest [--playwright <module>]

It captures the page in each state, runs the checks below, prints one line per state, and exits 1 if any
check fails.

- `--page` — a local HTML file or an `http(s)` URL.
- `--out` — the folder for `<state>.png` and `receipt.json`. It is created if missing.
- `--states` — a comma-separated subset of the states below. The default is all six.
- `--dark-attr` — the attribute that turns on the page's own dark theme. The default is `data-theme=dark`.
- `--artifact-fragment` — wraps an HTML fragment in the skeleton a claude.ai artifact is published in,
  so a fragment renders as it will there.
- `--playwright` — the path of the Playwright module to load. Without it, the script loads Playwright from
  the current project, or from `PLAYWRIGHT_MODULE`.
- `--selftest` — builds two pages designed to trip the checks, and confirms that each check fails when it
  should.

### States

| State | Viewport | Pixel density | Theme |
|---|---|---|---|
| `desktop-light` | 1280 × 800 | 1 | light |
| `desktop-dark` | 1280 × 800 | 1 | the page's dark theme, set explicitly through `--dark-attr` |
| `desktop-systemdark` | 1280 × 800 | 1 | the system set to dark, no explicit choice |
| `phone-light` | 390 × 844, mobile | 2 | light |
| `phone-dark` | 390 × 844, mobile | 2 | the page's dark theme, set explicitly |
| `reflow320-light` | 320 × 700, mobile | 2 | light: a reflow check that stands in for the largest text size |

`desktop-systemdark` shows what a viewer whose system is dark sees before choosing anything. Pin a theme
in the brief first (`judged-screen-pattern.md` § 2b), then check this state against that choice.

### Checks

- **Tall pages are shot in segments.** A page taller than 16,000 device pixels is captured in clipped
  segments of 6,000 CSS px, then joined with `magick -append +repage`.
- **The image is the page's full size.** The width must equal the viewport, and the height must equal the
  page height, both at the state's pixel density.
- **The image does not repeat the page top.** In any image taller than 16,384 px, the band at 16,384 px must
  differ from the top band.
- **Nothing extends past the screen edge.** Overflow is measured against the document's `clientWidth`. Up
  to five elements that cross an edge are listed by tag, class and position.
- **Loaded fonts, page length in screens, and the body's background colour** are recorded for each state.

### Why these checks

Each check exists because the capture it guards against passed silently. All of these were measured on a
sales-support page for a private initiative on 2026-09-26.

- **Chrome paints at most 16,384 device pixels per screenshot.** A 390-wide capture at 2x of a page about
  9,450 CSS px tall repeated the page top from 16,384 px on. A crop there matched the top with 0 differing
  pixels, so the reviewer never saw the last two sections at phone width.
- **Mobile emulation widens `window.innerWidth` to fit overflowing content.** A 4 px sideways scroll passed a
  `scrollWidth > innerWidth` test, and `clientWidth` catches it.
- **A joined image keeps the first segment's canvas size.** Crops cut from it came out short until
  `+repage` reset the canvas.

`--selftest` rebuilds these failures in miniature. It checks four things:
- the overflow check catches a 4 px overshoot that the `innerWidth` test misses;
- a 9,500 CSS px page is joined from segments;
- the joined image is complete;
- a single shot of the same page trips the wrap check.

A check that has never failed is not yet trusted.

### Requirements

- **Node and Playwright.** If Playwright's bundled browser is absent, the script falls back to the installed
  Google Chrome (`channel: 'chrome'`).
- **ImageMagick's `magick`,** for joining segments and for the wrap check.

### Status

Candidate tool. One consumer has used it so far, the sales page above. Treat it as a reference implementation
until a second product runs it on a real page, as `object-box-count` is treated.
