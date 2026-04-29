import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { WorkspaceKey } from '@asiamath/shared/models';
import {
  getWorkspaceLabel,
  getWorkspaceRoot,
  normalizeAvailableWorkspaces,
  shouldShowWorkspaceSwitcher,
  writeStoredWorkspace,
} from './workspaces';

type WorkspaceSwitcherProps = {
  currentWorkspace: WorkspaceKey;
  availableWorkspaces: WorkspaceKey[];
};

export function WorkspaceSwitcher({
  currentWorkspace,
  availableWorkspaces,
}: WorkspaceSwitcherProps) {
  const menuId = useId();
  const triggerId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const workspaces = useMemo(
    () => normalizeAvailableWorkspaces(availableWorkspaces),
    [availableWorkspaces]
  );
  const activeWorkspace = workspaces.includes(currentWorkspace) ? currentWorkspace : workspaces[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const root = rootRef.current;

      if (root && !root.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!activeWorkspace || !shouldShowWorkspaceSwitcher(workspaces)) {
    return null;
  }

  return (
    <div className="workspace-switcher" ref={rootRef}>
      <button
        id={triggerId}
        type="button"
        className="workspace-switcher__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>Workspace</span>
        <span className="workspace-switcher__current" aria-hidden="true">
          {getWorkspaceLabel(activeWorkspace)}
        </span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open ? (
        <div id={menuId} className="workspace-switcher__panel" role="menu" aria-labelledby={triggerId}>
          {workspaces.map((workspace) => {
            const target = getWorkspaceRoot(workspace);
            const isCurrent = workspace === activeWorkspace;

            return (
              <button
                key={workspace}
                type="button"
                role="menuitemradio"
                aria-checked={isCurrent}
                className="workspace-switcher__item"
                onClick={() => {
                  writeStoredWorkspace(workspace);
                  setOpen(false);

                  if (location.pathname === target && isCurrent) {
                    return;
                  }

                  navigate(target);
                }}
              >
                <span className="workspace-switcher__item-copy">
                  <span className="workspace-switcher__item-label">
                    {getWorkspaceLabel(workspace)}
                  </span>
                  <span className="workspace-switcher__item-meta">
                    {isCurrent ? 'Current workspace' : `Switch to ${getWorkspaceLabel(workspace)}`}
                  </span>
                </span>
                {isCurrent ? <Check size={16} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
