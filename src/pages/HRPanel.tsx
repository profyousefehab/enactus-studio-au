import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useSession } from '../context/SessionContext';
import SessionAttendance from '../components/admin/SessionAttendance';
import PointsManager from '../components/admin/PointsManager';

type HRTab = 'attendance' | 'points';

export default function HRPanel() {
  const { user, logout } = useSession();
  const [activeTab, setActiveTab] = useState<HRTab>('attendance');

  if (!user || user.role !== 'hr') {
    return null;
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col md:flex-row"
      style={{ backgroundColor: 'var(--color-cream-paper)' }}
    >
      {/* ───── Mobile Header (Hidden on md+) ───── */}
      <header className="md:hidden sticky top-0 z-40 px-3 pt-3 pb-2 bg-[var(--color-cream-paper)] border-b border-[var(--color-pencil-gray)]/40 shadow-xs">
        <div className="flex items-center justify-between gap-2 w-full">
          {/* Logo & Title */}
          <div className="flex items-center gap-2">
            <img
              src="/ICON.png"
              alt="Enactus Logo"
              className="w-7 h-7 object-contain"
              width={28}
              height={28}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1
                  className="text-sm font-bold text-[var(--color-forest-ink)] leading-none"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Enactus AU Beta
                </h1>
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-[var(--color-forest-ink)]"
                  style={{
                    backgroundColor: 'var(--color-sticky-note-mint)',
                    color: 'var(--color-forest-ink)',
                  }}
                >
                  HR MODE
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-pencil-gray)] font-inter mt-0.5">
                {user.name}
              </p>
            </div>
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={logout}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--color-pencil-gray)] bg-white text-[var(--color-pencil-gray)] hover:text-[var(--color-forest-ink)] hover:border-[var(--color-forest-ink)] cursor-pointer btn-spring flex items-center gap-1"
            style={{ fontFamily: 'var(--font-inter)' }}
            title="Sign out of HR session"
          >
            <Icon icon="doodle:arrow-left" width={13} height={13} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Mobile Large Touch Navigation Tabs */}
        <div className="w-full mt-2.5">
          <nav
            aria-label="HR Operations Navigation"
            className="grid grid-cols-2 gap-2 p-1 rounded-xl border border-[var(--color-forest-ink)] bg-white shadow-2xs"
          >
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              aria-current={activeTab === 'attendance' ? 'page' : undefined}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold cursor-pointer transition-all btn-spring select-none ${
                activeTab === 'attendance'
                  ? 'bg-[var(--color-sticky-note-mint)] border border-[var(--color-forest-ink)] text-[var(--color-forest-ink)] shadow-2xs'
                  : 'text-[var(--color-forest-ink)]/70 hover:bg-black/5 border border-transparent'
              }`}
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              <Icon icon="doodle:clipboard" width={18} height={18} className="shrink-0" />
              <span>Attendance</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('points')}
              aria-current={activeTab === 'points' ? 'page' : undefined}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold cursor-pointer transition-all btn-spring select-none ${
                activeTab === 'points'
                  ? 'bg-[var(--color-highlighter-yellow)] border border-[var(--color-forest-ink)] text-[var(--color-forest-ink)] shadow-2xs'
                  : 'text-[var(--color-forest-ink)]/70 hover:bg-black/5 border border-transparent'
              }`}
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              <Icon icon="doodle:star" width={18} height={18} className="shrink-0" />
              <span>Points</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ───── Desktop Sidebar Navigation (Hidden on mobile) ───── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-[var(--color-pencil-gray)]/30 bg-white min-h-screen p-4 justify-between">
        <div className="flex flex-col gap-6">
          {/* Logo & Info */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--color-pencil-gray)]/30">
            <img
              src="/ICON.png"
              alt="Enactus Logo"
              className="w-8 h-8 object-contain"
              width={32}
              height={32}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1
                  className="text-sm font-bold text-[var(--color-forest-ink)] leading-none"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Enactus AU
                </h1>
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[var(--color-forest-ink)]"
                  style={{
                    backgroundColor: 'var(--color-sticky-note-mint)',
                    color: 'var(--color-forest-ink)',
                  }}
                >
                  HR
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-pencil-gray)] font-inter mt-0.5 truncate max-w-[140px]">
                {user.name}
              </p>
            </div>
          </div>

          {/* HR Navigation: Exactly Two Items */}
          <div>
            <span className="text-[10px] font-mono font-bold text-[var(--color-pencil-gray)] tracking-wider uppercase block mb-2 px-2">
              HR Operations
            </span>
            <nav aria-label="HR Sidebar Navigation" className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                aria-current={activeTab === 'attendance' ? 'page' : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-all btn-spring select-none ${
                  activeTab === 'attendance'
                    ? 'bg-[var(--color-sticky-note-mint)] border border-[var(--color-forest-ink)] text-[var(--color-forest-ink)] shadow-2xs'
                    : 'text-[var(--color-forest-ink)]/70 hover:bg-[var(--color-cream-paper)] border border-transparent'
                }`}
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <Icon icon="doodle:clipboard" width={18} height={18} className="shrink-0" />
                <span>Attendance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('points')}
                aria-current={activeTab === 'points' ? 'page' : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-all btn-spring select-none ${
                  activeTab === 'points'
                    ? 'bg-[var(--color-highlighter-yellow)] border border-[var(--color-forest-ink)] text-[var(--color-forest-ink)] shadow-2xs'
                    : 'text-[var(--color-forest-ink)]/70 hover:bg-[var(--color-cream-paper)] border border-transparent'
                }`}
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <Icon icon="doodle:star" width={18} height={18} className="shrink-0" />
                <span>Points</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: Sign Out */}
        <div className="pt-4 border-t border-[var(--color-pencil-gray)]/30">
          <button
            type="button"
            onClick={logout}
            className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-[var(--color-pencil-gray)] bg-[var(--color-cream-paper)] text-[var(--color-forest-ink)] hover:border-[var(--color-forest-ink)] cursor-pointer btn-spring flex items-center justify-center gap-1.5 transition-colors"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <Icon icon="doodle:arrow-left" width={14} height={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ───── Main Content Workstation (Mobile-first, full-width on mobile) ───── */}
      <main className="flex-1 w-full min-w-0 p-3 sm:p-5 lg:p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full">
          {activeTab === 'attendance' && <SessionAttendance />}
          {activeTab === 'points' && <PointsManager />}
        </div>
      </main>
    </div>
  );
}
