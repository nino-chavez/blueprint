/**
 * BigBlueprint — Prototype Navigation Bar
 * Sticky bottom bar with page nav + drawer toggles.
 *
 * Configure by setting window.PROTO_NAV before this script loads:
 *
 *   window.PROTO_NAV = {
 *     flows: [
 *       { label: 'Home', href: 'index.html', icon: '⌂' },
 *       { label: 'Feature A', href: 'feature-a.html', pages: ['feature-a.html', 'feature-a-detail.html'] },
 *     ],
 *     showCurrentState: true,   // show ◀ Current State button (requires current-state-panel.js)
 *     showStrategy: true,       // show Strategy ▶ button (requires strategy-panel.js)
 *   };
 */

(function () {
  const path = window.location.pathname.split('/').pop() || '';
  const config = window.PROTO_NAV || {};
  if (!path || path === 'index.html' || path.startsWith('docs-')) return;

  const flows = config.flows || [
    { label: 'Home', href: 'index.html', icon: '⌂' },
  ];

  const style = document.createElement('style');
  style.textContent = `
    .proto-nav { position:fixed;bottom:0;left:0;right:0;background:#1e293b;display:flex;justify-content:center;align-items:stretch;z-index:998;border-top:1px solid #334155;font-family:var(--bi-font, -apple-system, sans-serif); }
    .proto-nav a,.proto-nav button { padding:10px 18px;font-size:12px;font-weight:500;color:#94a3b8;text-decoration:none;border:none;background:none;border-top:2px solid transparent;transition:all 0.15s;white-space:nowrap;cursor:pointer;font-family:inherit; }
    .proto-nav a:hover,.proto-nav button:hover { color:#e2e8f0;background:#334155;text-decoration:none; }
    .proto-nav a.active { color:#f8fafc;border-top-color:var(--bi-primary, #3C64F4);background:#334155; }
    .proto-nav .nav-divider { width:1px;background:#334155;margin:6px 0; }
    .proto-nav .drawer-btn .drawer-label { display:block;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.6;margin-top:1px; }
    body { padding-bottom:42px; }
    .chat-fab { bottom:56px !important; }
    .strategy-fab,.cs-fab { display:none !important; }
  `;
  document.head.appendChild(style);

  const nav = document.createElement('nav');
  nav.className = 'proto-nav';

  // Left drawer: Current State
  if (config.showCurrentState !== false) {
    const csBtn = document.createElement('button');
    csBtn.className = 'drawer-btn';
    csBtn.innerHTML = '◀ Current State<span class="drawer-label">Compare</span>';
    csBtn.addEventListener('click', () => {
      const p = document.querySelector('.cs-panel');
      const o = document.querySelector('.cs-overlay');
      if (p && o) { p.classList.add('open'); o.classList.add('open'); }
    });
    nav.appendChild(csBtn);
    const div = document.createElement('div'); div.className = 'nav-divider'; nav.appendChild(div);
  }

  // Page links
  flows.forEach(flow => {
    const a = document.createElement('a');
    a.href = flow.href;
    a.innerHTML = flow.icon ? `${flow.icon} ${flow.label}` : flow.label;
    if (flow.pages && flow.pages.includes(path)) a.classList.add('active');
    else if (flow.href === path) a.classList.add('active');
    nav.appendChild(a);
  });

  // Right drawer: Strategy
  if (config.showStrategy !== false) {
    const div = document.createElement('div'); div.className = 'nav-divider'; nav.appendChild(div);
    const stratBtn = document.createElement('button');
    stratBtn.className = 'drawer-btn';
    stratBtn.innerHTML = 'Strategy ▶<span class="drawer-label">Design context</span>';
    stratBtn.addEventListener('click', () => {
      const p = document.querySelector('.strategy-panel');
      const o = document.querySelector('.strategy-overlay');
      if (p && o) { p.classList.add('open'); o.classList.add('open'); }
    });
    nav.appendChild(stratBtn);
  }

  document.body.appendChild(nav);
})();
