import { describe, expect, it } from 'vitest';
import {
  fromTransportMyApplication,
  fromTransportMyApplicationDetail,
} from './dashboardMappers';

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

describe('fromTransportMyApplicationDetail', () => {
  it('maps a grant application detail transport payload with all sections populated', () => {
    const result = fromTransportMyApplicationDetail({
      id: 'app-1',
      application_type: 'grant_application',
      source_module: 'M7',
      conference_id: null,
      conference_title: null,
      grant_id: 'grant-1',
      grant_title: 'Asiamath 2026 Travel Grant',
      linked_conference_id: 'conf-1',
      linked_conference_title: 'Asiamath 2026',
      linked_conference_application_id: 'conf-app-1',
      viewer_status: 'under_review',
      statement: 'I plan to attend and present.',
      travel_plan_summary: 'Flights from Tokyo to Seoul.',
      funding_need_summary: 'Airfare support.',
      extra_answers: { lodging: 'shared' },
      applicant_profile_snapshot: {
        full_name: 'Jane Applicant',
        institution_name_raw: 'Kyoto University',
        country_code: 'JP',
        career_stage: 'postdoc',
        research_keywords: ['algebra', 'topology'],
      },
      files: [],
      submitted_at: '2026-05-05T09:00:00.000Z',
      released_decision: null,
      post_visit_report_status: null,
    });

    expect(result.applicationType).toBe('grant_application');
    expect(result.grantTitle).toBe('Asiamath 2026 Travel Grant');
    expect(result.linkedConferenceTitle).toBe('Asiamath 2026');
    expect(result.linkedConferenceApplicationId).toBe('conf-app-1');
    expect(result.statement).toBe('I plan to attend and present.');
    expect(result.travelPlanSummary).toBe('Flights from Tokyo to Seoul.');
    expect(result.fundingNeedSummary).toBe('Airfare support.');
    expect(result.extraAnswers).toEqual({ lodging: 'shared' });
    expect(result.applicantProfileSnapshot.full_name).toBe('Jane Applicant');
    expect(result.applicantProfileSnapshot.research_keywords).toEqual(['algebra', 'topology']);
    expect(result.submittedAt).toBe('2026-05-05T09:00:00.000Z');
    expect(result.releasedDecision).toBeNull();
  });

  it('maps a released detail payload with note_external captured on the decision', () => {
    const result = fromTransportMyApplicationDetail({
      id: 'app-2',
      application_type: 'conference_application',
      source_module: 'M2',
      conference_id: 'conf-2',
      conference_title: 'Asiamath 2025',
      grant_id: null,
      grant_title: null,
      linked_conference_id: null,
      linked_conference_title: null,
      linked_conference_application_id: null,
      viewer_status: 'result_released',
      statement: 'Previous submission.',
      travel_plan_summary: null,
      funding_need_summary: null,
      extra_answers: {},
      applicant_profile_snapshot: {},
      files: [],
      submitted_at: '2026-04-15T09:00:00.000Z',
      released_decision: {
        decision_kind: 'conference_admission',
        final_status: 'accepted',
        display_label: 'Accepted',
        note_external: 'Welcome to the conference.',
        released_at: '2026-04-29T12:00:00.000Z',
      },
      post_visit_report_status: null,
    });

    expect(result.viewerStatus).toBe('result_released');
    expect(result.releasedDecision).toEqual({
      decisionKind: 'conference_admission',
      finalStatus: 'accepted',
      displayLabel: 'Accepted',
      releasedAt: '2026-04-29T12:00:00.000Z',
      noteExternal: 'Welcome to the conference.',
    });
    expect(result.applicantProfileSnapshot).toEqual({});
  });
});
