import type { ReactNode } from 'react';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

type Props = {
  children: ReactNode;
  tone?: Tone;
};

export function StatusBadge({ children, tone = 'neutral' }: Props) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>;
}
