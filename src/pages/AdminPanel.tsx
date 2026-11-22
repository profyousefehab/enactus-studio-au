import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../lib/firebase';
import DashboardHome from '../components/admin/DashboardHome';
import MembersRoster from '../components/admin/MembersRoster';
import SessionFeedbackManager from '../components/admin/SessionFeedbackManager';
import WallDropPublisher from '../components/admin/WallDropPublisher';
import SessionAttendance from '../components/admin/SessionAttendance';
import PointsManager from '../components/admin/PointsManager';
import FeedbackPairer from '../components/admin/FeedbackPairer';
import RandomPicker from '../components/admin/RandomPicker';
import GoldenQuestionLauncher from '../components/admin/GoldenQuestionLauncher';
import HRAccountsManager from '../components/admin/HRAccountsManager';
import { isExcludedMember } from '../utils/accounts';

export type AdminTab =
  | 'dashboard'
  | 'members'
  | 'attendance'
  | 'points'
  | 'hr-accounts'
  | 'golden-question'
  | 'feedback-session'
  | 'wall-drop'
  | 'picker'
  | 'feedback';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: string;
}

interface NavGroup {
  name: string;
  items: NavItem[];
}

interface Props {
  initialTab?: AdminTab | 'all';
}

const NAV_GROUPS: NavGroup[] = [
  {
    name: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'doodle:dashboard' },
    ],
  },
  {
    name: 'PEOPLE',
    items: [
      { id: 'members', label: 'Members', icon: 'doodle:users' },
      { id: 'attendance', label: 'Attendance', icon: 'doodle:clipboard' },
      { id: 'points', label: 'Points', icon: 'doodle:star' },
      { id: 'hr-accounts', label: 'HR Accounts', icon: 'doodle:shield' },
    ],
  },
  {
    name: 'LIVE SESSION',
    items: [
      { id: 'golden-question', label: 'Quiz', icon: 'doodle:zap' },
      { id: 'feedback-session', label: 'Feedback', icon: 'doodle:star' },
      { id: 'picker', label: 'Random Picker', icon: 'doodle:dice' },
    ],
  },
  {
    name: 'TEAM COMMS',
    items: [
      { id: 'wall-drop', label: 'Wall Drops', icon: 'doodle:megaphone' },
      { id: 'feedback', label: 'Pairing', icon: 'doodle:users' },
    ],
  },
];

