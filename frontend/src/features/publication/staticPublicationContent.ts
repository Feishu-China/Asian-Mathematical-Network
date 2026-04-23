import type { PublicationPreview } from './types';

export const publicationPreviews: PublicationPreview[] = [
  {
    id: 'publication-001',
    slug: 'asiamath-school-notes-preview',
    title: 'Asiamath School Notes Preview',
    seriesLabel: 'School notes',
    ctaLabel: 'Read preview',
    summary:
      'Working papers, lecture notes, and research digests presented as a static publication layer rather than a live repository.',
    publicationFocus:
      'Shows how school outputs can become a reusable publication layer for later citation, discovery, and editorial linking.',
    highlights: ['Lecture notes preview', 'Research digest teaser', 'Citation layer placeholder'],
  },
  {
    id: 'publication-002',
    slug: 'mobility-research-digest-preview',
    title: 'Mobility Research Digest Preview',
    seriesLabel: 'Digest preview',
    ctaLabel: 'Read digest',
    summary:
      'A static preview for short-form digests that connect grants, conference travel, and regional opportunity framing.',
    publicationFocus:
      'Shows how grant and mobility stories can be archived as publication-style outputs before a full repository exists.',
    highlights: ['Mobility digest snapshot', 'Regional callout notes', 'Archive metadata placeholder'],
  },
];

export const getPublicationBySlug = (slug: string) =>
  publicationPreviews.find((publication) => publication.slug === slug) ?? null;
