CREATE TABLE "Conference" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "shortName" TEXT,
  "locationText" TEXT,
  "startDate" TEXT,
  "endDate" TEXT,
  "description" TEXT,
  "applicationDeadline" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "applicationFormSchemaJson" TEXT NOT NULL DEFAULT '{"fields":[]}',
  "settingsJson" TEXT NOT NULL DEFAULT '{}',
  "publishedAt" DATETIME,
  "closedAt" DATETIME,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Conference_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ConferenceStaff" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "conferenceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "staffRole" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConferenceStaff_conferenceId_fkey"
    FOREIGN KEY ("conferenceId") REFERENCES "Conference" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConferenceStaff_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Application" (
  "id" TEXT NOT NULL PRIMARY KEY,
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
  "submittedAt" DATETIME,
  "decidedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Application_conferenceId_fkey"
    FOREIGN KEY ("conferenceId") REFERENCES "Conference" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Application_applicantUserId_fkey"
    FOREIGN KEY ("applicantUserId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ApplicationStatusHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "applicationId" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT NOT NULL,
  "changedByUserId" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationStatusHistory_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ApplicationStatusHistory_changedByUserId_fkey"
    FOREIGN KEY ("changedByUserId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Conference_slug_key" ON "Conference"("slug");
CREATE UNIQUE INDEX "ConferenceStaff_conferenceId_userId_key" ON "ConferenceStaff"("conferenceId", "userId");
CREATE UNIQUE INDEX "Application_conferenceId_applicantUserId_applicationType_key"
  ON "Application"("conferenceId", "applicantUserId", "applicationType");
CREATE INDEX "Conference_status_applicationDeadline_idx" ON "Conference"("status", "applicationDeadline");
CREATE INDEX "Application_conferenceId_status_idx" ON "Application"("conferenceId", "status");
CREATE INDEX "Application_applicantUserId_status_idx" ON "Application"("applicantUserId", "status");
CREATE INDEX "ApplicationStatusHistory_applicationId_createdAt_idx"
  ON "ApplicationStatusHistory"("applicationId", "createdAt");
