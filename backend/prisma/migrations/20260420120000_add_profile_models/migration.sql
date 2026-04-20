CREATE TABLE "Profile" (
  "userId" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
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
  "verifiedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "MscCode" (
  "code" TEXT NOT NULL PRIMARY KEY
);

CREATE TABLE "ProfileMscCode" (
  "userId" TEXT NOT NULL,
  "mscCode" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "mscCode"),
  FOREIGN KEY ("userId") REFERENCES "Profile" ("userId") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("mscCode") REFERENCES "MscCode" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);
