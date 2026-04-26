-- CreateTable
CREATE TABLE "PostVisitReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "reportNarrative" TEXT NOT NULL,
    "attendanceConfirmed" BOOLEAN NOT NULL DEFAULT true,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PostVisitReport_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PostVisitReport_applicationId_key" ON "PostVisitReport"("applicationId");
