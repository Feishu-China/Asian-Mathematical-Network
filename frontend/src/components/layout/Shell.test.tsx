import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PageModeBadge } from '../ui/PageModeBadge';
import { RoleBadge } from '../ui/RoleBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { PortalShell } from './PortalShell';
import { WorkspaceShell } from './WorkspaceShell';

describe('foundation shells', () => {
  it('renders a portal shell masthead before the standard page header', () => {
    render(
      <PortalShell
        masthead={<nav aria-label="Public portal">Portal navigation</nav>}
        eyebrow="Public portal"
        title="Portal"
        description="Public homepage shell."
      >
        <div>Portal body</div>
      </PortalShell>
    );

    expect(screen.getByRole('navigation', { name: 'Public portal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Portal' })).toBeInTheDocument();
    expect(screen.getByText('Portal body')).toBeInTheDocument();
  });

  it('renders portal shell header markers and content', () => {
    render(
      <PortalShell
        eyebrow="Public portal"
        title="Conference detail"
        description="Shared entry point for the public-facing opportunity flow."
        badges={
          <>
            <RoleBadge role="visitor" />
            <PageModeBadge mode="hybrid" />
            <StatusBadge tone="info">Demo data</StatusBadge>
          </>
        }
      >
        <div>Portal body</div>
      </PortalShell>
    );

    expect(screen.getByRole('heading', { name: 'Conference detail' })).toBeInTheDocument();
    expect(screen.getByText('Role: Visitor')).toBeInTheDocument();
    expect(screen.getByText('Page mode: Hybrid')).toBeInTheDocument();
    expect(screen.getByText('Demo data')).toBeInTheDocument();
    expect(screen.getByText('Portal body')).toBeInTheDocument();
  });

  it('renders workspace shell actions and aside content', () => {
    render(
      <WorkspaceShell
        eyebrow="Applicant workspace"
        title="Dashboard"
        description="Internal working surface for authenticated users."
        badges={
          <>
            <RoleBadge role="applicant" />
            <PageModeBadge mode="real-aligned" />
          </>
        }
        actions={<button type="button">Primary action</button>}
        aside={<div>Sidebar card</div>}
      >
        <div>Workspace body</div>
      </WorkspaceShell>
    );

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Role: Applicant')).toBeInTheDocument();
    expect(screen.getByText('Page mode: Real-aligned')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Primary action' })).toBeInTheDocument();
    expect(screen.getByText('Sidebar card')).toBeInTheDocument();
    expect(screen.getByText('Workspace body')).toBeInTheDocument();
  });

  it('renders a shared account menu in the workspace shell header', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <WorkspaceShell
          eyebrow="Applicant workspace"
          title="Dashboard"
          description="Internal working surface for authenticated users."
          accountMenu={{
            label: 'Account',
            items: [
              { kind: 'link', to: '/me/applications', label: 'My Applications' },
              { kind: 'link', to: '/me/profile', label: 'My Profile' },
              { kind: 'action', label: 'Log out', onSelect: () => undefined },
            ],
          }}
        >
          <div>Workspace body</div>
        </WorkspaceShell>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My Applications' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Account' }));

    expect(screen.getByRole('link', { name: 'My Applications' })).toHaveAttribute(
      'href',
      '/me/applications'
    );
    expect(screen.getByRole('link', { name: 'My Profile' })).toHaveAttribute('href', '/me/profile');
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });
});
