import type { VideoPreview } from './types';

export const videoPreviews: VideoPreview[] = [
  {
    id: 'video-001',
    slug: 'algebraic-geometry-school-session-recap',
    title: 'Algebraic Geometry School Session Recap',
    seriesLabel: 'School recap',
    ctaLabel: 'Watch recap',
    summary:
      'Recorded session highlights and speaker notes from the 2026 algebraic geometry training cohort.',
    videoFocus:
      'The recap shows how school activity becomes a reusable public memory layer for later participants and partner institutions.',
    highlights: ['Session recap', 'Speaker segment', 'Student Q&A excerpt'],
  },
  {
    id: 'video-002',
    slug: 'travel-grant-application-explainer',
    title: 'Travel Grant Application Explainer',
    seriesLabel: 'Grant explainer',
    ctaLabel: 'Watch explainer',
    summary:
      'A short guide to preparing a mobility application linked to an active conference or training call.',
    videoFocus:
      'This explainer clarifies how travel support relates to programme participation without collapsing the two application records.',
    highlights: ['Eligibility overview', 'Application sequence', 'Funding timeline'],
  },
  {
    id: 'video-003',
    slug: 'poster-session-highlight-reel',
    title: 'Poster Session Highlight Reel',
    seriesLabel: 'Event highlights',
    ctaLabel: 'Watch highlights',
    summary:
      'A short reel capturing poster presentations, discussion rounds, and informal exchanges from the 2026 network meeting.',
    videoFocus:
      'The highlight reel preserves the collaborative energy of the meeting and gives later cohorts a quick entry point.',
    highlights: ['Poster walk-through', 'Discussion clips', 'Community snapshots'],
  },
];
