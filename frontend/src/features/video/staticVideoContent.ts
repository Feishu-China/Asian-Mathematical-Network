import type { VideoPreview } from './types';

export const videoPreviews: VideoPreview[] = [
  {
    id: 'video-001',
    slug: 'asiamath-research-school-session-recap',
    title: 'Asiamath Research School Session Recap',
    seriesLabel: 'School recap',
    ctaLabel: 'Watch preview',
    summary:
      'Session recaps, scholar spotlights, and community explainers presented as a reusable content layer rather than a live media system.',
    videoFocus:
      'Shows how school activity can turn into a reusable content layer for later outreach, publishing, and community discovery.',
    highlights: ['Session recap preview', 'Speaker highlight snippet', 'Community recap teaser'],
  },
  {
    id: 'video-002',
    slug: 'mobility-grant-explainer-preview',
    title: 'Mobility Grant Explainer Preview',
    seriesLabel: 'Grant explainer',
    ctaLabel: 'Watch explainer',
    summary:
      'A static preview for short-form explainers that help applicants understand mobility support and application sequencing.',
    videoFocus:
      'Shows how grants, conference workflows, and preparation guidance can be narrated through lightweight video surfaces before a full media pipeline exists.',
    highlights: ['Eligibility explainer frame', 'Application sequence cue', 'Presenter-safe CTA recap'],
  },
];

export const getVideoBySlug = (slug: string) =>
  videoPreviews.find((video) => video.slug === slug) ?? null;
