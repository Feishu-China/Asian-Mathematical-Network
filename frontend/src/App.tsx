import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auto-loader for pages using Vite's glob import
const pages = import.meta.glob('./pages/*.tsx', { eager: true });

const routes = Object.keys(pages).map((path) => {
  const name = path.match(/\.\/pages\/(.*)\.tsx$/)?.[1];
  if (!name) return null;
  
  // Convert filename to route path (e.g., Login -> /login, Dashboard -> /dashboard)
  const routePath = `/${name.toLowerCase()}`;
  const Component = (pages[path] as any).default;
  
  return {
    path: routePath,
    Component
  };
}).filter(Boolean);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        {routes.map((route: any) => (
          <Route key={route.path} path={route.path} element={<route.Component />} />
        ))}
      </Routes>
    </Router>
  );
}

export default App;