import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getLinkedOpportunityCopy } from '../linkedOpportunity';
import type { GrantApplicantVisibleState } from '../grantApplicantState';
import type { LinkedOpportunityType } from '../types';

type Props = {
  state: GrantApplicantVisibleState;
  linkedOpportunityType: LinkedOpportunityType;
};

const staticPanelCopy: Record<
  Exclude<GrantApplicantVisibleState, 'prerequisite_blocked'>,
  {
    tone: 'info' | 'warning' | 'success';
    badge: string;
    title: string;
    description: string;
    hint: string;
  }
> = {
  no_application: {
    tone: 'info',
    badge: 'Applicant state',
    title: 'No grant application yet',
    description: 'You can start a separate grant application for this opportunity.',
    hint: 'The grant record remains separate from the linked opportunity participation record.',
  },
  draft_exists: {
    tone: 'warning',
    badge: 'Applicant state',
    title: 'Draft in progress',
    description:
      'Your grant application draft exists but has not been submitted into review yet.',
    hint: 'Complete the statement, travel plan, and funding need sections before submitting.',
  },
  submitted_under_review: {
    tone: 'info',
    badge: 'Applicant state',
    title: 'Submitted and under review',
    description:
      'Your grant application has been submitted. Applicants only see the published applicant result after release.',
    hint: 'Reviewer notes and internal decision details stay hidden until a result is formally released.',
  },
  released_result: {
    tone: 'success',
    badge: 'Applicant state',
    title: 'Released result available',
    description:
      'A viewer-safe released outcome is now available to the applicant for this grant record.',
    hint: 'This page still hides non-public review history and only exposes the released applicant outcome.',
  },
};

export function GrantApplicationStatePanel({ state, linkedOpportunityType }: Props) {
  const linkedOpportunityCopy = getLinkedOpportunityCopy(linkedOpportunityType);
  const copy =
    state === 'prerequisite_blocked'
      ? {
          tone: 'warning' as const,
          badge:
            linkedOpportunityType === 'school' ? 'School prerequisite' : 'Conference prerequisite',
          title: linkedOpportunityCopy.prerequisiteTitle,
          description: linkedOpportunityCopy.prerequisiteDescription,
          hint: 'This grant page stays grant-owned. It does not replace the future applicant dashboard.',
        }
      : staticPanelCopy[state];

  return (
    <section className="conference-detail-card stack-sm">
      <StatusBadge tone={copy.tone}>{copy.badge}</StatusBadge>
      <div className="stack-sm">
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
        <p className="conference-muted-note">{copy.hint}</p>
      </div>
    </section>
  );
}
