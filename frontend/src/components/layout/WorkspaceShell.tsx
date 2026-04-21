import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
};

export function WorkspaceShell({
  eyebrow,
  title,
  description,
  badges,
  actions,
  aside,
  children,
}: Props) {
  return (
    <div className="page-shell page-shell--workspace">
      <div className="page-shell__container">
        <header className="page-shell__header">
          {eyebrow ? <p className="page-shell__eyebrow">{eyebrow}</p> : null}
          {badges ? <div className="page-shell__badges">{badges}</div> : null}
          {title || description || actions ? (
            <div className="page-shell__title-row">
              <div className="page-shell__title-group">
                {title ? <h1>{title}</h1> : null}
                {description ? <p className="page-shell__description">{description}</p> : null}
              </div>
              {actions ? <div className="page-shell__actions">{actions}</div> : null}
            </div>
          ) : null}
        </header>

        <div className={aside ? 'page-shell__content page-shell__content--with-aside' : 'page-shell__content'}>
          <div className="page-shell__main">{children}</div>
          {aside ? <aside className="page-shell__aside">{aside}</aside> : null}
        </div>
      </div>
    </div>
  );
}
