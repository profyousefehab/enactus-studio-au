import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import StudioAvatar from '../ui/StudioAvatar';
import SidebarDrawer from './SidebarDrawer';

export default function TopHeader() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-40 px-3 pt-3 pb-1 select-none pointer-events-auto">
        {/* Floating Cream Paper pill header with subtle nav glow */}
        <header
          className="flex items-center justify-between px-3 py-2 rounded-2xl border border-[var(--color-pencil-gray)] bg-[var(--color-cream-paper)] transition-all duration-200"
          style={{
            boxShadow: '0 8px 24px rgba(255, 233, 92, 0.25), var(--shadow-subtle)',
          }}
        >
          {/* Left — Hamburger menu button (44x44 touch target) */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-11 h-11 cursor-pointer btn-spring"
            style={{ borderRadius: 'var(--radius-buttons)' }}
            aria-label="Open menu"
          >
            <Icon icon="doodle:menu" width={22} height={22} style={{ color: 'var(--color-forest-ink)' }} />
          </button>

          {/* Center — Logo + Title */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 min-h-[44px] px-2 cursor-pointer btn-spring"
            style={{ borderRadius: 'var(--radius-buttons)' }}
            aria-label="Go to Team Wall"
          >
            {/* Custom Logo (28px x 28px object-contain) */}
            <img
              src="/ICON.png"
              alt=""
              aria-hidden="true"
              className="w-7 h-7 shrink-0 object-contain"
              width={28}
              height={28}
            />

            <h1
              className="text-base font-bold tracking-tight"
              style={{
                fontFamily: 'var(--font-inter)',
                color: 'var(--color-forest-ink)',
              }}
            >
              Enactus AU Beta
            </h1>
          </button>

          {/* Right — Circular Avatar (44x44 touch target) */}
          {user ? (
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-11 h-11 cursor-pointer flex items-center justify-center rounded-full btn-spring"
              aria-label="Go to profile"
            >
              <span className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-[var(--color-pencil-gray)] flex items-center justify-center">
                <StudioAvatar avatarId={user.avatarId} customAvatarUrl={user.customAvatarUrl} size={36} />
              </span>
            </button>
          ) : (
            <div className="w-11 h-11" />
          )}
        </header>
      </div>

      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
