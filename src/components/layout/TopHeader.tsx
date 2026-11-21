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
        {/* Floating Cream Paper pill header with warm yellow glow */}
        <header
          className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-[#b6b6b6] bg-[#fcfaf5] transition-all duration-200"
          style={{
            boxShadow: '0 10px 30px rgba(255, 233, 92, 0.35), 0 2px 6px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Left — Hamburger menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-9 h-9 cursor-pointer btn-spring"
            style={{ borderRadius: 'var(--radius-buttons)' }}
            aria-label="Open menu"
          >
            <Icon icon="doodle:menu" width={22} height={22} style={{ color: '#1a3300' }} />
          </button>

          {/* Center — Logo + Title */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer btn-spring"
            role="button"
            tabIndex={0}
            aria-label="Go to Team Wall"
          >
            {/* Custom Logo (28px x 28px object-contain) */}
            <img
              src="/ICON.png"
              alt="Enactus AU Beta Logo"
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
          </div>

          {/* Right — Circular Avatar */}
          {user ? (
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 cursor-pointer flex items-center justify-center rounded-full overflow-hidden btn-spring ring-1 ring-[#b6b6b6]"
              aria-label="Go to profile"
            >
              <StudioAvatar avatarId={user.avatarId} customAvatarUrl={user.customAvatarUrl} size={36} />
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}
        </header>
      </div>

      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
