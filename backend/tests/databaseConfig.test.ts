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

  it('documents the local and test PostgreSQL environment variables', () => {
    const envExample = readBackendFile('.env.example');

    expect(envExample).toContain('DATABASE_URL=');
    expect(envExample).toContain('TEST_DATABASE_URL=');
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
});
