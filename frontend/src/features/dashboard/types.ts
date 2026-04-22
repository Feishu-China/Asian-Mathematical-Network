export type MyApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'decided'
  | 'withdrawn';

export type MyApplicationKind = 'conference_application' | 'grant_application';

export type MyApplication = {
  id: string;
  applicationType: MyApplicationKind;
  sourceModule: string;
  status: MyApplicationStatus;
  conferenceId: string | null;
  conferenceSlug: string | null;
  conferenceTitle: string | null;
  grantId: string | null;
  grantSlug: string | null;
  grantTitle: string | null;
  linkedConferenceId: string | null;
  linkedConferenceApplicationId: string | null;
  submittedAt: string | null;
  decision: null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardProvider = {
  listMyApplications(): Promise<MyApplication[]>;
};
