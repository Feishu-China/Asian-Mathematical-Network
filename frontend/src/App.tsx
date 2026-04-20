import type { ComponentType } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const pages = import.meta.glob('./pages/*.tsx', { eager: true });

const routes = Object.entries(pages)
  .map(([path, module]) => {
    const name = path.match(/\.\/pages\/(.*)\.tsx$/)?.[1];
    if (!name) {
      return null;
    }

    const typedModule = module as { default: ComponentType; routePath?: string };

    return {
      path: typedModule.routePath ?? `/${name.toLowerCase()}`,
      Component: typedModule.default,
    };
  })
  .filter(Boolean) as Array<{ path: string; Component: ComponentType }>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={<route.Component />} />
        ))}
      </Routes>
    </Router>
  );
}

export default App;
