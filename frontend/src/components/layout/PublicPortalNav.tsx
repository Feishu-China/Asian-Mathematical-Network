import { useEffect, useId, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { PORTAL_RETURN_CONTEXT } from '../../features/demo/demoWalkthrough';
import {
  readReturnContext,
  toReturnContextState,
} from '../../features/navigation/returnContext';
import './PublicPortalNav.css';

const publicLinks = [
  { to: '/conferences', label: 'Conferences' },
  { to: '/grants', label: 'Travel Grants' },
  { to: '/schools', label: 'Schools' },
  { to: '/prizes', label: 'Prizes' },
  { to: '/scholars', label: 'Scholars' },
] as const;

const resourceLinks = [
  { to: '/newsletter', label: 'Newsletter' },
  { to: '/videos', label: 'Videos' },
  { to: '/publications', label: 'Publications' },
] as const;

export function PublicPortalNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const returnContext = readReturnContext(location.state);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [hasApplicantSession, setHasApplicantSession] = useState(Boolean(localStorage.getItem('token')));
  const accountMenuId = useId();
  const publicReturnState = toReturnContextState(
    returnContext ?? (location.pathname === '/portal' ? PORTAL_RETURN_CONTEXT : null)
  );

  useEffect(() => {
    setHasApplicantSession(Boolean(localStorage.getItem('token')));
  }, [location.key]);

  const closeMenus = () => {
    setMenuOpen(false);
    setResourcesOpen(false);
    setAccountMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setHasApplicantSession(false);
    closeMenus();
    navigate('/portal');
  };

  return (
    <div className="portal-nav">
      <div className="portal-nav__inner">
        <Link to="/portal" className="portal-nav__brand" onClick={closeMenus}>
          <span className="portal-nav__brand-word">Asiamath</span>
          <span className="portal-nav__brand-subtitle">Asian Mathematical Network</span>
        </Link>

        <button
          type="button"
          className="portal-nav__toggle"
          aria-expanded={menuOpen}
          aria-controls="portal-nav-links"
          onClick={() => setMenuOpen((value) => !value)}
        >
          Menu
        </button>

        <div
          id="portal-nav-links"
          className={`portal-nav__panel${menuOpen ? ' portal-nav__panel--open' : ''}`}
        >
          <nav className="portal-nav__links" aria-label="Public sections">
            {publicLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                state={publicReturnState}
                onClick={closeMenus}
                className={({ isActive }) =>
                  `portal-nav__link${isActive ? ' portal-nav__link--active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="portal-nav__dropdown">
              <button
                type="button"
                className="portal-nav__link portal-nav__link--button"
                aria-expanded={resourcesOpen}
                onClick={() => setResourcesOpen((value) => !value)}
              >
                Resources
              </button>
              {resourcesOpen ? (
                <div className="portal-nav__menu" role="menu">
                  {resourceLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      state={publicReturnState}
                      className="portal-nav__menu-link"
                      onClick={closeMenus}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          <div className="portal-nav__actions">
            {hasApplicantSession ? (
              <div className="portal-nav__account">
                <button
                  type="button"
                  className="portal-nav__account-trigger"
                  aria-expanded={accountMenuOpen}
                  aria-controls={accountMenuId}
                  onClick={() => {
                    setResourcesOpen(false);
                    setAccountMenuOpen((value) => !value);
                  }}
                >
                  <span>Account</span>
                  <ChevronDown size={18} aria-hidden="true" />
                </button>
                {accountMenuOpen ? (
                  <div id={accountMenuId} className="portal-nav__account-menu">
                    <Link
                      to="/me/applications"
                      className="portal-nav__account-item"
                      onClick={closeMenus}
                    >
                      My Applications
                    </Link>
                    <Link to="/me/profile" className="portal-nav__account-item" onClick={closeMenus}>
                      My Profile
                    </Link>
                    <button
                      type="button"
                      className="portal-nav__account-item portal-nav__account-item--danger"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                to="/login"
                state={{ returnTo: location.pathname }}
                className="portal-nav__primary"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
