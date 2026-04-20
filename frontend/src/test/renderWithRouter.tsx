import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

export const renderWithRouter = (
  element: ReactElement,
  initialEntry: string,
  routePath = initialEntry
) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={routePath} element={element} />
      </Routes>
    </MemoryRouter>
  );
