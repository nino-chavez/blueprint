import { FunctionComponent } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { PrototypeShell } from './components/PrototypeShell';

export const App: FunctionComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/prototypes/*" element={<PrototypeShell />} />
    </Routes>
  );
};
