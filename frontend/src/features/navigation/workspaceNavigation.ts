import { buildChainedReturnState } from '../demo/demoWalkthrough';
import {
  resolveReturnContext,
  toReturnContextState,
  type ReturnContext,
  type ReturnContextState,
} from './returnContext';

export const REVIEWER_QUEUE_RETURN_CONTEXT: ReturnContext = {
  to: '/reviewer',
  label: 'Back to reviewer queue',
};

export const buildOrganizerQueueReturnContext = (conferenceId: string): ReturnContext => ({
  to: `/organizer/conferences/${conferenceId}/applications`,
  label: 'Back to conference queue',
});

export const resolveWorkspaceReturnContext = (
  state: unknown,
  currentPath: string,
  fallback: ReturnContext
): ReturnContext => resolveReturnContext(state, currentPath, fallback);

export const toWorkspaceEntryState = (
  returnContext: ReturnContext
): ReturnContextState | undefined => toReturnContextState(returnContext);

export const buildWorkspaceChildState = (
  returnContext: ReturnContext,
  parentContext: ReturnContext | null
): ReturnContextState => buildChainedReturnState(returnContext, parentContext);
