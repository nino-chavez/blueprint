// Demo storyboard renderer (blueprint template).
// - Loads scenarios.json (content) + optional state-derive output (status overlay)
// - Renders scenario cards with per-surface status badges
// - Filter by category / surface / status / mode (demo-script vs guide)
//
// Status reconciliation rules (scenario.surfaces[surfaceId].status vs state-derive):
//   - Scenario's explicit `status` is the truth presented in the UI.
//   - If the scenario declares `state_capability_ids` AND state.json is present,
//     the renderer can flag drift (scenario says 'ready' but state-derive says
//     NON-COMPLIANT — opportunity to reconcile).
//   - Surfaces marked 'not-applicable' are dimmed and excluded from "ready/partial/missing" filter buckets.
//
// state.json contract (optional):
//   Shape: { capabilities: [{ capability: { id: string }, status: 'COMPLIANT'|'PARTIAL'|'NON-COMPLIANT'|'MANUAL_REVIEW' }, ...] }
//   Wire-up: bake state.json into the deploy dir at CI time (see deploy-demos.yml).
//   For private repos, runtime fetch from raw.githubusercontent.com 404s — bake-at-CI is the path.
//   Without state.json, scenarios still render; status badges just reflect declared values only.
const STATE_DERIVE_URL = "./state.json";

const state = {
  data: null,
  stateDerive: null,
  filters: { category: "all", surface: "all", status: "all", mode: "demo" },
  expanded: new Set()
};

async function load() {
  try {
    const [scenariosRes, stateRes] = await Promise.allSettled([
      fetch("./scenarios.json").then(r => r.json()),
      fetch(STATE_DERIVE_URL).then(r => r.ok ? r.json() : null)
    ]);

    state.data = scenariosRes.status === "fulfilled" ? scenariosRes.value : null;
    state.stateDerive = stateRes.status === "fulfilled" ? stateRes.value : null;

    if (!state.data) {
      document.getElementById("scenarios").innerHTML = '<p class="loading">Failed to load scenarios.json.</p>';
      return;
    }

    populateCategoryFilter();
    populateSurfaceFilter();
    wireControls();
    render();
  } catch (err) {
    console.error("Load failed", err);
    document.getElementById("scenarios").innerHTML = '<p class="loading">Error loading content. Check console.</p>';
  }
}

function populateSurfaceFilter() {
  const sel = document.getElementById("surface-filter");
  state.data.surfaces.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.label;
    sel.appendChild(opt);
  });
}

function populateCategoryFilter() {
  const sel = document.getElementById("category-filter");
  if (!state.data.categories) return;
  state.data.categories.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.label;
    sel.appendChild(opt);
  });
}

function wireControls() {
  document.getElementById("category-filter").addEventListener("change", e => {
    state.filters.category = e.target.value;
    render();
  });
  document.getElementById("surface-filter").addEventListener("change", e => {
    state.filters.surface = e.target.value;
    render();
  });
  document.getElementById("status-filter").addEventListener("change", e => {
    state.filters.status = e.target.value;
    render();
  });
  document.getElementById("mode-toggle").addEventListener("change", e => {
    state.filters.mode = e.target.value;
    render();
  });
}

