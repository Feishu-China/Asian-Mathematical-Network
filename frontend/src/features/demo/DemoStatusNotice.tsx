import type { ReactNode } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';

type Tone = 'info' | 'success' | 'warning' | 'danger';

type Props = {
  tone: Tone;
  badgeLabel: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function DemoStatusNotice({
  tone,
  badgeLabel,
  title,
  description,
  actions,
  className,
}: Props) {
  const classes = ['demo-status-notice', `demo-status-notice--${tone}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role={tone === 'danger' ? 'alert' : 'status'}>
      <div className="demo-status-notice__header">
        <StatusBadge tone={tone}>{badgeLabel}</StatusBadge>
        <p className="demo-status-notice__title">{title}</p>
      </div>
      {description ? <p className="demo-status-notice__description">{description}</p> : null}
      {actions ? <div className="demo-status-notice__actions">{actions}</div> : null}
    </div>
  );
}
