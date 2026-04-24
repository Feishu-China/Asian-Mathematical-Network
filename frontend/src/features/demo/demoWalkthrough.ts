import type { ReturnContext, ReturnContextState } from '../navigation/returnContext';
import { toReturnContextState } from '../navigation/returnContext';

export const DEMO_PRIMARY_APPLICATION_ID = 'review-application-1';
export const DEMO_PRIMARY_APPLICATION_PATH = `/me/applications/${DEMO_PRIMARY_APPLICATION_ID}`;
export const DEMO_PRIMARY_CONFERENCE_LIST_PATH = '/conferences';

export const PORTAL_RETURN_CONTEXT: ReturnContext = {
  to: '/portal',
  label: 'Back to portal',
};

export const DASHBOARD_RETURN_CONTEXT: ReturnContext = {
  to: '/dashboard',
  label: 'Back to dashboard',
};

export const MY_APPLICATIONS_RETURN_CONTEXT: ReturnContext = {
  to: '/me/applications',
  label: 'Back to my applications',
};

export const buildChainedReturnState = (
  returnContext: ReturnContext,
  parentContext: ReturnContext | null
): ReturnContextState => ({
  returnContext: {
    ...returnContext,
    state: toReturnContextState(parentContext),
  },
});

export const demoWalkthroughCopy = {
  portal: {
    title: 'Presenter-safe demo flow',
    intro:
      'Use this stable sequence to move from public discovery into the applicant story without improvising missing clicks.',
  },
  dashboard: {
    title: 'Presenter-safe walkthrough',
    intro:
      'This workspace is the safest authenticated handoff. Continue into active records or restart from the public portal.',
  },
  applications: {
    title: 'Presenter-safe walkthrough',
    intro:
      'Use this list as the main demo control point for active records, stable next steps, and public-route restarts.',
  },
  detail: {
    title: 'Presenter shortcuts',
    intro:
      'This applicant-safe detail is the best place to narrate current status, then jump back to the list or restart the story.',
  },
} as const;
