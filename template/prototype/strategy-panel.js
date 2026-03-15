/**
 * the original employer-prefixed name — Strategy Panel
 * Right drawer explaining design decisions per page.
 *
 * Configure by setting window.STRATEGY_CONTEXT before this script loads:
 *
 *   window.STRATEGY_CONTEXT = {
 *     'page-name.html': {
 *       title: 'Page Title',
 *       strategy: 'Why this page exists.',
 *       decisions: [
 *         { label: 'Decision name', why: 'Rationale' },
 *       ],
 *       research: [
 *         'Citation or data point',
 *       ],
 *     },
 *   };
 */

(function () {
  const path = window.location.pathname.split('/').pop() || '';
  const context = (window.STRATEGY_CONTEXT || {})[path];
  if (!context) return;

  const style = document.createElement('style');
  style.textContent = `
    .strategy-overlay { position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(49,52,64,0.3);z-index:1001;display:none; }
    .strategy-overlay.open { display:block; }
    .strategy-panel { position:fixed;top:0;right:-420px;bottom:0;width:400px;background:#fff;color:#313440;z-index:1002;overflow-y:auto;transition:right 0.25s ease;box-shadow:0px 1px 6px rgba(49,52,64,0.2);font-size:14px;line-height:1.5; }
    .strategy-panel.open { right:0; }
    .sp-header { padding:20px 24px;border-bottom:1px solid #D9DCE9;display:flex;justify-content:space-between;align-items:flex-start;position:sticky;top:0;z-index:1;background:#fff; }
    .sp-title { font-weight:700;font-size:18px; }
    .sp-subtitle { font-size:13px;color:#8C93AD;margin-top:4px; }
    .sp-close { background:none;border:none;color:#8C93AD;font-size:22px;cursor:pointer; }
    .sp-close:hover { color:#313440; }
    .sp-body { padding:24px; }
    .sp-section { margin-bottom:24px; }
    .sp-section-title { font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#8C93AD;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #ECEEF5; }
    .sp-strategy { color:#515769;font-size:14px;margin-bottom:20px;padding:12px 16px;background:#F5F7FC;border-radius:4px; }
    .sp-decision { background:#fff;border:1px solid #D9DCE9;border-radius:4px;padding:12px 16px;margin-bottom:8px;box-shadow:0 1px 3px rgba(49,52,64,0.08); }
    .sp-decision-label { font-weight:600;font-size:13px;margin-bottom:4px; }
    .sp-decision-why { color:#8C93AD;font-size:13px; }
    .sp-research { background:#F5F7FC;border-radius:4px;padding:10px 14px;margin-bottom:6px;color:#515769;font-size:13px;border-left:3px solid var(--bi-primary, #3D5AFE); }
    .sp-badge { display:inline-block;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;background:#E8EAF6;color:var(--bi-primary, #3D5AFE);margin-bottom:12px; }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'strategy-overlay';

  const panel = document.createElement('div');
  panel.className = 'strategy-panel';

  const decisionsHTML = (context.decisions || []).map(d =>
    `<div class="sp-decision"><div class="sp-decision-label">${d.label}</div><div class="sp-decision-why">${d.why}</div></div>`
  ).join('');

  const researchHTML = (context.research || []).map(r =>
    `<div class="sp-research">${r}</div>`
  ).join('');

  panel.innerHTML = `
    <div class="sp-header">
      <div><div class="sp-title">${context.title}</div><div class="sp-subtitle">Strategy & Design Context</div></div>
      <button class="sp-close">×</button>
    </div>
    <div class="sp-body">
      <div class="sp-badge">Strategy Context</div>
      <div class="sp-strategy">${context.strategy}</div>
      ${decisionsHTML ? `<div class="sp-section"><div class="sp-section-title">Design Decisions</div>${decisionsHTML}</div>` : ''}
      ${researchHTML ? `<div class="sp-section"><div class="sp-section-title">Supporting Research</div>${researchHTML}</div>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  function close() { panel.classList.remove('open'); overlay.classList.remove('open'); }
  panel.querySelector('.sp-close').addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();
