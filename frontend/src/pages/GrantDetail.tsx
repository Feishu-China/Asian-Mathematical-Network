import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { getLinkedOpportunityCopy } from '../features/grant/linkedOpportunity';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { grantProvider } from '../features/grant/grantProvider';
import type { GrantDetail as GrantDetailModel } from '../features/grant/types';
import './Conference.css';

export const routePath = '/grants/:slug';

export default function GrantDetail() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const [grant, setGrant] = useState<GrantDetailModel | null | undefined>(undefined);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    setGrant(undefined);
    setHasError(false);

    grantProvider
      .getGrantBySlug(slug)
      .then((value) => {
        if (active) {
          setGrant(value);
        }
      })
      .catch(() => {
        if (active) {
          setHasError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (!hasError && grant === undefined) {
    return <div className="conference-page">Loading grant...</div>;
  }

  if (hasError) {
    return <div className="conference-page">We could not load this grant right now.</div>;
  }

  if (!grant) {
    return <div className="conference-page">Grant not found.</div>;
  }

  const grantDetail = grant;
  const linkedOpportunityCopy = getLinkedOpportunityCopy(grantDetail.linkedOpportunityType);

  return (
    <PortalShell
      eyebrow="Grant detail"
      title={grantDetail.title}
      description={grantDetail.description || 'No description has been published yet.'}
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone={grantDetail.isApplicationOpen ? 'success' : 'neutral'}>
            {grantDetail.isApplicationOpen ? 'Applications open' : 'Applications closed'}
          </StatusBadge>
        </>
      }
      actions={
        <Link
          to="/grants"
          state={toReturnContextState(returnContext)}
          className="my-applications__section-link"
        >
          Back to grants
        </Link>
      }
      aside={
        <div className="conference-detail-card conference-cta-card stack-sm">
          <h2>Applicant handoff</h2>
          <p>{linkedOpportunityCopy.handoffSummary}</p>
          <p className="conference-muted-note">
            {linkedOpportunityCopy.handoffHint}
          </p>
          {grantDetail.isApplicationOpen ? (
            <Link
              className="conference-primary-link"
              to={`/grants/${grantDetail.slug}/apply`}
              state={toReturnContextState(returnContext)}
            >
              Start grant application
            </Link>
          ) : (
            <div className="conference-muted-note">This grant is no longer accepting applications.</div>
          )}
        </div>
      }
    >
      <div className="conference-page conference-detail-page">
        <section className="conference-detail-card">
          <h2>Support snapshot</h2>
          <dl>
            <div>
              <dt>Grant type</dt>
              <dd>{linkedOpportunityCopy.grantTypeLabel}</dd>
            </div>
            {grantDetail.linkedOpportunityTitle ? (
              <div>
                <dt>Linked opportunity</dt>
                <dd>{grantDetail.linkedOpportunityTitle}</dd>
              </div>
            ) : null}
            <div>
              <dt>Deadline</dt>
              <dd>{grantDetail.applicationDeadline || 'Pending'}</dd>
            </div>
            <div>
              <dt>Coverage</dt>
              <dd>{grantDetail.coverageSummary || 'Pending'}</dd>
            </div>
            <div>
              <dt>Eligibility</dt>
              <dd>{grantDetail.eligibilitySummary || 'Pending'}</dd>
            </div>
          </dl>
        </section>
      </div>
    </PortalShell>
  );
}
