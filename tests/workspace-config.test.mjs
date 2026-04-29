import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

test('root package declares an npm workspace monorepo', () => {
  const packageJson = readJson('package.json');

  assert.equal(packageJson.private, true);
  assert.equal(packageJson.packageManager, 'npm@11.12.1');
  assert.deepEqual(packageJson.workspaces, ['backend', 'frontend', 'packages/*']);
  assert.equal(packageJson.scripts?.postinstall, 'npm run build:shared');
});

test('frontend and backend declare the shared workspace package explicitly', () => {
  const backendPackage = readJson('backend/package.json');
  const frontendPackage = readJson('frontend/package.json');

  assert.equal(backendPackage.dependencies?.['@asiamath/shared'], '1.0.0');
  assert.equal(frontendPackage.dependencies?.['@asiamath/shared'], '1.0.0');
  assert.match(
    backendPackage.scripts?.dev ?? '',
    /^npm --prefix \.\. run build --workspace @asiamath\/shared &&/,
  );
  assert.match(
    backendPackage.scripts?.test ?? '',
    /^npm --prefix \.\. run build --workspace @asiamath\/shared &&/,
  );
  assert.match(
    frontendPackage.scripts?.dev ?? '',
    /^npm --prefix \.\. run build --workspace @asiamath\/shared &&/,
  );
});

test('shared workspace package exposes the core models contract', () => {
  const sharedPackage = readJson('packages/shared/package.json');

  assert.equal(sharedPackage.name, '@asiamath/shared');
  assert.equal(sharedPackage.version, '1.0.0');
  assert.equal(sharedPackage.scripts?.build, 'tsc -p tsconfig.json');
  assert.equal(sharedPackage.exports?.['./models']?.types, './dist/models.d.ts');
  assert.equal(sharedPackage.exports?.['./models']?.default, './dist/models.js');
  assert.equal(sharedPackage.types, './dist/models.d.ts');
});

test('runtime helper scripts bootstrap the shared workspace before execution', () => {
  const packageJson = readJson('package.json');

  assert.match(packageJson.scripts?.['seed:demo'] ?? '', /^npm run build:shared &&/);
  assert.match(packageJson.scripts?.['seed:review'] ?? '', /^npm run build:shared &&/);
  assert.match(packageJson.scripts?.['test:portal:int'] ?? '', /^npm run build:shared &&/);
  assert.match(packageJson.scripts?.['test:grant:int'] ?? '', /^npm run build:shared &&/);
});

test('local Postgres defaults stay on port 5432 for both dev and test databases', () => {
  const envExample = readText('backend/.env.example');

  assert.match(
    envExample,
    /DATABASE_URL="postgresql:\/\/postgres:postgres@127\.0\.0\.1:5432\/asiamath_dev\?schema=public"/,
  );
  assert.match(
    envExample,
    /TEST_DATABASE_URL="postgresql:\/\/postgres:postgres@127\.0\.0\.1:5432\/asiamath_test\?schema=public"/,
  );
});

test('repo documents the Postgres dev/test contract and the 5433 override path', () => {
  const contractDoc = readText(
    'docs/planning/asiamath-postgres-dev-test-contract-2026-04-29.md',
  );

  assert.match(contractDoc, /DR-003/);
  assert.match(contractDoc, /PMB-003/);
  assert.match(contractDoc, /DATABASE_URL/);
  assert.match(contractDoc, /TEST_DATABASE_URL/);
  assert.match(contractDoc, /backend\/\.env/);
  assert.match(contractDoc, /export/i);
  assert.match(contractDoc, /5432/);
  assert.match(contractDoc, /5433/);
  assert.match(contractDoc, /override/i);
});
