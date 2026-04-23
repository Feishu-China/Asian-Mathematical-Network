import { describe, expect, it } from 'vitest';
import { fromTransportMyApplication } from './dashboardMappers';

describe('fromTransportMyApplication', () => {
  it('maps a submitted conference application to the applicant-safe domain shape', () => {
    const result = fromTransportMyApplication({
      id: 'app-1',
      application_type: 'conference_application',
      source_module: 'M2',
      source_id: 'conf-1',
      source_title: 'Asiamath 2026',
      linked_conference_title: null,
      viewer_status: 'under_review',
      submitted_at: '2026-04-30T09:00:00.000Z',
      released_decision: null,
      next_action: 'view_submission',
      post_visit_report_status: null,
    });

    expect(result).toEqual({
      id: 'app-1',
      applicationType: 'conference_application',
      sourceModule: 'M2',
      sourceId: 'conf-1',
      sourceTitle: 'Asiamath 2026',
      linkedConferenceTitle: null,
      viewerStatus: 'under_review',
      submittedAt: '2026-04-30T09:00:00.000Z',
      releasedDecision: null,
      nextAction: 'view_submission',
      postVisitReportStatus: null,
    });
  });

  it('maps a released conference decision with display label and final status', () => {
    const result = fromTransportMyApplication({
      id: 'app-2',
      application_type: 'conference_application',
      source_module: 'M2',
      source_id: 'conf-1',
      source_title: 'Asiamath 2026',
      linked_conference_title: null,
      viewer_status: 'result_released',
      submitted_at: '2026-04-15T09:00:00.000Z',
      released_decision: {
        decision_kind: 'conference_admission',
        final_status: 'accepted',
        display_label: 'Accepted',
        released_at: '2026-04-29T12:00:00.000Z',
      },
      next_action: 'view_result',
      post_visit_report_status: null,
    });

    expect(result.viewerStatus).toBe('result_released');
    expect(result.releasedDecision).toEqual({
      decisionKind: 'conference_admission',
      finalStatus: 'accepted',
      displayLabel: 'Accepted',
      releasedAt: '2026-04-29T12:00:00.000Z',
    });
    expect(result.nextAction).toBe('view_result');
  });

  it('maps a draft grant application with linked conference title', () => {
    const result = fromTransportMyApplication({
      id: 'app-3',
      application_type: 'grant_application',
      source_module: 'M7',
      source_id: 'grant-1',
      source_title: 'Asiamath 2026 Travel Grant',
      linked_conference_title: 'Asiamath 2026',
      viewer_status: 'draft',
      submitted_at: null,
      released_decision: null,
      next_action: 'continue_draft',
      post_visit_report_status: null,
    });

    expect(result.applicationType).toBe('grant_application');
    expect(result.sourceTitle).toBe('Asiamath 2026 Travel Grant');
    expect(result.linkedConferenceTitle).toBe('Asiamath 2026');
    expect(result.viewerStatus).toBe('draft');
    expect(result.submittedAt).toBeNull();
    expect(result.releasedDecision).toBeNull();
    expect(result.nextAction).toBe('continue_draft');
  });
});
