PRAGMA foreign_keys=OFF;

CREATE TABLE "GrantOpportunity" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "linkedConferenceId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "grantType" TEXT NOT NULL,
  "description" TEXT,
  "eligibilitySummary" TEXT,
  "coverageSummary" TEXT,
  "applicationDeadline" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "reportRequired" BOOLEAN NOT NULL DEFAULT false,
  "applicationFormSchemaJson" TEXT NOT NULL DEFAULT '{"fields":[]}',
  "settingsJson" TEXT NOT NULL DEFAULT '{}',
  "publishedAt" DATETIME,
  "closedAt" DATETIME,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "GrantOpportunity_linkedConferenceId_fkey"
    FOREIGN KEY ("linkedConferenceId") REFERENCES "Conference" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GrantOpportunity_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "new_Application" (
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
  CONSTRAINT "Application_grantId_fkey"
    FOREIGN KEY ("grantId") REFERENCES "GrantOpportunity" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Application_applicantUserId_fkey"
    FOREIGN KEY ("applicantUserId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Application" (
  "id",
  "applicationType",
  "sourceModule",
  "conferenceId",
  "grantId",
  "linkedConferenceId",
  "linkedConferenceApplicationId",
  "applicantUserId",
  "status",
  "participationType",
  "statement",
  "abstractTitle",
  "abstractText",
  "interestedInTravelSupport",
  "travelPlanSummary",
  "fundingNeedSummary",
  "extraAnswersJson",
  "applicantProfileSnapshotJson",
  "submittedAt",
  "decidedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  "applicationType",
  "sourceModule",
  "conferenceId",
  "grantId",
  "linkedConferenceId",
  "linkedConferenceApplicationId",
  "applicantUserId",
  "status",
  "participationType",
  "statement",
  "abstractTitle",
  "abstractText",
  "interestedInTravelSupport",
  "travelPlanSummary",
  "fundingNeedSummary",
  "extraAnswersJson",
  "applicantProfileSnapshotJson",
  "submittedAt",
  "decidedAt",
  "createdAt",
  "updatedAt"
FROM "Application";

DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";

CREATE UNIQUE INDEX "GrantOpportunity_slug_key" ON "GrantOpportunity"("slug");
CREATE INDEX "GrantOpportunity_status_applicationDeadline_idx"
  ON "GrantOpportunity"("status", "applicationDeadline");
CREATE INDEX "GrantOpportunity_linkedConferenceId_status_idx"
  ON "GrantOpportunity"("linkedConferenceId", "status");
CREATE UNIQUE INDEX "Application_conferenceId_applicantUserId_applicationType_key"
  ON "Application"("conferenceId", "applicantUserId", "applicationType");
CREATE UNIQUE INDEX "Application_grantId_applicantUserId_applicationType_key"
  ON "Application"("grantId", "applicantUserId", "applicationType");
CREATE INDEX "Application_conferenceId_status_idx" ON "Application"("conferenceId", "status");
CREATE INDEX "Application_grantId_status_idx" ON "Application"("grantId", "status");
CREATE INDEX "Application_linkedConferenceApplicationId_idx"
  ON "Application"("linkedConferenceApplicationId");
CREATE INDEX "Application_applicantUserId_status_idx" ON "Application"("applicantUserId", "status");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
