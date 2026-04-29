import type { LinkedOpportunityType } from './types';

export type LinkedOpportunityCopy = {
  grantTypeLabel: string;
  prerequisiteTitle: string;
  prerequisiteDescription: string;
  blockedMessage: string;
  linkedRecordLabel: string;
  linkedRecordHint: string;
  handoffSummary: string;
  handoffHint: string;
  shellDescription: string;
  formHint: string;
};

const linkedOpportunityCopy: Record<LinkedOpportunityType, LinkedOpportunityCopy> = {
  conference: {
    grantTypeLabel: 'Conference travel grant',
    prerequisiteTitle: 'Conference application required first',
    prerequisiteDescription:
      'Submit your conference application before starting a separate grant application record.',
    blockedMessage: 'Submit your conference application before requesting travel support.',
    linkedRecordLabel: 'Linked conference application',
    linkedRecordHint: 'Required before grant submission',
    handoffSummary: 'Conference application required before grant submission.',
    handoffHint:
      'Grant applications stay separate from conference applications, even when they are linked.',
    shellDescription:
      'Request travel support through a dedicated grant application after your conference application has already been submitted.',
    formHint:
      'Grant applications stay separate from conference applications, even when the conference submission is required first.',
  },
  school: {
    grantTypeLabel: 'School mobility grant',
    prerequisiteTitle: 'School participation required first',
    prerequisiteDescription:
      'Join the linked school before starting a separate grant application record.',
    blockedMessage: 'Join the linked school before requesting travel support.',
    linkedRecordLabel: 'Linked school participation',
    linkedRecordHint: 'Required before grant submission',
    handoffSummary: 'School participation required before grant submission.',
    handoffHint:
      'Grant applications stay separate from school participation records, even when they are linked.',
    shellDescription:
      'Request mobility support through a dedicated grant application after your linked school participation is already in place.',
    formHint:
      'Grant applications stay separate from school participation records, even when school participation is required first.',
  },
};

export const getLinkedOpportunityCopy = (type: LinkedOpportunityType) => linkedOpportunityCopy[type];

export type SyntheticSchoolParticipation = {
  id: string;
  title: string | null;
  type: 'school';
  status: 'ready';
};

export const buildSyntheticSchoolParticipation = (
  linkedOpportunityId: string,
  linkedOpportunityTitle: string | null,
  userId: string
): SyntheticSchoolParticipation => ({
  id: `school-participation-${linkedOpportunityId}-${userId}`,
  title: linkedOpportunityTitle,
  type: 'school',
  status: 'ready',
});
