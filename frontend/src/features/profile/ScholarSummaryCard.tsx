import { Link } from 'react-router-dom';
import type { ReturnContextState } from '../navigation/returnContext';
import { buildScholarRoute, formatCountryCode } from './profilePresentation';
import type { PublicScholarSummary } from './types';

type Props = {
  scholar: PublicScholarSummary;
  detailState?: ReturnContextState;
};

export function ScholarSummaryCard({ scholar, detailState }: Props) {
  const metaLine = [scholar.title, scholar.institutionNameRaw, formatCountryCode(scholar.countryCode)]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="surface-card scholar-summary-card public-browse-card">
      <p className="scholar-summary-card__eyebrow">Public scholar profile</p>
      <Link
        className="scholar-summary-card__title"
        to={buildScholarRoute(scholar.slug)}
        state={detailState}
      >
        {scholar.fullName}
      </Link>
      <p className="scholar-summary-card__meta public-browse-copy">
        {metaLine || 'Scholar profile available'}
      </p>
      <p className="scholar-summary-card__summary public-browse-copy">
        {scholar.bio ?? 'Research profile available.'}
      </p>
      <ul className="scholar-summary-card__keywords">
        {scholar.researchKeywords.slice(0, 3).map((keyword) => (
          <li key={keyword}>{keyword}</li>
        ))}
        {scholar.primaryMscCode ? <li>{scholar.primaryMscCode}</li> : null}
      </ul>
    </article>
  );
}
