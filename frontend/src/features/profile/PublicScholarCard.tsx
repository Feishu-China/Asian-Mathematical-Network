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
        <h2>Research interests</h2>
        <p>{profile.researchKeywords.join(', ') || 'No keywords provided.'}</p>
      </section>

      <section className="scholar-section">
        <h2>MSC codes</h2>
        {profile.mscCodes.length > 0 ? (
          <ul className="scholar-chip-list">
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
      </section>

      <section className="scholar-section">
        <h2>Biography</h2>
        <p>{profile.bio || 'No biography provided.'}</p>
      </section>

      <section className="scholar-section">
        <h2>External links</h2>
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
    </article>
  );
}
