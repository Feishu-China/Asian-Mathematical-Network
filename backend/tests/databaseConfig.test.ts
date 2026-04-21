import fs from 'fs';
import path from 'path';

describe('backend database configuration', () => {
  it('loads the Prisma datasource URL from DATABASE_URL', () => {
    const schema = fs.readFileSync(
      path.join(__dirname, '..', 'prisma', 'schema.prisma'),
      'utf8'
    );

    expect(schema).toContain('url      = env("DATABASE_URL")');
  });

  it('uses a dedicated SQLite database for backend tests', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
    ) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.test).toContain('DATABASE_URL=file:./test.db');
  });
});
