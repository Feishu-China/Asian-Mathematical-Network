PRAGMA foreign_keys=OFF;

CREATE TABLE "UserRole" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserRole_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ReviewAssignment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "applicationId" TEXT NOT NULL,
  "reviewerUserId" TEXT NOT NULL,
  "assignedByUserId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'assigned',
  "conflictState" TEXT NOT NULL DEFAULT 'clear',
  "conflictNote" TEXT,
  "dueAt" DATETIME,
  "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "cancelledAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ReviewAssignment_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReviewAssignment_reviewerUserId_fkey"
    FOREIGN KEY ("reviewerUserId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReviewAssignment_assignedByUserId_fkey"
    FOREIGN KEY ("assignedByUserId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Review" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "assignmentId" TEXT NOT NULL UNIQUE,
  "score" INTEGER,
  "recommendation" TEXT NOT NULL,
  "comment" TEXT NOT NULL,
  "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Review_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "ReviewAssignment" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Decision" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "applicationId" TEXT NOT NULL UNIQUE,
  "decisionKind" TEXT NOT NULL,
  "finalStatus" TEXT NOT NULL,
  "releaseStatus" TEXT NOT NULL DEFAULT 'unreleased',
  "noteInternal" TEXT,
  "noteExternal" TEXT,
  "decidedByUserId" TEXT NOT NULL,
  "decidedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Decision_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Decision_decidedByUserId_fkey"
    FOREIGN KEY ("decidedByUserId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");
CREATE INDEX "UserRole_role_idx" ON "UserRole"("role");
CREATE INDEX "UserRole_userId_isPrimary_idx" ON "UserRole"("userId", "isPrimary");

CREATE INDEX "ReviewAssignment_reviewerUserId_status_dueAt_idx"
  ON "ReviewAssignment"("reviewerUserId", "status", "dueAt");
CREATE INDEX "ReviewAssignment_applicationId_status_idx"
  ON "ReviewAssignment"("applicationId", "status");

CREATE INDEX "Decision_releaseStatus_decidedAt_idx"
  ON "Decision"("releaseStatus", "decidedAt");
CREATE INDEX "Decision_finalStatus_decidedAt_idx"
  ON "Decision"("finalStatus", "decidedAt");

INSERT INTO "UserRole" ("id", "userId", "role", "isPrimary", "createdAt")
SELECT
  'user-role-applicant-' || "id",
  "id",
  'applicant',
  true,
  CURRENT_TIMESTAMP
FROM "User"
WHERE NOT EXISTS (
  SELECT 1
  FROM "UserRole"
  WHERE "UserRole"."userId" = "User"."id"
    AND "UserRole"."role" = 'applicant'
);

INSERT INTO "UserRole" ("id", "userId", "role", "isPrimary", "createdAt")
SELECT
  'user-role-organizer-' || source."userId",
  source."userId",
  'organizer',
  false,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "userId"
  FROM "ConferenceStaff"
  WHERE "staffRole" IN ('owner', 'organizer')
) AS source
WHERE NOT EXISTS (
  SELECT 1
  FROM "UserRole"
  WHERE "UserRole"."userId" = source."userId"
    AND "UserRole"."role" = 'organizer'
);

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
