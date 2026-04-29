import { describe, expect, it } from 'vitest';
import { newsletterProvider } from '../newsletter/newsletterProvider';
import { publicationProvider } from '../publication/publicationProvider';
import { videoProvider } from '../video/videoProvider';
import { outreachProvider } from '../outreach/outreachProvider';

const flattenText = (...values: string[]) => values.join(' ').toLowerCase();

describe('supporting content sources', () => {
  it('returns realistic teaser records without preview or placeholder language', async () => {
    const [issues, publications, videos, outreachPrograms] = await Promise.all([
      newsletterProvider.listPublicIssues(),
      publicationProvider.listPublications(),
      videoProvider.listPublicVideos(),
      outreachProvider.listPublicPrograms(),
    ]);

    expect(issues[0].title).toBe('Asiamath Monthly Briefing — April 2026');
    expect(publications[0].title).toBe('Algebraic Geometry School Notes');
    expect(videos[0].title).toBe('Algebraic Geometry School Session Recap');
    expect(outreachPrograms[0].title).toBe('Tokyo Public Lecture: Moduli After the Workshop');

    for (const record of [...issues, ...publications, ...videos, ...outreachPrograms]) {
      expect(flattenText(record.title, record.summary)).not.toMatch(/preview|placeholder|concept/);
    }
  });
});
