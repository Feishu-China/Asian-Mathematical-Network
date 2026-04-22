import { StatusBadge } from '../../../components/ui/StatusBadge';
import type { GrantReleasedResultViewModel } from '../grantApplicantState';

type Props = {
  result: GrantReleasedResultViewModel;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export function GrantReleasedResultCard({ result }: Props) {
  return (
    <section className="conference-detail-card stack-sm">
      <div className="stack-sm">
        <StatusBadge tone={result.outcome === 'awarded' ? 'success' : 'neutral'}>
          Released outcome
        </StatusBadge>
        <h2>{result.title}</h2>
      </div>
      <p>{result.summary}</p>
      <p className="conference-muted-note">{result.note}</p>
      <div className="conference-publish-hint">Released to applicant: {formatDate(result.releasedAt)}</div>
    </section>
  );
}
