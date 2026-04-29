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

    expect(screen.getByRole('navigation', { name: /public sections/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /prize pathways/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse prize archive/i })).toHaveAttribute(
      'href',
      '#prize-archive-list'
    );
    expect(
      screen.getByRole('heading', { name: 'Asiamath Early Career Prize 2026' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Prize archive')).toHaveLength(2);
    expect(
      screen.getByText(/Public recognition pages should preview scholar records, nomination flow, and governance structure/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view prize/i })).toHaveAttribute(
      'href',
      '/prizes/asiamath-early-career-prize-2026'
    );
    expect(
      screen.getAllByText(/open the detail view to see the governance and selection-process preview/i)
    ).toHaveLength(1);
  });

  it('keeps the hub copy, archive cards, and detail teaser links available through the prize flow', async () => {
    renderWithRouter(
      <PrizeDetail />,
      '/prizes/asiamath-early-career-prize-2026',
      '/prizes/:slug'
    );

    expect(
      await screen.findByRole('heading', { name: 'Asiamath Early Career Prize 2026' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /selection process preview/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Nominations, committee review, and citation release remain visible/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Nomination record')).toBeInTheDocument();
    expect(screen.getByText('Committee review')).toBeInTheDocument();
    expect(screen.getByText('Released citation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view governance preview/i })).toHaveAttribute(
      'href',
      '/admin/governance'
    );
    expect(screen.getByRole('link', { name: /view sample laureate profile/i })).toHaveAttribute(
      'href',
      '/scholars/prof-reviewer'
    );
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
    expect(
      screen.getByText(/Nominations, committee review, and citation release remain visible/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Nomination record')).toBeInTheDocument();
    expect(screen.getByText('Committee review')).toBeInTheDocument();
    expect(screen.getByText('Released citation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view governance preview/i })).toHaveAttribute(
      'href',
      '/admin/governance'
    );
    expect(screen.getByRole('link', { name: /view sample laureate profile/i })).toHaveAttribute(
      'href',
      '/scholars/prof-reviewer'
    );
  });
});