function categoryLabel(id) {
  const c = state.data.categories?.find(x => x.id === id);
  return c?.label || id;
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function getStateDeriveStatus(capabilityIds) {
  if (!state.stateDerive || !capabilityIds?.length) return null;
  const caps = state.stateDerive.capabilities || [];
  const matches = capabilityIds.map(id => caps.find(c => c.capability?.id === id)).filter(Boolean);
  if (!matches.length) return null;
  const statuses = matches.map(m => m.status);
  if (statuses.includes("NON-COMPLIANT")) return "NON-COMPLIANT";
  if (statuses.includes("PARTIAL")) return "PARTIAL";
  if (statuses.every(s => s === "COMPLIANT")) return "COMPLIANT";
  return "MANUAL_REVIEW";
}

function badge(status) {
  const label = {
    ready: "Ready",
    partial: "Partial",
    missing: "Missing",
    "not-applicable": "N/A",
    unknown: "Unknown"
  }[status] || status;
  return `<span class="badge badge--${status}">${label}</span>`;
}

function aggregateSurfaceStatuses(scenario) {
  return state.data.surfaces.map(s => {
    const surface = scenario.surfaces?.[s.id];
    return { id: s.id, status: surface?.status || "unknown" };
  });
}

function scenarioMatchesFilters(scenario) {
  if (state.filters.category !== "all" && scenario.category !== state.filters.category) return false;

  const surfaceStatuses = aggregateSurfaceStatuses(scenario);

  if (state.filters.surface !== "all") {
    const surface = surfaceStatuses.find(s => s.id === state.filters.surface);
    if (!surface) return false;
    if (state.filters.status !== "all" && surface.status !== state.filters.status) return false;
  } else if (state.filters.status !== "all") {
    return surfaceStatuses.some(s => s.status === state.filters.status);
  }
  return true;
}

function render() {
  const grid = document.getElementById("scenarios");
  const visible = state.data.scenarios.filter(scenarioMatchesFilters);

  if (!visible.length) {
    grid.innerHTML = '<p class="loading">No scenarios match the current filters.</p>';
    updateStats(0);
    return;
  }

  grid.innerHTML = visible.map(renderScenario).join("");
  updateStats(visible.length);
  wireScenarioClicks();
}

function updateStats(visibleCount) {
  const total = state.data.scenarios.length;
  const el = document.getElementById("stats");
  el.textContent = `Showing ${visibleCount} of ${total} scenarios`;
}

function renderScenario(scenario) {
  const surfaceStatuses = aggregateSurfaceStatuses(scenario);
  const isExpanded = state.expanded.has(scenario.id);

  const badges = surfaceStatuses
    .filter(s => s.status !== "unknown")
    .map(s => {
      const surfaceMeta = state.data.surfaces.find(x => x.id === s.id);
      const shortLabel = surfaceMeta?.short_label || surfaceMeta?.label?.slice(0, 5) || s.id;
      const fullLabel = surfaceMeta?.label || s.id;
      return `<span class="badge badge--${s.status}" title="${escapeHtml(fullLabel)} — ${escapeHtml(s.status)}">${escapeHtml(shortLabel)}</span>`;
    }).join("");

  const stateDeriveStatus = getStateDeriveStatus(scenario.state_capability_ids);
  const driftWarning = "";

  return `
    <article class="scenario-card${isExpanded ? " expanded" : ""}" data-id="${escapeHtml(scenario.id)}">
      <header class="scenario-header" role="button" tabindex="0">
        <svg class="chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 5l6 5-6 5"/>
        </svg>
        <div class="scenario-header-main">
          <div class="scenario-title-row">
            <h3 class="scenario-title">${escapeHtml(scenario.title)}</h3>
            ${scenario.category ? `<span class="scenario-category category--${escapeHtml(scenario.category)}">${escapeHtml(categoryLabel(scenario.category))}</span>` : ""}
          </div>
          <p class="scenario-summary">${escapeHtml(scenario.summary)}</p>
        </div>
        <div class="scenario-badges">${badges}</div>
      </header>
      <div class="scenario-body">
        ${renderMeta(scenario, stateDeriveStatus)}
        ${driftWarning}
        <div class="surfaces">
          ${state.data.surfaces.map(s => renderSurface(scenario, s)).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderMeta(scenario, stateDeriveStatus) {
  const brdLine = scenario.brd_refs?.length
    ? `<dt>BRD refs</dt><dd>${scenario.brd_refs.map(r => escapeHtml(r)).join(", ")}</dd>`
    : "";
  const stateLine = stateDeriveStatus
    ? `<dt>state-derive</dt><dd>${escapeHtml(stateDeriveStatus)} <span class="muted">(from ${(scenario.state_capability_ids || []).length} capability check(s))</span></dd>`
    : "";
  const prereqLine = scenario.prerequisites?.length
    ? `<dt>Prerequisites</dt><dd>${scenario.prerequisites.map(p => escapeHtml(p)).join("; ")}</dd>`
    : "";
  const outcomeLine = scenario.expected_outcome
    ? `<dt>Expected outcome</dt><dd>${escapeHtml(scenario.expected_outcome)}</dd>`
    : "";

  return `<dl class="scenario-meta">${brdLine}${stateLine}${prereqLine}${outcomeLine}</dl>`;
}

function renderSurface(scenario, surfaceMeta) {
  const surface = scenario.surfaces?.[surfaceMeta.id];
  const status = surface?.status || "unknown";

  const filteredOut = state.filters.surface !== "all" && state.filters.surface !== surfaceMeta.id;

  const url = surface?.demo_url
    ? `<span class="surface-url"><a href="${escapeHtml(surface.demo_url)}" target="_blank" rel="noopener">Open ↗</a></span>`
    : "";

  let body = "";
  if (status === "not-applicable" || status === "missing") {
    body = `<p class="surface-guide">${escapeHtml(surface?.guide || "No information available for this surface.")}</p>`;
  } else if (state.filters.mode === "demo") {
    const script = surface?.demo_script || [];
    body = script.length
      ? `<ol class="surface-script">${script.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`
      : `<p class="empty-state">No demo script yet.</p>`;
    if (surface?.guide) {
      body += `<p class="surface-guide" style="margin-top: 8px; font-size: 0.85rem; color: var(--bc-grey-600);">${escapeHtml(surface.guide)}</p>`;
    }
  } else {
    body = `<p class="surface-guide">${escapeHtml(surface?.guide || "No guide content yet.")}</p>`;
  }

  return `
    <div class="surface-card${filteredOut ? " surface-card--filtered-out" : ""}">
      <div class="surface-header">
        <h4 class="surface-label">${escapeHtml(surfaceMeta.label)}</h4>
        ${badge(status)}
        ${url}
      </div>
      <p class="surface-description">${escapeHtml(surfaceMeta.description)}</p>
      ${body}
    </div>
  `;
}

function wireScenarioClicks() {
  document.querySelectorAll(".scenario-card").forEach(card => {
    const header = card.querySelector(".scenario-header");
    const toggle = () => {
      const id = card.dataset.id;
      if (state.expanded.has(id)) state.expanded.delete(id);
      else state.expanded.add(id);
      card.classList.toggle("expanded");
    };
    header.addEventListener("click", toggle);
    header.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });
}

load();
