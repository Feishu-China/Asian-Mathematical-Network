import type { GrantApplication } from './types';

export type GrantApplicantVisibleState =
  | 'prerequisite_blocked'
  | 'no_application'
  | 'draft_exists'
  | 'submitted_under_review'
  | 'released_result';

export type GrantReleasedResultViewModel = {
  outcome: 'awarded' | 'not_awarded';
  title: string;
  summary: string;
  note: string;
  releasedAt: string;
};

const releasedResultSample: GrantReleasedResultViewModel = {
  outcome: 'awarded',
  title: 'Travel grant awarded',
  summary:
    'Released result: airfare support approved together with a capped accommodation contribution.',
  note:
    'This sample only shows the applicant-visible released outcome. Non-public review details remain hidden.',
  releasedAt: '2026-05-18T09:00:00.000Z',
};

const releasedResultDemoSamples = [
  {
    viewerEmails: ['grant.submit@example.com'],
    grantIds: ['grant-published-001'],
    // Support both the fake-provider grant and the seeded backend demo grant.
    grantSlugs: ['asiamath-2026-travel-grant', 'integration-grant-2026-travel-support'],
    result: releasedResultSample,
  },
];

const matchReleasedResultDemoSample = ({
  grantId,
  grantSlug,
  viewerEmail,
}: {
  grantId: string;
  grantSlug?: string | null;
  viewerEmail: string;
}) =>
  releasedResultDemoSamples.find((sample) => {
    const matchesViewer = sample.viewerEmails.includes(viewerEmail);
    const matchesGrantId = sample.grantIds.includes(grantId);
    const matchesGrantSlug = grantSlug ? sample.grantSlugs.includes(grantSlug) : false;

    return matchesViewer && (matchesGrantId || matchesGrantSlug);
  });

export const getDemoReleasedGrantResult = (
  {
    application,
    viewerEmail,
    grantSlug,
  }: {
    application: GrantApplication | null;
    viewerEmail?: string | null;
    grantSlug?: string | null;
  }
): GrantReleasedResultViewModel | null => {
  const normalizedViewerEmail = viewerEmail?.trim().toLowerCase();

  if (!application || application.status !== 'submitted' || !normalizedViewerEmail) {
    return null;
  }

  return (
    matchReleasedResultDemoSample({
      grantId: application.grantId,
      grantSlug,
      viewerEmail: normalizedViewerEmail,
    })?.result ?? null
  );
};

export const getGrantApplicantVisibleState = ({
  application,
  prerequisiteReady,
  releasedResult,
}: {
  application: GrantApplication | null;
  prerequisiteReady: boolean;
  releasedResult: GrantReleasedResultViewModel | null;
}): GrantApplicantVisibleState => {
  if (releasedResult) {
    return 'released_result';
  }

  if (application?.status === 'submitted') {
    return 'submitted_under_review';
  }

  if (application?.status === 'draft') {
    return 'draft_exists';
  }

  if (!prerequisiteReady) {
    return 'prerequisite_blocked';
  }

  return 'no_application';
};

export const getGrantApplicantVisibleStateLabel = (state: GrantApplicantVisibleState) => {
  switch (state) {
    case 'prerequisite_blocked':
      return 'Prerequisite blocked';
    case 'no_application':
      return 'No application yet';
    case 'draft_exists':
      return 'Draft in progress';
    case 'submitted_under_review':
      return 'Under review';
    case 'released_result':
      return 'Released outcome visible';
  }
};
