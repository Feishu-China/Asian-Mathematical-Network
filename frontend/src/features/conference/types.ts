import type { ConferenceStatus } from '../../../../src/types/models';

export type SupportedConferenceFieldKey =
  | 'participation_type'
  | 'statement'
  | 'abstract_title'
  | 'abstract_text'
  | 'interested_in_travel_support';

export type ConferenceSchemaField = {
  key: SupportedConferenceFieldKey;
  type: 'select' | 'textarea' | 'text' | 'checkbox';
  required: boolean;
  options?: string[];
};

export type ConferenceFormSchema = {
  fields: ConferenceSchemaField[];
};

export type ConferenceListItem = {
  id: string;
  slug: string;
  title: string;
  shortName: string | null;
  locationText: string | null;
  startDate: string | null;
  endDate: string | null;
  applicationDeadline: string | null;
  status: ConferenceStatus;
  isApplicationOpen: boolean;
  relatedGrantCount: number;
};

export type ConferenceDetail = ConferenceListItem & {
  description: string | null;
  publishedAt: string | null;
  relatedGrants: Array<{ id: string; title: string; slug: string }>;
};

export type OrganizerConference = ConferenceDetail & {
  applicationFormSchema: ConferenceFormSchema;
  settings: Record<string, unknown>;
  closedAt: string | null;
  staff: Array<{ userId: string; staffRole: string }>;
};

export type ConferenceEditorValues = {
  slug: string;
  title: string;
  shortName: string;
  locationText: string;
  startDate: string;
  endDate: string;
  description: string;
  applicationDeadline: string;
  includeAbstractFields: boolean;
  includeTravelSupportQuestion: boolean;
};

export type ConferenceApplication = {
  id: string;
  applicationType: 'conference_application';
  sourceModule: string;
  conferenceId: string;
  conferenceTitle: string;
  applicantUserId: string;
  status: 'draft' | 'submitted';
  participationType: string | null;
  statement: string | null;
  abstractTitle: string | null;
  abstractText: string | null;
  interestedInTravelSupport: boolean;
  extraAnswers: Record<string, string>;
  files: Array<{ id: string; name: string }>;
  submittedAt: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConferenceApplicationValues = {
  participationType: string;
  statement: string;
  abstractTitle: string;
  abstractText: string;
  interestedInTravelSupport: boolean;
  extraAnswers: Record<string, string>;
};

export type ConferenceProvider = {
  listPublicConferences(): Promise<ConferenceListItem[]>;
  getConferenceBySlug(slug: string): Promise<ConferenceDetail | null>;
  getConferenceApplicationForm(conferenceId: string): Promise<ConferenceFormSchema>;
  getMyConferenceApplication(conferenceId: string): Promise<ConferenceApplication | null>;
  createOrganizerConference(values: ConferenceEditorValues): Promise<OrganizerConference>;
  getOrganizerConference(id: string): Promise<OrganizerConference>;
  updateOrganizerConference(id: string, values: ConferenceEditorValues): Promise<OrganizerConference>;
  publishOrganizerConference(id: string): Promise<OrganizerConference>;
  closeOrganizerConference(id: string): Promise<OrganizerConference>;
  createConferenceApplication(
    conferenceId: string,
    values: ConferenceApplicationValues
  ): Promise<ConferenceApplication>;
  updateConferenceApplication(
    applicationId: string,
    values: ConferenceApplicationValues
  ): Promise<ConferenceApplication>;
  submitConferenceApplication(applicationId: string): Promise<ConferenceApplication>;
};
