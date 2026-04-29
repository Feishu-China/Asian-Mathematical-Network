export type GovernancePreviewSection = {
  id: string;
  title: string;
  summary: string;
  checkpoints: string[];
};

export const governancePreviewSections: GovernancePreviewSection[] = [
  {
    id: 'committee-workflow',
    title: 'Committee workflow preview',
    summary:
      'A future governance surface can hold nomination intake, reviewer assignment, and committee staging without forcing those engines into d0.',
    checkpoints: [
      'Nomination batches stay separate from public-facing award pages.',
      'Review packets remain visible only to authorized committee roles.',
      'Release preparation happens after committee decisions are locked.',
    ],
  },
  {
    id: 'decision-release',
    title: 'Decision release controls',
    summary:
      'Publication timing, visibility scope, and result wording should be controlled before any public award announcement is generated.',
    checkpoints: [
      'Public release summaries are drafted separately from reviewer notes.',
      'Result timing can be staged around partner, scholar, or award visibility windows.',
      'Public archives only expose approved release fields.',
    ],
  },
  {
    id: 'audit-trace',
    title: 'Audit and traceability',
    summary:
      'The governance layer should later provide a durable record of how an award moved from nomination through release.',
    checkpoints: [
      'Committee actions should remain attributable by role and timestamp.',
      'Scholar context is reused instead of copied into governance records.',
      'Admin-only checkpoints stay distinct from public archive content.',
    ],
  },
];
