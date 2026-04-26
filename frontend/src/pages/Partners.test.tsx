import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetPartnerFakeState } from '../features/partner/fakePartnerProvider';
import Partners from './Partners';
import ScholarProfile from './ScholarProfile';

describe('partner public pages', () => {
  beforeEach(() => {
    localStorage.clear();
    resetPartnerFakeState();
  });

  it('renders the partners surface with an expertise-matching teaser', async () => {
    renderWithRouter(<Partners />, '/partners', '/partners');

    expect(screen.getByRole('navigation', { name: /public sections/i })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Institute for Mathematical Systems and Data' })
    ).toBeInTheDocument();
    expect(screen.getByText('Industry and partner network')).toBeInTheDocument();
    expect(
      screen.getByText(/Institutional collaboration, applied research pathways, and expertise matching/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sample matching flow/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /reviewing a scholar's public profile, research areas, and institution before requesting an introduction/i
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view sample scholar profile/i })).toHaveAttribute(
      'href',
      '/scholars/prof-reviewer'
    );
  });

  it('restores the portal return path after opening scholar context and coming back', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/partners',
            state: {
              returnContext: {
                to: '/portal',
                label: 'Back to portal',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/partners" element={<Partners />} />
          <Route path="/scholars/:slug" element={<ScholarProfile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: /back to portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );

    await user.click(screen.getByRole('link', { name: /view sample scholar profile/i }));
    await user.click(await screen.findByRole('link', { name: /back to partners/i }));

    expect(await screen.findByRole('link', { name: /back to portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );
  });
});