const ALL_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export default function AdminPanel({ initialTab }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  // Normalize initialTab: replace legacy 'all' with real 'dashboard' home
  const resolveInitialTab = (): AdminTab => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as AdminTab | null;
    if (tabParam && ALL_ITEMS.some((i) => i.id === tabParam)) return tabParam;
    if (initialTab && initialTab !== 'all') return initialTab;
    if (location.pathname === '/admin/members') return 'members';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(resolveInitialTab);
  const [stats, setStats] = useState({ total: 0, design: 0, content: 0, totalPoints: 0, loading: true });

  // Hoisted state for MembersRoster to preserve state across responsive switches
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterTrackFilter, setRosterTrackFilter] = useState<'All' | 'Design' | 'Content'>('All');
  const [rosterSortBy, setRosterSortBy] = useState<'rank-desc' | 'rank-asc' | 'name-asc' | 'streak-desc' | 'pin-asc'>('rank-desc');

  // Sync tab if URL changes or initialTab changes
  useEffect(() => {
    if (initialTab && initialTab !== 'all') {
      setActiveTab(initialTab);
    } else if (location.pathname === '/admin/members') {
      setActiveTab('members');
    }
  }, [initialTab, location.pathname]);

  // Body class hook for admin container styling
  useEffect(() => {
    document.body.classList.add('in-admin');
    return () => {
      document.body.classList.remove('in-admin');
    };
  }, []);

  // Fetch committee member counts and aggregate points (excluding admin & HR accounts)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const members = snap.docs
        .map((d) => d.data())
        .filter((u: any) => !isExcludedMember(u));

      const total = members.length;
      const design = members.filter((m: any) => m.track === 'Design').length;
      const content = members.filter((m: any) => m.track === 'Content').length;
      const totalPoints = members.reduce((sum: number, m: any) => sum + (m.points || 0), 0);

      setStats({
        total,
        design,
        content,
        totalPoints,
        loading: false,
      });
    });
    return unsub;
  }, []);

  // Shared component renderer to avoid duplicate mount/unmount and preserve state
  function renderSectionContent(tabId: AdminTab) {
    switch (tabId) {
      case 'dashboard':
        return <DashboardHome onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 'members':
        return (
          <MembersRoster
            showMetrics={false}
            searchQuery={rosterSearch}
            onSearchQueryChange={setRosterSearch}
            trackFilter={rosterTrackFilter}
            onTrackFilterChange={setRosterTrackFilter}
            sortBy={rosterSortBy}
            onSortByChange={setRosterSortBy}
          />
        );
      case 'attendance':
        return <SessionAttendance />;
      case 'points':
        return <PointsManager />;
      case 'hr-accounts':
        return <HRAccountsManager />;
      case 'golden-question':
        return <GoldenQuestionLauncher />;
      case 'feedback-session':
        return <SessionFeedbackManager />;
      case 'wall-drop':
        return <WallDropPublisher />;
      case 'picker':
        return <RandomPicker />;
      case 'feedback':
        return <FeedbackPairer />;
      default:
        return <DashboardHome onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:px-8 admin-container w-full">
      {/* ═══════════════════════════════════════════
          R4. Slimmer Header (One Slim Line)
          ═══════════════════════════════════════════ */}
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-[var(--color-pencil-gray)]/40">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-semibold px-2.5 py-1 rounded cursor-pointer btn-spring inline-flex items-center gap-1.5 transition-colors"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'var(--color-forest-ink)',
              backgroundColor: 'var(--color-cream-paper)',
              border: '1px solid var(--color-pencil-gray)',
            }}
            title="Return to Team Wall"
          >
            <span>← Team Wall</span>
          </button>

          <span
            className="text-[11px] font-mono font-bold px-2 py-0.5"
            style={{
              backgroundColor: 'var(--color-highlighter-yellow)',
              color: 'var(--color-forest-ink)',
              borderRadius: 'var(--radius-buttons)',
            }}
          >
            COORDINATOR MODE
          </span>

          <span className="text-xs font-medium text-[var(--color-pencil-gray)] hidden sm:inline">
            · Coordinator Workspace
          </span>
        </div>

        {/* Compact stats line (Single compact line; full stat cards live only on Dashboard) */}
        <div className="text-xs font-mono text-[var(--color-forest-ink)] flex items-center gap-2">
          {stats.loading ? (
            <span className="text-[var(--color-pencil-gray)] animate-pulse">—</span>
          ) : (
            <span>
              <strong className="font-bold">{stats.total}</strong> members
              <span className="text-[var(--color-pencil-gray)] mx-1.5">·</span>
              <span className="text-[var(--color-forest-ink)]/80">{stats.design} Design</span>
              <span className="text-[var(--color-pencil-gray)] mx-1">·</span>
              <span className="text-[var(--color-forest-ink)]/80">{stats.content} Content</span>
              <span className="text-[var(--color-pencil-gray)] mx-1.5">·</span>
              <strong className="font-bold text-[var(--color-forest-ink)]">{stats.totalPoints.toLocaleString()}</strong> pts
            </span>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          Main Responsive Layout Shell
          ═══════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* ───────────────────────────────────────────
            R1. Desktop Sidebar Navigation (md+)
            ─────────────────────────────────────────── */}
        <aside
          aria-label="Coordinator Navigation"
          className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 sticky top-20 z-20 gap-4 p-3 rounded-2xl border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] shadow-xs"
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.name} className="flex flex-col gap-1">
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 text-[var(--color-pencil-gray)]"
              >
                {group.name}
              </span>
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all btn-spring text-left ${
                      isActive
                        ? 'bg-[var(--color-sticky-note-mint)] border border-[var(--color-forest-ink)] text-[var(--color-forest-ink)] font-bold shadow-2xs'
                        : 'text-[var(--color-forest-ink)]/80 hover:bg-black/5 border border-transparent font-medium'
                    }`}
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    <Icon icon={item.icon} width={16} height={16} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* ───────────────────────────────────────────
            Desktop Main View Pane (md+)
            ─────────────────────────────────────────── */}
        <main className="hidden md:block flex-1 min-w-0 w-full">
          {renderSectionContent(activeTab)}
        </main>

        {/* ───────────────────────────────────────────
            R1. Mobile Accordion Navigation (<md)
            ─────────────────────────────────────────── */}
        <div className="md:hidden w-full flex flex-col gap-2.5">
          {ALL_ITEMS.map((item) => {
            const isOpen = activeTab === item.id;
            return (
              <div key={item.id} className="w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-expanded={isOpen}
                  aria-current={isOpen ? 'page' : undefined}
                  className="w-full flex items-center gap-2.5 p-3 cursor-pointer btn-spring transition-colors"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    backgroundColor: isOpen ? 'var(--color-sticky-note-mint)' : 'var(--color-cream-paper)',
                    border: '1px solid var(--color-forest-ink)',
                    borderRadius: isOpen
                      ? 'var(--radius-cards) var(--radius-cards) 0 0'
                      : 'var(--radius-cards)',
                    color: 'var(--color-forest-ink)',
                  }}
                >
                  <Icon icon={item.icon} width={18} height={18} className="shrink-0" />
                  <span className="text-xs font-bold flex-1 text-left">{item.label}</span>
                  <Icon
                    icon="doodle:chevron-down"
                    width={16}
                    height={16}
                    className="shrink-0"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 200ms ease-out',
                    }}
                  />
                </button>

                {isOpen && (
                  <div
                    style={{
                      borderLeft: '1px solid var(--color-forest-ink)',
                      borderRight: '1px solid var(--color-forest-ink)',
                      borderBottom: '1px solid var(--color-forest-ink)',
                      borderRadius: '0 0 var(--radius-cards) var(--radius-cards)',
                      backgroundColor: 'var(--color-cream-paper)',
                    }}
                    className="p-3 animate-fadeIn"
                  >
                    {renderSectionContent(item.id)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
