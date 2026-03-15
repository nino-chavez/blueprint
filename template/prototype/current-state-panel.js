/**
 * BigBlueprint — Current State Panel
 * Left drawer showing screenshots of the existing product for comparison.
 *
 * Configure by setting window.CURRENT_STATE before this script loads:
 *
 *   window.CURRENT_STATE = {
 *     'page-name.html': {
 *       title: 'Current page name',
 *       screenshots: [
 *         { src: 'current-state/screenshot.png', caption: 'Description' },
 *       ],
 *       delta: 'What the prototype changes compared to current state',
 *     },
 *   };
 */

(function () {
  const path = window.location.pathname.split('/').pop() || '';
  const mapping = (window.CURRENT_STATE || {})[path];
  if (!mapping) return;

  const isNew = mapping.title.includes('No current');

  const style = document.createElement('style');
  style.textContent = `
    .cs-overlay { position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(49,52,64,0.3);z-index:1001;display:none; }
    .cs-overlay.open { display:block; }
    .cs-panel { position:fixed;top:0;left:-480px;bottom:0;width:460px;background:#fff;color:#313440;z-index:1002;overflow-y:auto;transition:left 0.25s ease;box-shadow:4px 0 20px rgba(0,0,0,0.15);font-size:14px;line-height:1.5; }
    .cs-panel.open { left:0; }
    .cs-header { padding:20px 24px;border-bottom:1px solid #D9DCE9;display:flex;justify-content:space-between;align-items:flex-start;position:sticky;top:0;z-index:1;background:#fff; }
    .cs-title { font-weight:700;font-size:16px; }
    .cs-subtitle { font-size:12px;color:#8C93AD;margin-top:4px; }
    .cs-close { background:none;border:none;color:#8C93AD;font-size:22px;cursor:pointer; }
    .cs-close:hover { color:#313440; }
    .cs-body { padding:20px 24px; }
    .cs-screenshot { border:1px solid #D9DCE9;border-radius:6px;overflow:hidden;margin-bottom:12px; }
    .cs-screenshot img { width:100%;display:block; }
    .cs-caption { padding:8px 12px;font-size:12px;color:#8C93AD;background:#F5F7FC;border-top:1px solid #ECEEF5; }
    .cs-delta { background:#F5F7FC;border-radius:6px;padding:12px 16px;font-size:13px;color:#515769;margin-top:16px;line-height:1.6; }
    .cs-delta-label { font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#8C93AD;margin-bottom:6px; }
    .cs-badge { display:inline-block;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:12px; }
    .cs-badge-exists { background:#F0FDF4;color:#166534; }
    .cs-badge-new { background:#FEF3C7;color:#92400E; }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'cs-overlay';

  const panel = document.createElement('div');
  panel.className = 'cs-panel';

  const screenshotsHTML = mapping.screenshots.map(s =>
    `<div class="cs-screenshot"><img src="${s.src}" alt="${s.caption}" loading="lazy"><div class="cs-caption">${s.caption}</div></div>`
  ).join('');

  panel.innerHTML = `
    <div class="cs-header">
      <div><div class="cs-title">Current State</div><div class="cs-subtitle">What users see today</div></div>
      <button class="cs-close">×</button>
    </div>
    <div class="cs-body">
      <div class="cs-badge ${isNew ? 'cs-badge-new' : 'cs-badge-exists'}">${isNew ? 'New — no current equivalent' : 'Existing page'}</div>
      <div style="font-weight:600;margin-bottom:12px;">${mapping.title}</div>
      ${screenshotsHTML}
      <div class="cs-delta"><div class="cs-delta-label">What the prototype changes</div>${mapping.delta}</div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  function close() { panel.classList.remove('open'); overlay.classList.remove('open'); }
  panel.querySelector('.cs-close').addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();
