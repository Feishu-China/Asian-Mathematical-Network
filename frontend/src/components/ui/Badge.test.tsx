import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageModeBadge } from './PageModeBadge';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';

describe('foundation badges', () => {
  it('renders role and page mode badges with explicit demo labels', () => {
    render(
      <>
        <RoleBadge role="applicant" />
        <PageModeBadge mode="real-aligned" />
      </>
    );

    expect(screen.getByText('Role: Applicant')).toBeInTheDocument();
    expect(screen.getByText('Page mode: Real-aligned')).toBeInTheDocument();
  });

  it('renders status badges with visible content', () => {
    render(<StatusBadge tone="success">Submitted</StatusBadge>);

    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });
});
