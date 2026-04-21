import { PrismaClient } from '@prisma/client';
import {
  cleanupDemoBaseline,
  ensureDemoBaseline,
} from '../src/lib/demoBaseline';

const prisma = new PrismaClient();

describe('demo baseline fixture', () => {
  beforeAll(async () => {
    await cleanupDemoBaseline(prisma);
  });

  afterAll(async () => {
    await cleanupDemoBaseline(prisma);
    await prisma.$disconnect();
  });

  it('creates a published conference and a published linked grant deterministically', async () => {
    const first = await ensureDemoBaseline(prisma);
    const second = await ensureDemoBaseline(prisma);

    expect(first.conference.slug).toBe('integration-grant-conf-2026');
    expect(first.conference.status).toBe('published');
    expect(first.grant.slug).toBe('integration-grant-2026-travel-support');
    expect(first.grant.status).toBe('published');
    expect(first.grant.linkedConferenceId).toBe(first.conference.id);

    expect(second.conference.id).toBe(first.conference.id);
    expect(second.grant.id).toBe(first.grant.id);

    const publishedGrant = await prisma.grantOpportunity.findUnique({
      where: { slug: 'integration-grant-2026-travel-support' },
    });

    expect(publishedGrant?.status).toBe('published');
  });
});
