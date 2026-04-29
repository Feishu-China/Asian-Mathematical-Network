import { useId } from 'react';
import { Link } from 'react-router-dom';
import type { ReturnContextState } from '../navigation/returnContext';

type DemoShortcut = {
  to: string;
  label: string;
  description: string;
  note?: string;
  state?: ReturnContextState;
};

type Props = {
  title: string;
  intro: string;
  shortcuts: DemoShortcut[];
  className?: string;
  headingLevel?: 'h2' | 'h3';
};

export function DemoShortcutPanel({
  title,
  intro,
  shortcuts,
  className,
  headingLevel = 'h2',
}: Props) {
  const headingId = useId();
  const Heading = headingLevel;
  const classes = ['demo-shortcut-panel', className].filter(Boolean).join(' ');

  return (
    <section className={classes} aria-labelledby={headingId}>
      <Heading id={headingId}>{title}</Heading>
      <p className="demo-shortcut-panel__intro">{intro}</p>
      <ul className="demo-shortcut-list">
        {shortcuts.map((shortcut) => (
          <li key={`${shortcut.to}:${shortcut.label}`} className="surface-card demo-shortcut-card">
            <Link to={shortcut.to} state={shortcut.state} className="demo-shortcut-card__link">
              {shortcut.label}
            </Link>
            <p className="demo-shortcut-card__description">{shortcut.description}</p>
            {shortcut.note ? <p className="demo-shortcut-card__note">{shortcut.note}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
