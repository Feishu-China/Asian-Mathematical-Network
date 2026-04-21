import { PrismaClient } from '@prisma/client';
import {
  cleanupGrantIntegrationFixture,
  ensureGrantIntegrationFixture,
} from './helpers/grantIntegrationFixture';

const prisma = new PrismaClient();

describe('grant integration fixture helper', () => {
  beforeAll(async () => {
    await cleanupGrantIntegrationFixture(prisma);
  });

  afterAll(async () => {
    await cleanupGrantIntegrationFixture(prisma);
    await prisma.$disconnect();
  });

  it('creates one published conference and one published linked grant deterministically', async () => {
    const first = await ensureGrantIntegrationFixture(prisma);
    const second = await ensureGrantIntegrationFixture(prisma);

    expect(first.conference.slug).toBe('integration-grant-conf-2026');
    expect(first.grant.slug).toBe('integration-grant-2026-travel-support');
    expect(first.grant.linkedConferenceId).toBe(first.conference.id);
    expect(first.grant.status).toBe('published');
    expect(first.grant.reportRequired).toBe(true);

    expect(second.conference.id).toBe(first.conference.id);
    expect(second.grant.id).toBe(first.grant.id);

    const storedGrants = await prisma.grantOpportunity.findMany({
      where: { slug: { in: ['integration-grant-2026-travel-support'] } },
    });

    expect(storedGrants).toHaveLength(1);
  });
});
