import type { GrantOpportunityStatus, GrantType } from '../../../../src/types/models';

export type LinkedOpportunityType = 'conference' | 'school';

export type SupportedGrantFieldKey =
  | 'linked_opportunity_application_id'
  | 'linked_conference_application_id'
  | 'statement'
  | 'travel_plan_summary'
  | 'funding_need_summary';

export type GrantSchemaField = {
  key: SupportedGrantFieldKey;
  type: 'select' | 'textarea' | 'text' | 'checkbox';
  required: boolean;
  options?: string[];
};

export type GrantFormSchema = {
  fields: GrantSchemaField[];
};

export type GrantListItem = {
  id: string;
  slug: string;
  title: string;
  grantType: GrantType;
  linkedOpportunityType: LinkedOpportunityType;
  linkedOpportunityId: string;
  linkedOpportunityTitle: string | null;
  applicationDeadline: string | null;
  status: GrantOpportunityStatus;
  reportRequired: boolean;
  isApplicationOpen: boolean;
};

export type GrantDetail = GrantListItem & {
  description: string | null;
  eligibilitySummary: string | null;
  coverageSummary: string | null;
  publishedAt: string | null;
};

export type GrantApplication = {
  id: string;
  applicationType: 'grant_application';
  sourceModule: string;
  grantId: string;
  grantTitle: string;
  linkedOpportunityType: LinkedOpportunityType;
  linkedOpportunityId: string;
  linkedOpportunityTitle: string | null;
  linkedOpportunityApplicationId: string;
  applicantUserId: string;
  status: 'draft' | 'submitted';
  statement: string | null;
  travelPlanSummary: string | null;
  fundingNeedSummary: string | null;
  extraAnswers: Record<string, string>;
  files: Array<{ id: string; name: string }>;
  submittedAt: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GrantApplicationValues = {
  linkedOpportunityApplicationId: string;
  statement: string;
  travelPlanSummary: string;
  fundingNeedSummary: string;
  extraAnswers: Record<string, string>;
};

export type GrantProvider = {
  listPublicGrants(): Promise<GrantListItem[]>;
  getGrantBySlug(slug: string): Promise<GrantDetail | null>;
  getGrantApplicationForm(grantId: string): Promise<GrantFormSchema>;
  getMyGrantApplication(grantId: string): Promise<GrantApplication | null>;
  createGrantApplication(grantId: string, values: GrantApplicationValues): Promise<GrantApplication>;
  updateGrantApplication(
    applicationId: string,
    values: GrantApplicationValues
  ): Promise<GrantApplication>;
  submitGrantApplication(applicationId: string): Promise<GrantApplication>;
};
