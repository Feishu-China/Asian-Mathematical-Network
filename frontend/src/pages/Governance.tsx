import { Link, useLocation } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
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
      eyebrow="Governance preview"
      title="Governance"
      description="An admin-side preview for governance checkpoints, reviewer boundaries, and release controls that stay static in d0."
      badges={
        <>
          <RoleBadge role="admin" />
          <PageModeBadge mode="static-preview" />
          <StatusBadge tone="warning">Governance preview</StatusBadge>
        </>
      }
      actions={
        returnContext ? (
          <Link to={returnContext.to} className="my-applications__section-link">
            {returnContext.label}
          </Link>
        ) : null
      }
      aside={
        <div className="governance-card governance-teaser-card">
          <h2>Preview scope</h2>
          <p>
            This surface shows what a future admin governance layer could clarify around release
            timing, committee boundaries, and public archive readiness.
          </p>
          <StatusBadge tone="neutral">Static preview only</StatusBadge>
        </div>
      }
    >
      <div className="governance-page">
        <div className="governance-grid">
          {governancePreviewSections.map((section) => (
            <section key={section.id} className="governance-card">
              <h2>{section.title}</h2>
              <p className="governance-card__summary">{section.summary}</p>
              <ul className="governance-card__list">
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
