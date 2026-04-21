type PageMode = 'real-aligned' | 'hybrid' | 'static-preview';

type Props = {
  mode: PageMode;
};

const labels: Record<PageMode, string> = {
  'real-aligned': 'Real-aligned',
  hybrid: 'Hybrid',
  'static-preview': 'Static preview',
};

export function PageModeBadge({ mode }: Props) {
  return <span className="ui-badge ui-badge--mode">Page mode: {labels[mode]}</span>;
}
