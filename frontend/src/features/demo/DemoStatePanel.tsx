import { useId, type ReactNode } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

type Props = {
  badgeLabel: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  headingLevel?: 'h2' | 'h3';
  tone?: Tone;
  compact?: boolean;
};

export function DemoStatePanel({
  badgeLabel,
  title,
  description,
  actions,
  className,
  headingLevel = 'h2',
  tone = 'info',
  compact = false,
}: Props) {
  const headingId = useId();
  const Heading = headingLevel;
  const classes = ['surface-card', 'demo-state-panel', compact ? 'demo-state-panel--compact' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes} aria-labelledby={headingId}>
      <StatusBadge tone={tone}>{badgeLabel}</StatusBadge>
      <Heading id={headingId}>{title}</Heading>
      {description ? <p className="demo-state-panel__description">{description}</p> : null}
      {actions ? <div className="demo-state-panel__actions">{actions}</div> : null}
    </section>
  );
}
