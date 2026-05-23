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

    const nav = el('div', { class: 'proto-footer-nav' },
      el('div', { class: 'nav-pages' },
        el('span', { class: 'tiny muted', style: 'margin-right: 8px' }, 'Blueprint:'),
        select
      ),
      el('div', { class: 'nav-actions' },
        el('button', { id: 'toggle-current-state', onclick: () => togglePanel('current-state') }, '◀ Shipped'),
        el('button', { id: 'toggle-strategy', onclick: () => togglePanel('strategy') }, 'Strategy ▶')
      )
    );
    document.body.appendChild(nav);
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

    const toggle = el('div', { class: 'compare-toggle' },
      el('button', { 'data-view': 'proposed', class: 'active', onclick: () => setView('proposed') }, 'Proposed'),
      el('button', { 'data-view': 'split', onclick: () => setView('split') }, 'Side-by-side'),
      el('button', { 'data-view': 'shipped', onclick: () => setView('shipped') }, 'Shipped')
    );

    const mount = document.querySelector('[data-compare-toggle-mount]');
    if (mount) mount.appendChild(toggle);
    else {
      const wrap = el('div', { class: 'row-between mt-4', style: 'margin-bottom: 1rem' },
        el('span', { class: 'tiny muted' }, 'Comparison'),
        toggle
      );
      hasProposed.parentNode.insertBefore(wrap, hasProposed);
    }
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
