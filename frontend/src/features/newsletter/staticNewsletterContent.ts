import type { NewsletterIssue } from './types';

export const newsletterIssues: NewsletterIssue[] = [
  {
    id: 'newsletter-001',
    slug: 'asiamath-monthly-briefing-april-2026',
    title: 'Asiamath Monthly Briefing - April 2026',
    issueLabel: 'Monthly issue',
    ctaLabel: 'Read issue',
    summary:
      'Editorial snapshots, program recaps, and platform signals presented as a product-facing breadth layer rather than a live publishing system.',
    issueFocus:
      'Conference deadlines, school cohorts, and partner teasers are framed as one narrative layer so the platform feels coherent before every module becomes dynamic.',
    highlights: ['Program recap preview', 'Call-for-action round-up', 'Partner teaser digest'],
  },
  {
    id: 'newsletter-002',
    slug: 'research-mobility-digest-march-2026',
    title: 'Research Mobility Digest - March 2026',
    issueLabel: 'Mobility recap',
    ctaLabel: 'Read digest',
    summary:
      'A static issue preview focused on travel support, application reminders, and regional opportunity curation.',
    issueFocus:
      'Shows how editorial curation can connect grants, conferences, and scholar preparation without requiring a real CMS in d0.',
    highlights: ['Grant reminder snapshot', 'Regional opportunity notes', 'Profile preparation prompt'],
  },
];

export const getNewsletterBySlug = (slug: string) =>
  newsletterIssues.find((issue) => issue.slug === slug) ?? null;
