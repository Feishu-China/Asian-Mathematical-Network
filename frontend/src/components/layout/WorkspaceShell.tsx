import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AccountMenu, AccountMenuItem } from '../../features/navigation/accountMenu';

type WorkspaceAccountMenuProps = {
  menu: AccountMenu;
};

function WorkspaceAccountMenu({ menu }: WorkspaceAccountMenuProps) {
  const menuId = useId();
  const triggerId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const closeMenu = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const root = rootRef.current;

      if (root && !root.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const renderItem = (item: AccountMenuItem) => {
    if (item.kind === 'link') {
      return (
        <Link key={item.to} to={item.to} className="workspace-account-menu__item" onClick={closeMenu}>
          {item.label}
        </Link>
      );
    }

    return (
      <button
        key={item.label}
        type="button"
        className="workspace-account-menu__item workspace-account-menu__item--action"
        onClick={() => {
          item.onSelect();
          closeMenu();
        }}
      >
        {item.label}
      </button>
    );
  };

  return (
    <div className="workspace-account-menu" ref={rootRef}>
      <button
        id={triggerId}
        type="button"
        className="workspace-account-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{menu.label}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open ? (
        <div id={menuId} className="workspace-account-menu__panel" role="menu" aria-labelledby={triggerId}>
          {menu.items.map(renderItem)}
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  accountMenu?: AccountMenu;
  aside?: ReactNode;
  children: ReactNode;
};

export function WorkspaceShell({
  eyebrow,
  title,
  description,
  badges,
  actions,
  accountMenu,
  aside,
  children,
}: Props) {
  return (
    <div className="page-shell page-shell--workspace">
      <div className="page-shell__container">
        <header className="page-shell__header">
          {eyebrow ? <p className="page-shell__eyebrow">{eyebrow}</p> : null}
          {badges ? <div className="page-shell__badges">{badges}</div> : null}
          {title || description || actions || accountMenu ? (
            <div className="page-shell__title-row">
              <div className="page-shell__title-group">
                {title ? <h1>{title}</h1> : null}
                {description ? <p className="page-shell__description">{description}</p> : null}
              </div>
              {actions || accountMenu ? (
                <div className="page-shell__actions">
                  {actions}
                  {accountMenu ? <WorkspaceAccountMenu menu={accountMenu} /> : null}
                </div>
              ) : null}
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
