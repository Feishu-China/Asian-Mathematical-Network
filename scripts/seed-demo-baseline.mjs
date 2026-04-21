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
  ensureDemoBaseline,
} = require('../backend/src/lib/demoBaseline.ts');

const prisma = new PrismaClient();

const main = async () => {
  const fixture = await ensureDemoBaseline(prisma);

  console.log('Demo baseline ready');
  console.log(
    JSON.stringify(
      {
        conference: {
          id: fixture.conference.id,
          slug: fixture.conference.slug,
          status: fixture.conference.status,
        },
        grant: {
          id: fixture.grant.id,
          slug: fixture.grant.slug,
          status: fixture.grant.status,
        },
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
