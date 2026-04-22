import { describe, expect, it } from 'vitest';
import { fromTransportMyApplication } from './dashboardMappers';

describe('fromTransportMyApplication', () => {
  it('maps a conference application transport payload to camelCase domain', () => {
    const result = fromTransportMyApplication({
      id: 'app-1',
      application_type: 'conference_application',
      source_module: 'M2',
      status: 'submitted',
      conference_id: 'conf-1',
      conference_slug: 'asiamath-2026',
      conference_title: 'Asiamath 2026',
      grant_id: null,
      grant_slug: null,
      grant_title: null,
      linked_conference_id: null,
      linked_conference_application_id: null,
      submitted_at: '2026-04-30T09:00:00.000Z',
      decision: null,
      created_at: '2026-04-30T08:00:00.000Z',
      updated_at: '2026-04-30T09:00:00.000Z',
    });

    expect(result).toEqual({
      id: 'app-1',
      applicationType: 'conference_application',
      sourceModule: 'M2',
      status: 'submitted',
      conferenceId: 'conf-1',
      conferenceSlug: 'asiamath-2026',
      conferenceTitle: 'Asiamath 2026',
      grantId: null,
      grantSlug: null,
      grantTitle: null,
      linkedConferenceId: null,
      linkedConferenceApplicationId: null,
      submittedAt: '2026-04-30T09:00:00.000Z',
      decision: null,
      createdAt: '2026-04-30T08:00:00.000Z',
      updatedAt: '2026-04-30T09:00:00.000Z',
    });
  });

  it('maps a grant application transport payload with linked conference reference', () => {
    const result = fromTransportMyApplication({
      id: 'app-2',
      application_type: 'grant_application',
      source_module: 'M7',
      status: 'draft',
      conference_id: null,
      conference_slug: null,
      conference_title: null,
      grant_id: 'grant-1',
      grant_slug: 'asiamath-2026-travel-grant',
      grant_title: 'Asiamath 2026 Travel Grant',
      linked_conference_id: 'conf-1',
      linked_conference_application_id: 'app-1',
      submitted_at: null,
      decision: null,
      created_at: '2026-05-01T08:00:00.000Z',
      updated_at: '2026-05-01T08:00:00.000Z',
    });

    expect(result.applicationType).toBe('grant_application');
    expect(result.grantSlug).toBe('asiamath-2026-travel-grant');
    expect(result.linkedConferenceApplicationId).toBe('app-1');
    expect(result.submittedAt).toBeNull();
    expect(result.decision).toBeNull();
  });
});
