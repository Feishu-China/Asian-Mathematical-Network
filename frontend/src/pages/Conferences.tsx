import { useEffect, useState } from 'react';
import { ConferenceListCard } from '../features/conference/ConferenceListCard';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import type { ConferenceListItem } from '../features/conference/types';
import './Conference.css';

export const routePath = '/conferences';

export default function Conferences() {
  const [items, setItems] = useState<ConferenceListItem[] | null>(null);

  useEffect(() => {
    conferenceProvider.listPublicConferences().then(setItems);
  }, []);

  if (items === null) {
    return <div className="conference-page">Loading conferences...</div>;
  }

  return (
    <div className="conference-page">
      <header className="conference-hero">
        <p className="conference-eyebrow">Public opportunities</p>
        <h1>Conferences</h1>
        <p>Browse the published conference opportunities currently open on the network.</p>
      </header>

      {items.length === 0 ? (
        <div className="conference-empty">No published conferences yet.</div>
      ) : (
        <div className="conference-grid">
          {items.map((conference) => (
            <ConferenceListCard key={conference.id} conference={conference} />
          ))}
        </div>
      )}
    </div>
  );
}
