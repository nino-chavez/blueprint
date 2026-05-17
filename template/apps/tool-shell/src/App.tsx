import { FunctionComponent } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';

// Tool-shell route stubs. Replace each <Placeholder /> with your project's
// actual app. See template/apps/tool-shell/README.md for the porting pattern.
//
// Per blueprint.yml's tool_surface.<cluster>.apps config, enable or remove
// routes for apps your cluster doesn't include.

const NAV = {
  operator: [
    { to: '/board', label: 'Board' },
    { to: '/infra', label: 'Infrastructure' },
  ],
  shareable: [
    { to: '/prototype', label: 'Prototype' },
    { to: '/traceability', label: 'Traceability' },
    { to: '/demos', label: 'Demos' },
  ],
};

// Edit this constant per copy. The shell is cluster-agnostic; this picks which
// nav set + default route apply.
const CLUSTER: 'operator' | 'shareable' = 'shareable';

export const App: FunctionComponent = () => {
  const navItems = NAV[CLUSTER];
  const defaultRoute = navItems[0]?.to ?? '/';

  return (
    <div style={shellStyle}>
      <Sidebar />
      <main style={contentStyle}>
        <Routes>
          <Route path="/" element={<Navigate to={defaultRoute} replace />} />
          {/* Operator-cluster routes */}
          <Route path="/board" element={<Placeholder name="Hive Board" port="port .hive/apps/dashboard's vanilla-JS into a React component" />} />
          <Route path="/infra" element={<Placeholder name="Infrastructure Status" port="mount state-derive output / health dashboards" />} />
          {/* Shareable-cluster routes */}
          <Route path="/prototype/*" element={<Placeholder name="Prototype" port="mount prototype/src/App.tsx's <App /> here" />} />
          <Route path="/traceability" element={<Placeholder name="Traceability" port="mount prototype/src/pages/TraceabilityMatrix.tsx" />} />
          <Route path="/demos/*" element={<Placeholder name="Demos" port="mount apps/demos (port from vanilla JS or iframe-then-migrate)" />} />
        </Routes>
      </main>
    </div>
  );
};

const Sidebar: FunctionComponent = () => {
  return (
    <aside style={sidebarStyle}>
      <div style={brandStyle}>{CLUSTER === 'operator' ? 'Operator' : 'Tool Surface'}</div>
      <nav style={navStyle}>
        {NAV[CLUSTER].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              ...navLinkStyle,
              color: isActive ? '#111827' : '#6b7280',
              borderLeft: isActive ? '2px solid #111827' : '2px solid transparent',
              fontWeight: isActive ? 500 : 400,
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

const Placeholder: FunctionComponent<{ name: string; port: string }> = ({ name, port }) => (
  <div style={placeholderStyle}>
    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{name}</h1>
    <p style={{ margin: '0.5rem 0', color: '#6b7280' }}>
      Route stub — replace with your project's app.
    </p>
    <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.875rem' }}>
      <strong>Porting:</strong> {port}
    </p>
  </div>
);

// ─── styles ───────────────────────────────────────────────────────

const shellStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

const sidebarStyle: React.CSSProperties = {
  width: '200px',
  borderRight: '1px solid #e5e7eb',
  background: '#fafafa',
  padding: '1rem 0',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const brandStyle: React.CSSProperties = {
  fontWeight: 600,
  padding: '0 1rem 0.75rem',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '0.875rem',
  letterSpacing: '0.025em',
  color: '#111827',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  paddingTop: '0.5rem',
};

const navLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  padding: '0.5rem 1rem 0.5rem calc(1rem - 2px)',
  fontSize: '0.875rem',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: '1.5rem',
};

const placeholderStyle: React.CSSProperties = {
  padding: '1rem',
  border: '1px dashed #d1d5db',
  borderRadius: '0.375rem',
  background: '#fafafa',
};
