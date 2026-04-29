import type { ScholarExpertiseCluster } from './types';

type Props = {
  clusters: ScholarExpertiseCluster[];
};

export function ScholarExpertiseClusterList({ clusters }: Props) {
  return (
    <ul className="scholar-cluster-list public-browse-grid public-browse-grid--compact">
      {clusters.map((cluster) => (
        <li key={cluster.id} className="surface-card scholar-cluster-card public-browse-card">
          <h3>{cluster.label}</h3>
          <p className="public-browse-copy">{cluster.summary}</p>
          <p className="scholar-cluster-card__meta public-browse-copy">
            {cluster.scholarCount} scholars · {cluster.institutionCount} institutions
          </p>
        </li>
      ))}
    </ul>
  );
}
