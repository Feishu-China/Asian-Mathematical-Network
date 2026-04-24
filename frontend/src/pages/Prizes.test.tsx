import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetPrizeFakeState } from '../features/prize/fakePrizeProvider';
import Prizes from './Prizes';
import PrizeDetail from './PrizeDetail';

describe('prize public pages', () => {
  beforeEach(() => {
    localStorage.clear();
    resetPrizeFakeState();
  });

  it('renders the prize archive as a governance-oriented breadth surface', async () => {
    renderWithRouter(<Prizes />, '/prizes', '/prizes');

    expect(
      await screen.findByRole('heading', { name: 'Asiamath Early Career Prize 2026' })
    ).toBeInTheDocument();
    expect(screen.getByText('Prize archive')).toBeInTheDocument();
    expect(screen.getByText(/Scholar identity, nomination context, and governance signals/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view prize/i })).toHaveAttribute(
      'href',
      '/prizes/asiamath-early-career-prize-2026'
    );
    expect(
      screen.getAllByText(/open the detail view to see the governance and selection-process preview/i)
    ).toHaveLength(2);
  });

  it('renders prize detail with nomination and review concept preview', async () => {
    renderWithRouter(
      <PrizeDetail />,
      '/prizes/asiamath-early-career-prize-2026',
      '/prizes/:slug'
    );

    expect(
      await screen.findByRole('heading', { name: 'Asiamath Early Career Prize 2026' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /selection process preview/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to prizes/i })).toHaveAttribute(
      'href',
      '/prizes'
    );
    expect(screen.getByText(/Nomination intake, confidential review, and committee release remain part of the same platform direction/i)).toBeInTheDocument();
    expect(screen.getByText('Nominations preview')).toBeInTheDocument();
    expect(screen.getByText('Confidential review concept')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view governance preview/i })).toHaveAttribute(
      'href',
      '/admin/governance'
    );
  });
});
