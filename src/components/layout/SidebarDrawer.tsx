import { Icon } from '@iconify/react';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { useSessionFeedback } from '../../context/SessionFeedbackContext';
import { useFocusTrap } from '../../utils/useFocusTrap';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import StickerIcon from '../ui/StickerIcon';

interface Props {
  open: boolean;
  onClose: () => void;
}

const NAV_LINKS = [
  { path: '/', label: 'Team Wall', icon: 'doodle:home' },
  { path: '/profile', label: 'My Profile', icon: 'doodle:user' },
  { path: '/leaderboard', label: 'Leaderboard', icon: 'doodle:star-medal' },
  { path: '/guidelines', label: 'Guidelines', icon: 'doodle:book-open' },
];

export default function SidebarDrawer({ open, onClose }: Props) {
  const { user, logout } = useSession();
  const { isFeedbackLive, openModal } = useSessionFeedback();
  const navigate = useNavigate();
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Trap focus inside drawer and close on Escape when open
  useFocusTrap(open, drawerRef, onClose);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleNav(path: string) {
    navigate(path);
    onClose();
  }

  function handleLogout() {
    logout();
    navigate('/onboarding');
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 transition-opacity duration-250"
          style={{ backgroundColor: 'rgba(26, 51, 0, 0.3)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal={open ? 'true' : undefined}
        aria-hidden={!open}
        inert={!open || undefined}
        aria-label="Navigation menu"
        tabIndex={-1}
        className={`fixed top-0 left-0 z-50 h-full w-72 flex flex-col transition-all duration-250 ease-in-out ${
          open ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
        style={{
          backgroundColor: 'var(--color-cream-paper)',
          borderRight: '1px solid var(--color-forest-ink)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Close button (44x44 touch target) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 w-11 h-11 flex items-center justify-center cursor-pointer btn-spring"
          style={{ borderRadius: 'var(--radius-buttons)' }}
          aria-label="Close menu"
        >
          <Icon icon="doodle:close" width={20} height={20} style={{ color: 'var(--color-forest-ink)' }} />
        </button>

        {/* Brand header with custom logo */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-2.5 border-b border-[var(--color-pencil-gray)]">
          <img
            src="/ICON.png"
            alt="Enactus AU Beta Logo"
            className="w-7 h-7 shrink-0 object-contain"
            width={28}
            height={28}
          />
          <h2
            className="text-base font-bold tracking-tight"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'var(--color-forest-ink)',
            }}
          >
            Enactus AU Beta
          </h2>
        </div>

        {/* Mini card header */}
        {user && (
          <div className="p-4 pb-3.5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-pencil-gray)' }}>
            <StudioAvatar avatarId={user.avatarId} customAvatarUrl={user.customAvatarUrl} size={44} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-forest-ink)' }}>
                {user.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <TrackBadge track={user.track} size="sm" />
                <span
                  className="text-xs"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-forest-ink)',
                  }}
                >
                  #{user.pinCode}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {NAV_LINKS.map(({ path, label, icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                type="button"
                onClick={() => handleNav(path)}
                className="flex items-center gap-3 px-3 min-h-[44px] py-2.5 text-sm font-medium w-full cursor-pointer transition-colors duration-150"
                style={{
                  fontFamily: 'var(--font-inter)',
                  color: 'var(--color-forest-ink)',
                  backgroundColor: isActive ? 'var(--color-sticky-note-teal)' : 'transparent',
                  border: isActive ? '1px solid var(--color-forest-ink)' : '1px solid transparent',
                  borderRadius: 'var(--radius-buttons)',
                }}
              >
                <Icon icon={icon} width={20} height={20} style={{ color: 'var(--color-forest-ink)' }} />
                {label}
              </button>
            );
          })}

          {/* Live Session Feedback button — conditional when feedback is live and member hasn't submitted */}
          {isFeedbackLive && (
            <button
              type="button"
              onClick={() => {
                openModal();
                onClose();
              }}
              className="flex items-center justify-between px-3 min-h-[44px] py-2.5 text-sm font-bold w-full cursor-pointer transition-all duration-150 btn-spring my-1"
              style={{
                fontFamily: 'var(--font-inter)',
                color: 'var(--color-forest-ink)',
                backgroundColor: 'var(--color-sticky-note-mint)',
                border: '1px solid var(--color-forest-ink)',
                borderRadius: 'var(--radius-buttons)',
              }}
            >
              <div className="flex items-center gap-3">
                <StickerIcon name="star" size={20} />
                <span>Session Feedback</span>
              </div>
              <span
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-[var(--color-forest-ink)] flex items-center gap-1"
                style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-forest-ink)] animate-pulse" />
                LIVE
              </span>
            </button>
          )}

          {/* Admin links — conditional */}
          {user?.role === 'admin' && (
            <>
              <button
                type="button"
                onClick={() => handleNav('/admin')}
                className="flex items-center gap-3 px-3 min-h-[44px] py-2.5 text-sm font-medium w-full cursor-pointer transition-colors duration-150"
                style={{
                  fontFamily: 'var(--font-inter)',
                  color: 'var(--color-forest-ink)',
                  backgroundColor: location.pathname === '/admin' ? 'var(--color-sticky-note-teal)' : 'transparent',
                  border: location.pathname === '/admin' ? '1px solid var(--color-forest-ink)' : '1px solid transparent',
                  borderRadius: 'var(--radius-buttons)',
                }}
              >
                <Icon icon="doodle:gear" width={20} height={20} style={{ color: 'var(--color-forest-ink)' }} />
                Admin Panel
              </button>
              <button
                type="button"
                onClick={() => handleNav('/admin/members')}
                className="flex items-center gap-3 px-3 min-h-[44px] py-2.5 text-sm font-medium w-full cursor-pointer transition-colors duration-150"
                style={{
                  fontFamily: 'var(--font-inter)',
                  color: 'var(--color-forest-ink)',
                  backgroundColor: location.pathname === '/admin/members' ? 'var(--color-sticky-note-teal)' : 'transparent',
                  border: location.pathname === '/admin/members' ? '1px solid var(--color-forest-ink)' : '1px solid transparent',
                  borderRadius: 'var(--radius-buttons)',
                }}
              >
                <Icon icon="doodle:users" width={20} height={20} style={{ color: 'var(--color-forest-ink)' }} />
                Members Directory
              </button>
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4" style={{ borderTop: '1px solid var(--color-pencil-gray)' }}>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 min-h-[44px] py-2.5 text-sm font-medium w-full cursor-pointer"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'var(--color-terracotta)',
              borderRadius: 'var(--radius-buttons)',
            }}
          >
            <Icon icon="doodle:log-out" width={20} height={20} style={{ color: 'var(--color-terracotta)' }} />
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}
