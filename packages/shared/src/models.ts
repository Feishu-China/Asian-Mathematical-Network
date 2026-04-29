/**
 * Asiamath Core Data Models (TypeScript Interfaces)
 * Generated based on DDL V1.1 / MVP PRD V3.2
 *
 * This file serves as the strict contract for both Frontend and Backend Mocking.
 */

// --- Enums ---

export type UserStatus = 'active' | 'inactive' | 'suspended';
export type UserRole = 'applicant' | 'reviewer' | 'organizer' | 'admin';
export type WorkspaceKey = UserRole;
export type InstitutionStatus = 'active' | 'inactive' | 'pending';
export type ProfileVerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'rejected';
export type CareerStage = 'undergraduate' | 'masters' | 'phd' | 'postdoc' | 'faculty' | 'other';
export type ConferenceStatus = 'draft' | 'published' | 'closed';
export type GrantOpportunityStatus = 'draft' | 'published' | 'closed';
export type GrantType = 'conference_travel_grant';
export type ApplicationType = 'conference_application' | 'grant_application';
export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'decided';
export type DecisionFinalStatus = 'accepted' | 'rejected' | 'waitlisted';
export type DecisionReleaseStatus = 'unreleased' | 'released';

// --- Base Types ---

export interface User {
  id: string; // UUID
  email: string;
  status: UserStatus;
  emailVerifiedAt: string | null; // ISO Date string
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Institution {
  id: string; // UUID
  slug: string;
  name: string;
  countryCode: string | null;
  website: string | null;
  contactEmail: string | null;
  isMember: boolean;
  status: InstitutionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileMscCode {
  code: string;
  isPrimary: boolean;
}

export interface Profile {
  userId: string; // UUID references User
  slug: string;
  fullName: string;
  title: string | null;
  institutionId: string | null;
  institutionNameRaw: string | null;
  countryCode: string | null;
  careerStage: CareerStage | null;
  bio: string | null;
  personalWebsite: string | null;
  researchKeywords: string[];
  mscCodes: ProfileMscCode[];
  orcidId: string | null;
  coiDeclarationText: string;
  isProfilePublic: boolean;
  verificationStatus: ProfileVerificationStatus;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conference {
  id: string; // UUID
  slug: string;
  title: string;
  shortName: string | null;
  locationText: string | null;
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;
  description: string | null;
  applicationDeadline: string | null; // ISO Date string
  status: ConferenceStatus;
  applicationFormSchemaJson: Record<string, any>;
  settingsJson: Record<string, any>;
  publishedAt: string | null;
  closedAt: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrantOpportunity {
  id: string; // UUID
  linkedConferenceId: string; // References Conference
  slug: string;
  title: string;
  grantType: GrantType;
  description: string | null;
  eligibilitySummary: string | null;
  coverageSummary: string | null;
  applicationDeadline: string | null;
  status: GrantOpportunityStatus;
  reportRequired: boolean;
  applicationFormSchemaJson: Record<string, any>;
  settingsJson: Record<string, any>;
  publishedAt: string | null;
  closedAt: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string; // UUID
  type: ApplicationType;
  applicantUserId: string;
  targetId: string; // UUID (Conference ID or Grant Opportunity ID)
  status: ApplicationStatus;
  formDataJson: Record<string, any>;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Decision {
  id: string;
  applicationId: string;
  finalStatus: DecisionFinalStatus;
  releaseStatus: DecisionReleaseStatus;
  internalNotes: string | null;
  externalNotes: string | null;
  issuedByUserId: string;
  issuedAt: string;
  releasedAt: string | null;
}
