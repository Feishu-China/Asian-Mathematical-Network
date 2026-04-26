import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { schoolProvider } from '../features/school/schoolProvider';
import type { SchoolDetail as SchoolDetailModel } from '../features/school/types';
import './School.css';

export const routePath = '/schools/:slug';

export default function SchoolDetail() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const [school, setSchool] = useState<SchoolDetailModel | null | undefined>(undefined);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    setSchool(undefined);
    setHasError(false);

    schoolProvider
      .getSchoolBySlug(slug)
      .then((value) => {
        if (active) {
          setSchool(value);
        }
      })
      .catch(() => {
        if (active) {
          setSchool(null);
          setHasError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <PortalShell
      masthead={<PublicPortalNav />}
      eyebrow="School detail"
      title={school?.title ?? 'School detail'}
      description={school?.summary ?? 'Review the public school record and adjacent teaser routes from here.'}
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone={school ? (school.travelSupportAvailable ? 'success' : 'neutral') : hasError ? 'danger' : 'info'}>
            {school
              ? school.travelSupportAvailable
                ? 'Travel support available'
                : 'Travel support unavailable'
              : hasError
                ? 'Unavailable'
                : 'Published detail'}
          </StatusBadge>
        </>
      }
      actions={
        <Link
          to={returnContext?.to ?? '/schools'}
          state={returnContext?.state}
          className="my-applications__section-link"
        >
          {returnContext?.label ?? 'Back to schools'}
        </Link>
      }
      aside={
        school ? (
          <div className="school-detail-card school-teaser-card">
            <h2>Travel support teaser</h2>
            <p>{school.travelSupportTeaser}</p>
            <Link
              className="school-primary-link"
              to="/grants"
              state={{
                returnContext: {
                  to: `/schools/${school.slug}`,
                  label: 'Back to school',
                  state: toReturnContextState(returnContext),
                },
              }}
            >
              Explore travel support
            </Link>
          </div>
        ) : null
      }
    >
      <div className="school-page school-detail-page">
        {school === undefined ? (
          <DemoStatePanel
            badgeLabel="Loading"
            title="Loading school detail"
            description="Preparing this public school record for the demo."
            tone="info"
          />
        ) : hasError ? (
          <DemoStatePanel
            badgeLabel="Error"
            title="School detail unavailable"
            description="We could not load this school right now."
            tone="danger"
          />
        ) : school === null ? (
          <DemoStatePanel
            badgeLabel="Unavailable"
            title="School not found"
            description="This school is unavailable in the current demo dataset."
            tone="neutral"
          />
        ) : (
          <>
            <section className="school-detail-card">
              <h2>Training positioning</h2>
              <p>{school.positioning}</p>
            </section>

            <section className="school-detail-card">
              <h2>Audience and program outline</h2>
              <p>{school.audience}</p>
              <ul className="school-outline-list">
                {school.programOutline.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="school-detail-card">
              <h2>Outputs teaser</h2>
              <p>{school.outputsTeaser}</p>
              <div className="school-output-links">
                <Link
                  to="/videos"
                  state={{
                    returnContext: {
                      to: `/schools/${school.slug}`,
                      label: 'Back to school',
                      state: toReturnContextState(returnContext),
                    },
                  }}
                >
                  Videos
                </Link>
                <Link
                  to="/publications"
                  state={{
                    returnContext: {
                      to: `/schools/${school.slug}`,
                      label: 'Back to school',
                      state: toReturnContextState(returnContext),
                    },
                  }}
                >
                  Publications
                </Link>
                <Link
                  to="/newsletter"
                  state={{
                    returnContext: {
                      to: `/schools/${school.slug}`,
                      label: 'Back to school',
                      state: toReturnContextState(returnContext),
                    },
                  }}
                >
                  Newsletter
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </PortalShell>
  );
}
