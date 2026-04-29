import fs from 'fs';
import path from 'path';

const backendRoot = path.join(__dirname, '..');

const readBackendFile = (...segments: string[]) =>
  fs.readFileSync(path.join(backendRoot, ...segments), 'utf8');

describe('backend database configuration', () => {
  it('loads the Prisma datasource URL from DATABASE_URL', () => {
    const schema = readBackendFile('prisma', 'schema.prisma');

    expect(schema).toContain('url      = env("DATABASE_URL")');
  });

  it('uses PostgreSQL as the Prisma provider', () => {
    const schema = readBackendFile('prisma', 'schema.prisma');

    expect(schema).toContain('provider = "postgresql"');
  });

  it('loads backend runtime database settings through dotenv in the Prisma layer', () => {
    const prismaClientModule = readBackendFile('src', 'lib', 'prisma.ts');

    expect(prismaClientModule).toContain("import 'dotenv/config';");
    expect(prismaClientModule).toContain('new PrismaClient()');
  });

  it('documents the local and test PostgreSQL environment variables', () => {
    const envExample = readBackendFile('.env.example');

    expect(envExample).toContain(
      'DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/asiamath_dev?schema=public"',
    );
    expect(envExample).toContain(
      'TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/asiamath_test?schema=public"',
    );
    expect(envExample).toContain('JWT_SECRET=');
  });

  it('keeps the active migration chain free of SQLite-only syntax', () => {
    const migrationsRoot = path.join(backendRoot, 'prisma', 'migrations');
    const migrationDirectories = fs
      .readdirSync(migrationsRoot)
      .filter((entry) => fs.statSync(path.join(migrationsRoot, entry)).isDirectory());

    for (const directory of migrationDirectories) {
      const sql = fs.readFileSync(path.join(migrationsRoot, directory, 'migration.sql'), 'utf8');
      expect(sql).not.toContain('PRAGMA');
    }

    const lockFile = readBackendFile('prisma', 'migrations', 'migration_lock.toml');
    expect(lockFile).toContain('provider = "postgresql"');
  });

  it('uses environment-driven PostgreSQL scripts for backend start, dev, and test', () => {
    const packageJson = JSON.parse(readBackendFile('package.json')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.build).toContain('prisma generate');
    expect(packageJson.scripts?.build).toContain(
      'npm --prefix .. run build --workspace @asiamath/shared',
    );
    expect(packageJson.scripts?.build).toContain('tsc -p tsconfig.build.json');
    expect(packageJson.scripts?.start).toContain('prisma migrate deploy');
    expect(packageJson.scripts?.start).toContain('node dist/index.js');
    expect(packageJson.scripts?.start).not.toContain('ts-node');
    expect(packageJson.scripts?.start).not.toContain('.env');
    expect(packageJson.scripts?.dev).toContain(
      'npm --prefix .. run build --workspace @asiamath/shared',
    );
    expect(packageJson.scripts?.dev).toContain('prisma migrate deploy');
    expect(packageJson.scripts?.dev).toContain('../packages/shared/src');
    expect(packageJson.scripts?.dev).toContain('nodemon');
    expect(packageJson.scripts?.dev).not.toContain('file:./');
    expect(packageJson.scripts?.dev).not.toContain('.env');
    expect(packageJson.scripts?.test).toContain(
      'npm --prefix .. run build --workspace @asiamath/shared',
    );
    expect(packageJson.scripts?.test).toContain('DATABASE_URL="$TEST_DATABASE_URL"');
    expect(packageJson.scripts?.test).toContain('TEST_DATABASE_URL');
    expect(packageJson.scripts?.test).not.toContain('.env');
    expect(packageJson.scripts?.test).not.toContain('file:./');
  });

  it('requires externally provided DATABASE_URL in root-level utility scripts', () => {
    const scriptPaths = [
      path.join(backendRoot, '..', 'scripts', 'seed-demo-baseline.mjs'),
      path.join(backendRoot, '..', 'scripts', 'grant-real-flow-check.mjs'),
      path.join(backendRoot, '..', 'scripts', 'me-applications-real-flow-check.mjs'),
    ];

    for (const scriptPath of scriptPaths) {
      const contents = fs.readFileSync(scriptPath, 'utf8');

      expect(contents).not.toContain('file:./dev.db');
      expect(contents).not.toContain('dotenv/config');
      expect(contents).toContain('DATABASE_URL');
      expect(contents.indexOf('if (!process.env.DATABASE_URL)')).toBeGreaterThan(-1);
      expect(contents.indexOf('if (!process.env.DATABASE_URL)')).toBeLessThan(
        contents.indexOf("backendRequire('ts-node/register/transpile-only')"),
      );
    }
  });
});
