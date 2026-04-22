import { StatusBadge } from '../../../components/ui/StatusBadge';
import type { GrantApplicantVisibleState } from '../grantApplicantState';
import type { GrantApplication, GrantDetail } from '../types';

type Props = {
  grant: GrantDetail;
  application: GrantApplication | null;
  linkedConferenceApplicationId: string;
  visibleState: GrantApplicantVisibleState;
};

const formatDate = (value: string | null) => {
  if (!value) {
    return 'Pending';
  }

  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
};

const toTone = (state: GrantApplicantVisibleState): 'neutral' | 'info' | 'warning' | 'success' => {
  switch (state) {
    case 'prerequisite_blocked':
      return 'warning';
    case 'draft_exists':
      return 'warning';
    case 'submitted_under_review':
      return 'info';
    case 'released_result':
      return 'success';
    case 'no_application':
      return 'neutral';
  }
};

export function GrantApplicationSummaryCard({
  grant,
  application,
  linkedConferenceApplicationId,
  visibleState,
}: Props) {
  return (
    <section className="conference-detail-card stack-sm">
      <div className="stack-sm">
        <h2>Grant record summary</h2>
        <StatusBadge tone={toTone(visibleState)}>Grant-owned summary</StatusBadge>
      </div>

      <dl>
        <div>
          <dt>Record ownership</dt>
          <dd>Separate M7 grant application record</dd>
        </div>
        <div>
          <dt>Linked conference application</dt>
          <dd>{linkedConferenceApplicationId || 'Required before grant submission'}</dd>
        </div>
        <div>
          <dt>Grant deadline</dt>
          <dd>{formatDate(grant.applicationDeadline)}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{application ? formatDate(application.updatedAt) : 'Not started yet'}</dd>
        </div>
        <div>
          <dt>Post-visit reporting</dt>
          <dd>
            {grant.reportRequired
              ? 'Future integration reserved. This slice does not implement the report page.'
              : 'No post-visit report expected for this opportunity.'}
          </dd>
        </div>
      </dl>
    </section>
  );
}
