import { FunctionComponent } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageOne } from './pages/PageOne';
import { PageTwo } from './pages/PageTwo';

const TemplateRoutes: FunctionComponent = () => {
  return (
    <Routes>
      <Route path="_template">
        <Route index element={<PageOne />} />
        <Route path="page-two" element={<PageTwo />} />
      </Route>
    </Routes>
  );
};

export default TemplateRoutes;
