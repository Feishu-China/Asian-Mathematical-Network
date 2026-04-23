import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { schoolProvider } from '../features/school/schoolProvider';
import type { SchoolDetail as SchoolDetailModel } from '../features/school/types';
import './School.css';

export const routePath = '/schools/:slug';

export default function SchoolDetail() {
  const { slug = '' } = useParams();
  const [school, setSchool] = useState<SchoolDetailModel | null | undefined>(undefined);

  useEffect(() => {
    schoolProvider.getSchoolBySlug(slug).then(setSchool);
  }, [slug]);

  if (school === undefined) {
    return <div className="school-page">Loading school...</div>;
  }

  if (school === null) {
    return <div className="school-page">School not found.</div>;
  }

  return (
    <PortalShell
      eyebrow="School detail"
      title={school.title}
      description={school.summary}
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone={school.travelSupportAvailable ? 'success' : 'neutral'}>
            {school.travelSupportAvailable
              ? 'Travel support available'
              : 'Travel support unavailable'}
          </StatusBadge>
        </>
      }
      actions={
        <Link to="/schools" className="my-applications__section-link">
          Back to schools
        </Link>
      }
      aside={
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
              },
            }}
          >
            Explore travel support
          </Link>
        </div>
      }
    >
      <div className="school-page school-detail-page">
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
                },
              }}
            >
              Videos
            </Link>
            <Link to="/publications">Publications</Link>
            <Link
              to="/newsletter"
              state={{
                returnContext: {
                  to: `/schools/${school.slug}`,
                  label: 'Back to school',
                },
              }}
            >
              Newsletter
            </Link>
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
