import { render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';

test('redirects the root route to the portal entry', async () => {
  window.history.pushState({}, '', '/');

  render(<App />);

  await waitFor(() => {
    expect(window.location.pathname).toBe('/portal');
  });

  expect(
    await screen.findByRole('heading', {
      name: /connecting asia's mathematical community/i,
    })
  ).toBeInTheDocument();
});
