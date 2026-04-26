import type { ScholarExpertiseCluster } from './types';

type Props = {
  clusters: ScholarExpertiseCluster[];
};

export function ScholarExpertiseClusterList({ clusters }: Props) {
  return (
    <ul className="scholar-cluster-list">
      {clusters.map((cluster) => (
        <li key={cluster.id} className="surface-card scholar-cluster-card">
          <h3>{cluster.label}</h3>
          <p>{cluster.summary}</p>
          <p className="scholar-cluster-card__meta">
            {cluster.scholarCount} scholars · {cluster.institutionCount} institutions
          </p>
        </li>
      ))}
    </ul>
  );
}
