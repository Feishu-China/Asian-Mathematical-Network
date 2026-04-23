import {
  formatCareerStage,
  formatCountryCode,
  formatDateTime,
} from './profilePresentation';
import type { PublicScholarProfile } from './types';

type Props = {
  profile: PublicScholarProfile;
};

export function PublicScholarCard({ profile }: Props) {
  const headingLine = [profile.title, profile.institutionNameRaw, profile.countryCode]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="scholar-card">
      <header className="scholar-header">
        <div>
          <p className="scholar-kicker">Public scholar profile</p>
          <h2>{profile.fullName}</h2>
          <p>{headingLine || 'Profile details available below.'}</p>
        </div>
      </header>

      <section className="scholar-section">
        <h2>Profile overview</h2>
        <dl className="scholar-facts">
          <div>
            <dt>Affiliation</dt>
            <dd>{profile.institutionNameRaw || 'Not provided'}</dd>
          </div>
          <div>
            <dt>Country / region</dt>
            <dd>{formatCountryCode(profile.countryCode)}</dd>
          </div>
          <div>
            <dt>Career stage</dt>
            <dd>{formatCareerStage(profile.careerStage)}</dd>
          </div>
          <div>
            <dt>Public slug</dt>
            <dd>{profile.slug}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{formatDateTime(profile.updatedAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="scholar-section">
        <h2>Research profile</h2>
        <div className="scholar-stack">
          <div>
            <h3>Keywords</h3>
            {profile.researchKeywords.length > 0 ? (
              <ul className="profile-pill-list">
                {profile.researchKeywords.map((keyword) => (
                  <li key={keyword}>{keyword}</li>
                ))}
              </ul>
            ) : (
              <p>No keywords provided.</p>
            )}
          </div>
          <div>
            <h3>MSC codes</h3>
            {profile.mscCodes.length > 0 ? (
              <ul className="profile-pill-list">
                {profile.mscCodes.map((item) => (
                  <li key={item.code}>
                    {item.code}
                    {item.isPrimary ? ' (primary)' : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No MSC codes provided.</p>
            )}
          </div>
        </div>
      </section>

      <section className="scholar-section">
        <h2>Biography</h2>
        <p>{profile.bio || 'No biography provided.'}</p>
      </section>

      <section className="scholar-section">
        <h2>Public links</h2>
        {profile.personalWebsite || profile.orcidId ? (
          <ul className="scholar-links">
            {profile.personalWebsite ? (
              <li>
                <a href={profile.personalWebsite} target="_blank" rel="noreferrer">
                  Personal website
                </a>
              </li>
            ) : null}
            {profile.orcidId ? (
              <li>
                <a href={`https://orcid.org/${profile.orcidId}`} target="_blank" rel="noreferrer">
                  ORCID
                </a>
              </li>
            ) : null}
          </ul>
        ) : (
          <p>No public links provided.</p>
        )}
      </section>

      <section className="scholar-section">
        <h2>Public profile scope</h2>
        <p>
          This visitor-facing page intentionally shows only the public subset of the shared
          Asiamath profile record.
        </p>
        <p>
          Internal COI, verification, and account metadata stay off this page.
        </p>
      </section>
    </article>
  );
}
