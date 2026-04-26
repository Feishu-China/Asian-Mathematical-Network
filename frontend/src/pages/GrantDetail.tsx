import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
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

  const grantDetail = grant ?? null;
  const linkedOpportunityCopy = grantDetail
    ? getLinkedOpportunityCopy(grantDetail.linkedOpportunityType)
    : null;

  return (
    <PortalShell
      masthead={<PublicPortalNav />}
      eyebrow="Grant detail"
      title={grantDetail?.title ?? 'Grant detail'}
      description={
        grantDetail?.description ||
        'Review the public grant record, prerequisite copy, and applicant handoff from here.'
      }
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone={grantDetail ? (grantDetail.isApplicationOpen ? 'success' : 'neutral') : hasError ? 'danger' : 'info'}>
            {grantDetail
              ? grantDetail.isApplicationOpen
                ? 'Applications open'
                : 'Applications closed'
              : hasError
                ? 'Unavailable'
                : 'Published detail'}
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
        grantDetail && linkedOpportunityCopy ? (
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
        ) : null
      }
    >
      <div className="conference-page conference-detail-page">
        {hasError ? (
          <DemoStatePanel
            badgeLabel="Error"
            title="Grant detail unavailable"
            description="We could not load this grant right now."
            tone="danger"
          />
        ) : grant === undefined ? (
          <DemoStatePanel
            badgeLabel="Loading"
            title="Loading grant detail"
            description="Preparing this published grant record for the demo."
            tone="info"
          />
        ) : !grantDetail || !linkedOpportunityCopy ? (
          <DemoStatePanel
            badgeLabel="Unavailable"
            title="Grant not found"
            description="This grant is not published or is unavailable in the current demo dataset."
            tone="neutral"
          />
        ) : (
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
        )}
      </div>
    </PortalShell>
  );
}
