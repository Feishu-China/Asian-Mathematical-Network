import { useEffect, useState } from 'react';
import { GrantListCard } from '../features/grant/GrantListCard';
import { grantProvider } from '../features/grant/grantProvider';
import type { GrantListItem } from '../features/grant/types';
import './Conference.css';

export const routePath = '/grants';

export default function Grants() {
  const [items, setItems] = useState<GrantListItem[] | null>(null);

  useEffect(() => {
    grantProvider.listPublicGrants().then(setItems);
  }, []);

  if (items === null) {
    return <div className="conference-page">Loading grants...</div>;
  }

  return (
    <div className="conference-page">
      <header className="conference-hero">
        <p className="conference-eyebrow">Public opportunities</p>
        <h1>Travel grants</h1>
        <p>Browse the published grant opportunities currently open on the network.</p>
      </header>

      {items.length === 0 ? (
        <div className="conference-empty">No published grants yet.</div>
      ) : (
        <div className="conference-grid">
          {items.map((grant) => (
            <GrantListCard key={grant.id} grant={grant} />
          ))}
        </div>
      )}
    </div>
  );
}
