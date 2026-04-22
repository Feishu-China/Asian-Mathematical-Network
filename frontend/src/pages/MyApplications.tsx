import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { dashboardProvider } from '../features/dashboard/dashboardProvider';
import type { MyApplication, MyApplicationStatus } from '../features/dashboard/types';
import './MyApplications.css';

export const routePath = '/me/applications';

type Bucket = {
  conference: MyApplication[];
  grant: MyApplication[];
};

const STATUS_TONES: Record<MyApplicationStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  submitted: 'info',
  under_review: 'warning',
  decided: 'success',
  withdrawn: 'danger',
};

const STATUS_LABELS: Record<MyApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under review',
  decided: 'Decided',
  withdrawn: 'Withdrawn',
};

const splitByKind = (items: MyApplication[]): Bucket =>
  items.reduce<Bucket>(
    (acc, item) => {
      if (item.applicationType === 'conference_application') {
        acc.conference.push(item);
      } else {
        acc.grant.push(item);
      }
      return acc;
    },
    { conference: [], grant: [] }
  );

const conferenceCta = (item: MyApplication) => {
  if (!item.conferenceSlug) {
    return null;
  }

  if (item.status === 'draft') {
    return {
      to: `/conferences/${item.conferenceSlug}/apply`,
      label: 'Continue draft',
    };
  }

  return {
    to: `/conferences/${item.conferenceSlug}`,
    label: 'View conference',
  };
};

const grantCta = (item: MyApplication) => {
  if (!item.grantSlug) {
    return null;
  }

  if (item.status === 'draft') {
    return {
      to: `/grants/${item.grantSlug}/apply`,
      label: 'Continue draft',
    };
  }

  return {
    to: `/grants/${item.grantSlug}`,
    label: 'View grant',
  };
};

export default function MyApplications() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MyApplication[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    setHasError(false);
    setItems(null);

    dashboardProvider
      .listMyApplications()
      .then((value) => {
        if (active) {
          setItems(value);
        }
      })
      .catch(() => {
        if (active) {
          setHasError(true);
          setItems([]);
        }
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  const buckets = items ? splitByKind(items) : null;

  return (
    <WorkspaceShell
      eyebrow="Applicant workspace"
      title="My applications"
      description="Conference and travel grant applications you've started or submitted."
      badges={
        <>
          <RoleBadge role="applicant" />
          <PageModeBadge mode="real-aligned" />
          <StatusBadge tone="info">My applications</StatusBadge>
        </>
      }
    >
      {items === null ? (
        <div className="conference-empty">Loading your applications...</div>
      ) : (
        <div className="my-applications">
          {hasError ? (
            <div className="conference-inline-message error">
              We could not load your applications right now.
            </div>
          ) : null}

          <ApplicationSection
            heading="Conference applications"
            items={buckets?.conference ?? []}
            emptyHint="You have no conference applications yet."
            browseLink={{ to: '/conferences', label: 'Browse conferences' }}
            renderCta={conferenceCta}
            renderTitle={(item) => item.conferenceTitle ?? 'Untitled conference'}
          />

          <ApplicationSection
            heading="Travel grant applications"
            items={buckets?.grant ?? []}
            emptyHint="You have no travel grant applications yet."
            browseLink={{ to: '/grants', label: 'Browse grants' }}
            renderCta={grantCta}
            renderTitle={(item) => item.grantTitle ?? 'Untitled grant'}
          />
        </div>
      )}
    </WorkspaceShell>
  );
}

type ApplicationSectionProps = {
  heading: string;
  items: MyApplication[];
  emptyHint: string;
  browseLink: { to: string; label: string };
  renderCta: (item: MyApplication) => { to: string; label: string } | null;
  renderTitle: (item: MyApplication) => string;
};

function ApplicationSection({
  heading,
  items,
  emptyHint,
  browseLink,
  renderCta,
  renderTitle,
}: ApplicationSectionProps) {
  return (
    <section className="dashboard-widget" aria-labelledby={`section-${heading}`}>
      <header className="my-applications__section-header">
        <h2 id={`section-${heading}`}>{heading}</h2>
        <Link to={browseLink.to} className="my-applications__section-link">
          {browseLink.label}
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="conference-empty">{emptyHint}</p>
      ) : (
        <ul className="my-applications__list">
          {items.map((item) => {
            const cta = renderCta(item);
            return (
              <li key={item.id} className="surface-card my-applications__row">
                <div className="my-applications__row-meta">
                  <h3>{renderTitle(item)}</h3>
                  <StatusBadge tone={STATUS_TONES[item.status]}>
                    {STATUS_LABELS[item.status]}
                  </StatusBadge>
                </div>
                {item.submittedAt ? (
                  <p className="my-applications__row-timestamp">
                    Submitted {new Date(item.submittedAt).toLocaleDateString()}
                  </p>
                ) : null}
                {cta ? (
                  <Link to={cta.to} className="conference-primary-link">
                    {cta.label}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
