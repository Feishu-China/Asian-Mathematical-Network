export type NewsletterIssue = {
  id: string;
  slug: string;
  title: string;
  issueLabel: string;
  ctaLabel: string;
  summary: string;
  issueFocus: string;
  highlights: string[];
};

export type NewsletterProvider = {
  listPublicIssues(): Promise<NewsletterIssue[]>;
  getIssueBySlug(slug: string): Promise<NewsletterIssue | null>;
};
