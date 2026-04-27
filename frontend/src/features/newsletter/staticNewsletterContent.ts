import type { NewsletterIssue } from './types';

export const newsletterIssues: NewsletterIssue[] = [
  {
    id: 'newsletter-001',
    slug: 'asiamath-monthly-briefing-april-2026',
    title: 'Asiamath Monthly Briefing — April 2026',
    issueLabel: 'April 2026 issue',
    ctaLabel: 'Read issue',
    summary:
      'Workshop deadlines, school announcements, and partner updates from across the current Asiamath cycle.',
    issueFocus:
      'This issue follows the Shanghai workshop call, linked travel support, and summer training announcements across the network.',
    highlights: ['Workshop deadline round-up', 'Travel grant calendar', 'Partner update digest'],
  },
  {
    id: 'newsletter-002',
    slug: 'research-mobility-digest-march-2026',
    title: 'Research Mobility Digest — March 2026',
    issueLabel: 'March 2026 digest',
    ctaLabel: 'Read digest',
    summary:
      'Mobility funding notes, application reminders, and regional participation guidance for early-career researchers.',
    issueFocus:
      'The March digest centers on travel support, application sequencing, and participation planning around active calls.',
    highlights: ['Mobility advice note', 'Application reminders', 'Profile-preparation checklist'],
  },
  {
    id: 'newsletter-003',
    slug: 'summer-school-bulletin-may-2026',
    title: 'Summer School Bulletin — May 2026',
    issueLabel: 'May 2026 bulletin',
    ctaLabel: 'Read bulletin',
    summary:
      'A forward look at the summer school schedule, mentor assignments, and coordinated participation notes.',
    issueFocus:
      'This preview pulls together the training calendar, speaker lineup, and registration guidance for the next Asiamath cohort.',
    highlights: ['Summer schedule preview', 'Mentor assignment note', 'Registration guidance'],
  },
];
