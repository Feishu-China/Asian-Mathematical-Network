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
    <Link
      className="surface-card scholar-summary-card public-browse-card scholar-summary-card__card-link"
      to={buildScholarRoute(scholar.slug)}
      state={detailState}
      aria-label={scholar.fullName}
    >
      <span className="scholar-summary-card__eyebrow">Public scholar profile</span>
      <span className="scholar-summary-card__title">{scholar.fullName}</span>
      <span className="scholar-summary-card__meta public-browse-copy">
        {metaLine || 'Scholar profile available'}
      </span>
      <span className="scholar-summary-card__summary public-browse-copy">
        {scholar.bio ?? 'Research profile available.'}
      </span>
      <ul className="scholar-summary-card__keywords">
        {scholar.researchKeywords.slice(0, 3).map((keyword) => (
          <li key={keyword}>{keyword}</li>
        ))}
        {scholar.primaryMscCode ? <li>{scholar.primaryMscCode}</li> : null}
      </ul>
    </Link>
  );
}
