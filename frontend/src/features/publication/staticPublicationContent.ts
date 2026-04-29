import type { PublicationPreview } from './types';

export const publicationPreviews: PublicationPreview[] = [
  {
    id: 'publication-001',
    slug: 'algebraic-geometry-school-notes',
    title: 'Algebraic Geometry School Notes',
    seriesLabel: 'School notes',
    ctaLabel: 'Read notes',
    summary:
      'Lecture notes and reading guidance from the 2026 algebraic geometry school, prepared for regional cohort use.',
    publicationFocus:
      'The notes capture how the school taught core topics, structured the cohort, and extended workshop themes into training material.',
    highlights: ['Lecture notes set', 'Reading list', 'Cohort study prompts'],
  },
  {
    id: 'publication-002',
    slug: 'mobility-and-collaboration-digest',
    title: 'Mobility and Collaboration Digest',
    seriesLabel: 'Research digest',
    ctaLabel: 'Read digest',
    summary:
      'A short-form digest connecting travel support, conference participation, and regional collaboration planning.',
    publicationFocus:
      'This digest records how mobility funding helps turn conference attendance into longer collaboration across institutions.',
    highlights: ['Mobility case note', 'Collaboration route map', 'Follow-up reading'],
  },
  {
    id: 'publication-003',
    slug: 'network-training-reader',
    title: 'Network Training Reader',
    seriesLabel: 'Teaching reader',
    ctaLabel: 'Read reader',
    summary:
      'A compact reader collecting lecture excerpts, exercise sets, and discussion prompts from the 2026 training programme.',
    publicationFocus:
      'The reader turns workshop material into a reusable reference for new participants joining the Asiamath network.',
    highlights: ['Lecture excerpt pack', 'Exercise set', 'Discussion prompts'],
  },
];
