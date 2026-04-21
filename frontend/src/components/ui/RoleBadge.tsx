type Role = 'visitor' | 'applicant' | 'reviewer' | 'organizer' | 'admin';

type Props = {
  role: Role;
};

const labels: Record<Role, string> = {
  visitor: 'Visitor',
  applicant: 'Applicant',
  reviewer: 'Reviewer',
  organizer: 'Organizer',
  admin: 'Admin',
};

export function RoleBadge({ role }: Props) {
  return <span className="ui-badge ui-badge--role">Role: {labels[role]}</span>;
}
