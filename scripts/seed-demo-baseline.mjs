import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(scriptDir, '../backend');

process.env.TS_NODE_PROJECT = path.join(backendDir, 'tsconfig.json');
process.chdir(backendDir);
process.env.DATABASE_URL ??= 'file:./dev.db';

require('../backend/node_modules/ts-node/register/transpile-only');

const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const {
  DEMO_BASELINE_FIXTURE,
  ensureDemoBaseline,
} = require('../backend/src/lib/demoBaseline.ts');

const prisma = new PrismaClient();

const main = async () => {
  const fixture = await ensureDemoBaseline(prisma);
  const demoAccounts = fixture.demoAccounts.map((account) => ({
    key: account.key,
    label: account.label,
    email: account.email,
    password: account.password,
    me_profile_path: '/me/profile',
    scholar_slug: account.profile.slug,
    scholar_path: account.profile.isProfilePublic ? `/scholars/${account.profile.slug}` : null,
    visibility: account.profile.isProfilePublic ? 'public' : 'private',
    title: account.profile.title,
    affiliation: account.profile.institutionNameRaw,
    country_code: account.profile.countryCode,
    career_stage: account.profile.careerStage,
    demo_use: account.demoUse,
  }));

  console.log('Demo baseline ready');
  console.log(
    JSON.stringify(
      {
        conference: {
          id: fixture.conference.id,
          slug: fixture.conference.slug,
          status: fixture.conference.status,
        },
        accounts: {
          organizer: {
            email: DEMO_BASELINE_FIXTURE.creatorEmail,
            password: DEMO_BASELINE_FIXTURE.creatorPassword,
          },
          reviewer: {
            email: DEMO_BASELINE_FIXTURE.reviewerEmail,
            password: DEMO_BASELINE_FIXTURE.reviewerPassword,
          },
        },
        grant: {
          id: fixture.grant.id,
          slug: fixture.grant.slug,
          status: fixture.grant.status,
        },
        demo_accounts: demoAccounts,
        walkthrough: [
          '1. Log in as the applicant demo account and open /me/profile to explain the private editor surface.',
          '2. Use the public scholar handoff from /me/profile to show that the same profile record can be viewed at /scholars/:slug.',
          '3. Open the reviewer demo scholar page to narrate public expert visibility and reviewer-source context.',
          '4. Log in as the organizer demo account to explain that the same profile contract also supports internal organizer context while keeping the public route hidden.',
          '5. Re-run npm run seed:demo to reset the same demo accounts, slugs, and profile content baseline.',
        ],
      },
      null,
      2
    )
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
