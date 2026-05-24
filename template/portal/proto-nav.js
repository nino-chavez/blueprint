/* Rally HQ Blueprint — Proto-nav + panels + comparison toggle + flow mode
 *
 * Reads the portal manifest from /_meta/index.json and the per-page metadata
 * from /_meta/<id>.json so the nav is auto-derived from filesystem instead
 * of hard-coded. Pages only need to declare their id:
 *
 *   window.PROTO_PAGE = { id: 'tournament' };
 *
 * Everything else (title, group, strategy, currentState) comes from the JSON.
 *
 * Flow mode: append ?flow=<flow-id> to any prototype URL. The footer nav shows
 * "step N of M" + prev/next buttons threading the flow's pages in order.
 *
 * Surface contract (from CONVENTIONS.md): everything this script renders is
 * harness chrome — it never modifies the prototype page's product UI. The
 * panels, comparison toggle, footer nav, and flow breadcrumb all live in
 * fixed-position layers above the page body.
 */
(function () {
  let MANIFEST = null;
  let CURRENT_META = null;
  let CURRENT_FLOW = null;

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') node.innerHTML = v;
      else node.setAttribute(k, v);
    });
    children.flat().forEach(c => {
      if (c == null) return;
      node.appendChild(c.nodeType ? c : document.createTextNode(c));
    });
    return node;
  }

  function isProtoRoot() {
    const path = window.location.pathname;
    return path === '/' || path.endsWith('/index.html') || path.endsWith('/index');
  }

  // ─────────────── manifest + metadata loaders ───────────────

  async function loadManifest() {
    if (MANIFEST) return MANIFEST;
    const base = isProtoRoot() ? '_meta/index.json' : '../_meta/index.json';
    try {
      const res = await fetch(base);
      if (!res.ok) throw new Error(`manifest HTTP ${res.status}`);
      MANIFEST = await res.json();
    } catch (err) {
      console.warn('proto-nav: manifest load failed', err);
      MANIFEST = { name: 'Blueprint', groups: [], pages: [], flows: [] };
    }
    return MANIFEST;
  }

  async function loadPageMeta(id) {
    if (!id) return null;
    const base = isProtoRoot() ? `_meta/${id}.json` : `../_meta/${id}.json`;
    try {
      const res = await fetch(base);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`proto-nav: meta load failed for ${id}`, err);
      return null;
    }
  }

  function pageHref(id) {
    return isProtoRoot() ? `./pages/${id}.html` : `./${id}.html`;
  }

  // ─────────────── flow mode ───────────────

  function getFlowFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('flow');
  }

  function buildFlowBreadcrumb(flow, currentId) {
    const idx = flow.pages.indexOf(currentId);
    const prev = idx > 0 ? flow.pages[idx - 1] : null;
    const next = idx >= 0 && idx < flow.pages.length - 1 ? flow.pages[idx + 1] : null;
    const total = flow.pages.length;

    const wrap = el('div', { class: 'proto-flow-breadcrumb' },
      el('div', { class: 'flow-meta' },
        el('span', { class: 'flow-label' }, 'Flow:'),
        el('span', { class: 'flow-name' }, flow.label),
        el('span', { class: 'flow-step' }, `Step ${idx + 1} of ${total}`)
      ),
      el('div', { class: 'flow-actions' },
        prev ? el('a', {
          class: 'flow-nav-btn',
          href: `${pageHref(prev)}?flow=${flow.id}`,
          'aria-label': 'Previous page in flow'
        }, '← ', el('span', { class: 'flow-page-name' }, MANIFEST?._titleCache?.[prev] || prev))
        : el('span', { class: 'flow-nav-btn disabled' }, '← Start of flow'),
        next ? el('a', {
          class: 'flow-nav-btn primary',
          href: `${pageHref(next)}?flow=${flow.id}`,
          'aria-label': 'Next page in flow'
        }, el('span', { class: 'flow-page-name' }, MANIFEST?._titleCache?.[next] || next), ' →')
        : el('span', { class: 'flow-nav-btn disabled' }, 'End of flow →')
      )
    );
    document.body.appendChild(wrap);
  }

  // ─────────────── footer nav (auto-built from manifest) ───────────────

  function buildFooterNav(currentId) {
    const select = el('select', {
      onchange: (e) => {
        const id = e.target.value;
        window.location.href = id === 'index' ? (isProtoRoot() ? './index.html' : '../index.html') : pageHref(id);
      }
    });

    // Index option
    const indexOpt = el('option', { value: 'index' }, 'Portal index');
    if (currentId === 'index') indexOpt.selected = true;
    select.appendChild(indexOpt);

    // Group by manifest groups
    const groupLookup = Object.fromEntries((MANIFEST.groups || []).map(g => [g.id, g.label]));
    const byGroup = {};
    (MANIFEST.pages || []).forEach(id => {
      const meta = MANIFEST._cache?.[id];
      const groupId = meta?.group || 'other';
      (byGroup[groupId] = byGroup[groupId] || []).push({ id, title: meta?.title || id });
    });

    Object.entries(byGroup).forEach(([groupId, items]) => {
      const og = el('optgroup', { label: groupLookup[groupId] || groupId });
      items.forEach(p => {
        const opt = el('option', { value: p.id }, p.title);
        if (p.id === currentId) opt.selected = true;
        og.appendChild(opt);
      });
      select.appendChild(og);
    });

    // Footer nav is now a hidden affordance — top brand bar + slice header
    // + slice sidebar make it redundant. Keep the dropdown wired but render
    // it via the top brand bar's overflow menu (mobile + jump-to-page only).
    // The Shipped/Strategy drawer toggle buttons live in the slice header.
    const nav = el('div', { class: 'proto-footer-nav' },
      el('div', { class: 'nav-pages' },
        el('span', { class: 'tiny muted', style: 'margin-right: 8px' }, 'Jump to:'),
        select
      ),
      el('div', { class: 'nav-actions' },
        el('button', { id: 'toggle-current-state', onclick: () => togglePanel('current-state') }, '◀ Shipped'),
        el('button', { id: 'toggle-strategy', onclick: () => togglePanel('strategy') }, 'Strategy ▶')
      )
    );
    document.body.appendChild(nav);
  }

  // ─────────────── top brand bar (proto-nav.js, on every prototype page) ───────────────

  function buildTopBrandBar() {
    // Skip on the portal index + studio catalog pages — they have their own top nav.
    if (window.PROTO_PAGE?.id === 'index') return;

    const bar = document.createElement('header');
    bar.className = 'proto-brand-bar';
    bar.innerHTML = `
      <div class="proto-brand-bar-inner">
        <a href="/" class="brand-mark">
          ${MANIFEST?.name ? MANIFEST.name.split(' ')[0] : 'Blueprint'}<span class="brand-mark-tag">Blueprint</span>
        </a>
        <nav class="brand-bar-nav">
          <a href="/">Front door</a>
          <a href="/prototype/">Prototype</a>
          <a href="/docs/?doc=cx-strategy">Docs</a>
        </nav>
      </div>
    `;
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function togglePanel(which) {
    const sel = which === 'strategy' ? '.strategy-panel' : '.current-state-panel';
    const panel = document.querySelector(sel);
    if (!panel) return;
    panel.classList.toggle('open');
  }

  // ─────────────── panels (built from meta) ───────────────

  function buildStrategyPanel(meta) {
    if (!meta || !meta.strategy) return;
    const s = meta.strategy;
    // Helper to render content that may contain markdown-ish inline syntax
    const render = (text) => text || '';
    const panel = el('aside', { class: 'strategy-panel', id: 'strategy-panel' },
      el('button', { class: 'panel-close', onclick: () => togglePanel('strategy') }, '×'),
      el('h3', {}, 'Strategy'),
      el('p', { class: 'tiny muted mt-4' }, `Page: ${meta.title}`),
      el('div', { class: 'panel-section' },
        el('h4', {}, 'The decision'),
        el('p', { html: render(s.decision) })
      ),
      el('div', { class: 'panel-section' },
        el('h4', {}, 'The why'),
        el('p', { html: render(s.why) })
      ),
      el('div', { class: 'panel-section' },
        el('h4', {}, 'Shipped state'),
        el('p', { html: render(s.shipped) })
      ),
      el('div', { class: 'panel-section' },
        el('h4', {}, 'The gap'),
        el('p', { html: render(s.gap) })
      ),
      el('div', { class: 'panel-section' },
        el('h4', {}, 'Open question'),
        el('p', { html: render(s.question) })
      )
    );
    document.body.appendChild(panel);
  }

  function buildCurrentStatePanel(meta) {
    if (!meta || !meta.currentState) return;
    const cs = meta.currentState;
    const panel = el('aside', { class: 'current-state-panel', id: 'current-state-panel' },
      el('button', { class: 'panel-close', onclick: () => togglePanel('current-state') }, '×'),
      el('h3', {}, 'Shipped state'),
      el('p', { class: 'tiny muted mt-4' }, cs.route ? `Route: ${cs.route}` : 'No equivalent surface today'),
      el('div', { class: 'panel-section' },
        el('h4', {}, 'What exists today'),
        el('p', { html: cs.summary || '<em>No equivalent surface in shipped Rally HQ.</em>' })
      ),
      cs.sourceFiles && cs.sourceFiles.length ? el('div', { class: 'panel-section' },
        el('h4', {}, 'Source files'),
        ...cs.sourceFiles.map(f => el('p', {}, el('code', {}, f)))
      ) : null,
      el('div', { class: 'panel-section' },
        el('h4', {}, 'Annotation'),
        el('p', { html: cs.annotation || 'See strategy panel for proposed changes.' })
      )
    );
    document.body.appendChild(panel);
  }

  // ─────────────── side-by-side comparison toggle ───────────────

  function buildCompareToggle() {
    const hasProposed = document.querySelector('.proposed-view');
    const hasShipped = document.querySelector('.shipped-view');
    if (!(hasProposed && hasShipped)) return;

    const root = document.querySelector('[data-compare-root]') || document.body;
    if (!root.hasAttribute('data-view')) root.setAttribute('data-view', 'proposed');

    function setView(v) {
      root.setAttribute('data-view', v);
      toggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    }

    // Compact 3-button pill. The unicode glyphs match the surface:
    //   △  proposed only (the design as intended)
    //   ⊟  side-by-side (split view)
    //   ▢  shipped only (current production)
    const toggle = el('div', { class: 'compare-toggle' },
      el('button', { 'data-view': 'proposed', class: 'active', onclick: () => setView('proposed'), title: 'Proposed only' }, 'Proposed'),
      el('button', { 'data-view': 'split', onclick: () => setView('split'), title: 'Side-by-side comparison' }, 'Compare'),
      el('button', { 'data-view': 'shipped', onclick: () => setView('shipped'), title: 'Shipped only' }, 'Shipped')
    );

    // Preferred mount order:
    //   1. Inside the slice header bar (so the toggle lives WITH the breadcrumb + trace badges) — the new architectural home as of v2
    //   2. Explicit [data-compare-toggle-mount] in the page (legacy override — slice header didn't exist when this was added)
    //   3. Floating pill in the top-right of the viewport (fallback for pages without slice headers — keeps it out of the page flow)
    const sliceHeaderActions = document.querySelector('.proto-slice-header .slice-header-actions');
    const explicitMount = document.querySelector('[data-compare-toggle-mount]');
    if (sliceHeaderActions) {
      // Insert before the existing badge cluster
      sliceHeaderActions.insertBefore(toggle, sliceHeaderActions.firstChild);
      // If a legacy explicit mount exists, hide it so the old container doesn't leave dead space in the page flow
      if (explicitMount) explicitMount.style.display = 'none';
    } else if (explicitMount) {
      explicitMount.appendChild(toggle);
    } else {
      // Fallback: floating pill, top-right, fixed-positioned
      const floating = el('div', { class: 'compare-toggle-floating' }, toggle);
      document.body.appendChild(floating);
    }
  }

  // ─────────────── slice metadata loader + shell ───────────────

  let CURRENT_SLICE = null;

  async function loadSliceMeta(id) {
    if (!id) return null;
    const base = isProtoRoot() ? `_meta/slices/${id}.json` : `../_meta/slices/${id}.json`;
    try {
      const res = await fetch(base);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`proto-nav: slice meta load failed for ${id}`, err);
      return null;
    }
  }

  function buildSliceHeader(slice, currentPageMeta) {
    const wrap = document.createElement('div');
    wrap.className = 'proto-slice-header';
    wrap.innerHTML = `
      <div class="slice-header-row">
        <div class="slice-header-meta">
          <div class="slice-header-crumb">
            <a href="/prototype/">Prototype</a>
            <span class="sep">›</span>
            <span class="slice-label">${slice.label}</span>
            ${currentPageMeta ? `<span class="sep">›</span><span class="page-label">${currentPageMeta.title}</span>` : ''}
          </div>
          <div class="slice-header-surface">${slice.production_surface || ''}</div>
        </div>
        <div class="slice-header-actions">
          ${(slice.findings_cited || []).map(f => `<span class="badge-trace">${f}</span>`).join('')}
          ${(slice.principles_cited || []).map(p => `<span class="badge-trace badge-trace-rule">${p}</span>`).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
  }

  function buildSliceSidebar(slice) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'proto-slice-sidebar';

    const pages = (slice.pages || [])
      .map(id => MANIFEST._cache?.[id])
      .filter(Boolean);

    const flowsTouching = (MANIFEST.flows || []).filter(f =>
      (slice.flows_touching_this_slice || []).includes(f.id) ||
      (f.pages || []).some(p => (slice.pages || []).includes(p))
    );

    sidebar.innerHTML = `
      <div class="slice-sidebar-section">
        <h4>${slice.label}</h4>
        <p class="slice-sidebar-summary">${slice.summary || ''}</p>
      </div>
      <div class="slice-sidebar-section">
        <h5>Pages in this slice</h5>
        <ul class="slice-sidebar-list">
          ${pages.map(p => `
            <li>
              <a href="${p.route}" class="${p.id === window.PROTO_PAGE?.id ? 'active' : ''}">
                <span class="page-title">${p.title}</span>
                <span class="page-phase phase-${(p.phase || '').replace(' ', '-')}">${p.phase || ''}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
      ${flowsTouching.length ? `
        <div class="slice-sidebar-section">
          <h5>Flows through slice</h5>
          <ul class="slice-sidebar-list slice-sidebar-flows">
            ${flowsTouching.map(f => `
              <li>
                <a href="${pageHref((f.pages || [])[0])}?flow=${f.id}">
                  <span class="flow-title">${f.label}</span>
                  <span class="flow-pages">${(f.pages || []).length} pages</span>
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    `;
    document.body.appendChild(sidebar);

    // Add a body class so page-specific CSS can adjust for the sidebar
    document.body.classList.add('proto-has-sidebar');
  }

  // ─────────────── init ───────────────

  async function init() {
    await loadManifest();

    // Prefetch all page meta into a title cache so the footer + flow nav can name pages
    if (MANIFEST.pages?.length) {
      MANIFEST._cache = {};
      MANIFEST._titleCache = {};
      await Promise.all(
        MANIFEST.pages.map(async id => {
          const m = await loadPageMeta(id);
          if (m) {
            MANIFEST._cache[id] = m;
            MANIFEST._titleCache[id] = m.title;
          }
        })
      );
    }

    const pageId = window.PROTO_PAGE?.id || 'index';
    CURRENT_META = MANIFEST._cache?.[pageId] || null;

    // Expose to window for the chat widget and other consumers
    if (CURRENT_META) {
      window.PROTO_PAGE = { ...window.PROTO_PAGE, ...CURRENT_META };
    }

    // Flow handling
    const flowId = getFlowFromUrl();
    if (flowId) {
      CURRENT_FLOW = (MANIFEST.flows || []).find(f => f.id === flowId);
      if (CURRENT_FLOW && CURRENT_FLOW.pages.includes(pageId)) {
        buildFlowBreadcrumb(CURRENT_FLOW, pageId);
      }
    }

    // Top brand bar appears on every prototype page so reviewers always
    // have one-click back to portal / prototype catalog / docs.
    buildTopBrandBar();

    // Load slice metadata for the current page (if it belongs to a slice)
    const sliceId = CURRENT_META?.slice;
    if (sliceId) {
      CURRENT_SLICE = await loadSliceMeta(sliceId);
      if (CURRENT_SLICE) {
        buildSliceHeader(CURRENT_SLICE, CURRENT_META);
        buildSliceSidebar(CURRENT_SLICE);
      }
    }

    buildFooterNav(pageId);
    buildStrategyPanel(CURRENT_META);
    buildCurrentStatePanel(CURRENT_META);
    buildCompareToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
