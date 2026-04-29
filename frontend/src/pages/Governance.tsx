import { Link, useLocation } from 'react-router-dom';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { readReturnContext } from '../features/navigation/returnContext';
import { governancePreviewSections } from '../features/governance/staticGovernanceContent';
import './Governance.css';

export const routePath = '/admin/governance';

export default function Governance() {
  const location = useLocation();
  const returnContext = readReturnContext(location.state);

  return (
    <PortalShell
      masthead={<PublicPortalNav />}
      eyebrow="Governance preview"
      title="Governance"
      description="A static preview of how a future admin governance layer could frame committee boundaries, reviewer checkpoints, and release controls in d0."
      badges={
        <>
          <PageModeBadge mode="static-preview" />
          <StatusBadge tone="neutral">Admin preview perspective</StatusBadge>
          <StatusBadge tone="warning">Governance preview</StatusBadge>
        </>
      }
      actions={
        returnContext ? (
          <Link
            to={returnContext.to}
            state={returnContext.state}
            className="my-applications__section-link"
          >
            {returnContext.label}
          </Link>
        ) : null
      }
      aside={
        <div className="governance-card governance-teaser-card public-browse-card public-browse-aside-card">
          <h2>Preview scope</h2>
          <p className="public-browse-copy">
            This surface stays public in the demo, but it represents what a future admin-facing
            governance layer could clarify around release timing, committee boundaries, and public
            archive readiness.
          </p>
          <StatusBadge tone="neutral">Static preview only</StatusBadge>
        </div>
      }
    >
      <div className="governance-page public-browse-page">
        <div className="governance-grid public-browse-grid">
          {governancePreviewSections.map((section) => (
            <section key={section.id} className="governance-card public-browse-card">
              <h2>{section.title}</h2>
              <p className="governance-card__summary public-browse-copy">{section.summary}</p>
              <ul className="governance-card__list public-browse-list">
                {section.checkpoints.map((checkpoint) => (
                  <li key={checkpoint}>{checkpoint}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
