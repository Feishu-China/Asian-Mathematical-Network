-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT,
    "institutionId" TEXT,
    "institutionNameRaw" TEXT,
    "countryCode" TEXT,
    "careerStage" TEXT,
    "bio" TEXT,
    "personalWebsite" TEXT,
    "researchKeywordsJson" TEXT NOT NULL DEFAULT '[]',
    "orcidId" TEXT,
    "coiDeclarationText" TEXT NOT NULL DEFAULT '',
    "isProfilePublic" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "MscCode" (
    "code" TEXT NOT NULL,

    CONSTRAINT "MscCode_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ProfileMscCode" (
    "userId" TEXT NOT NULL,
    "mscCode" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileMscCode_pkey" PRIMARY KEY ("userId","mscCode")
);

-- CreateTable
CREATE TABLE "Conference" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortName" TEXT,
    "locationText" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "description" TEXT,
    "applicationDeadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "applicationFormSchemaJson" TEXT NOT NULL DEFAULT '{"fields":[]}',
    "settingsJson" TEXT NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantOpportunity" (
    "id" TEXT NOT NULL,
    "linkedConferenceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "grantType" TEXT NOT NULL,
    "description" TEXT,
    "eligibilitySummary" TEXT,
    "coverageSummary" TEXT,
    "applicationDeadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reportRequired" BOOLEAN NOT NULL DEFAULT false,
    "applicationFormSchemaJson" TEXT NOT NULL DEFAULT '{"fields":[]}',
    "settingsJson" TEXT NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrantOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConferenceStaff" (
    "id" TEXT NOT NULL,
    "conferenceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "staffRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConferenceStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "applicationType" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "conferenceId" TEXT,
    "grantId" TEXT,
    "linkedConferenceId" TEXT,
    "linkedConferenceApplicationId" TEXT,
    "applicantUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "participationType" TEXT,
    "statement" TEXT,
    "abstractTitle" TEXT,
    "abstractText" TEXT,
    "interestedInTravelSupport" BOOLEAN NOT NULL DEFAULT false,
    "travelPlanSummary" TEXT,
    "fundingNeedSummary" TEXT,
    "extraAnswersJson" TEXT NOT NULL DEFAULT '{}',
    "applicantProfileSnapshotJson" TEXT,
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewAssignment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "conflictState" TEXT NOT NULL DEFAULT 'clear',
    "conflictNote" TEXT,
    "dueAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "score" INTEGER,
    "recommendation" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "decisionKind" TEXT NOT NULL,
    "finalStatus" TEXT NOT NULL,
    "releaseStatus" TEXT NOT NULL DEFAULT 'unreleased',
    "noteInternal" TEXT,
    "noteExternal" TEXT,
    "decidedByUserId" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostVisitReport" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "reportNarrative" TEXT NOT NULL,
    "attendanceConfirmed" BOOLEAN NOT NULL DEFAULT true,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostVisitReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_slug_key" ON "Profile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Conference_slug_key" ON "Conference"("slug");

-- CreateIndex
CREATE INDEX "Conference_status_applicationDeadline_idx" ON "Conference"("status", "applicationDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "GrantOpportunity_slug_key" ON "GrantOpportunity"("slug");

-- CreateIndex
CREATE INDEX "GrantOpportunity_status_applicationDeadline_idx" ON "GrantOpportunity"("status", "applicationDeadline");

-- CreateIndex
CREATE INDEX "GrantOpportunity_linkedConferenceId_status_idx" ON "GrantOpportunity"("linkedConferenceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConferenceStaff_conferenceId_userId_key" ON "ConferenceStaff"("conferenceId", "userId");

-- CreateIndex
CREATE INDEX "Application_conferenceId_status_idx" ON "Application"("conferenceId", "status");

-- CreateIndex
CREATE INDEX "Application_grantId_status_idx" ON "Application"("grantId", "status");

-- CreateIndex
CREATE INDEX "Application_linkedConferenceApplicationId_idx" ON "Application"("linkedConferenceApplicationId");

-- CreateIndex
CREATE INDEX "Application_applicantUserId_status_idx" ON "Application"("applicantUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Application_conferenceId_applicantUserId_applicationType_key" ON "Application"("conferenceId", "applicantUserId", "applicationType");

-- CreateIndex
CREATE UNIQUE INDEX "Application_grantId_applicantUserId_applicationType_key" ON "Application"("grantId", "applicantUserId", "applicationType");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_createdAt_idx" ON "ApplicationStatusHistory"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "UserRole_role_idx" ON "UserRole"("role");

-- CreateIndex
CREATE INDEX "UserRole_userId_isPrimary_idx" ON "UserRole"("userId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE INDEX "ReviewAssignment_reviewerUserId_status_dueAt_idx" ON "ReviewAssignment"("reviewerUserId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "ReviewAssignment_applicationId_status_idx" ON "ReviewAssignment"("applicationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Review_assignmentId_key" ON "Review"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Decision_applicationId_key" ON "Decision"("applicationId");

-- CreateIndex
CREATE INDEX "Decision_releaseStatus_decidedAt_idx" ON "Decision"("releaseStatus", "decidedAt");

-- CreateIndex
CREATE INDEX "Decision_finalStatus_decidedAt_idx" ON "Decision"("finalStatus", "decidedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostVisitReport_applicationId_key" ON "PostVisitReport"("applicationId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileMscCode" ADD CONSTRAINT "ProfileMscCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileMscCode" ADD CONSTRAINT "ProfileMscCode_mscCode_fkey" FOREIGN KEY ("mscCode") REFERENCES "MscCode"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conference" ADD CONSTRAINT "Conference_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantOpportunity" ADD CONSTRAINT "GrantOpportunity_linkedConferenceId_fkey" FOREIGN KEY ("linkedConferenceId") REFERENCES "Conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantOpportunity" ADD CONSTRAINT "GrantOpportunity_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConferenceStaff" ADD CONSTRAINT "ConferenceStaff_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConferenceStaff" ADD CONSTRAINT "ConferenceStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "GrantOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ReviewAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVisitReport" ADD CONSTRAINT "PostVisitReport_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
