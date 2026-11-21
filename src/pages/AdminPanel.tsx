import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../lib/firebase';
import BricolageHeadline from '../components/ui/BricolageHeadline';
import MembersRoster from '../components/admin/MembersRoster';
import SessionFeedbackManager from '../components/admin/SessionFeedbackManager';
import WallDropPublisher from '../components/admin/WallDropPublisher';
import AttendanceLogger from '../components/admin/AttendanceLogger';
import FeedbackPairer from '../components/admin/FeedbackPairer';
import RandomPicker from '../components/admin/RandomPicker';

interface SectionConfig {
  id: string;
  title: string;
  icon: string;
}

interface Props {
  initialTab?: 'all' | 'members' | 'attendance' | 'feedback-session' | 'wall-drop' | 'picker' | 'feedback';
}

export default function AdminPanel({ initialTab }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const startingTab = initialTab || (location.pathname === '/admin/members' ? 'members' : 'all');
  const [activeTab, setActiveTab] = useState<'all' | 'members' | 'attendance' | 'feedback-session' | 'wall-drop' | 'picker' | 'feedback'>(startingTab);
  const [mobileTab, setMobileTab] = useState<string>(startingTab === 'all' ? 'members' : startingTab);
  const [stats, setStats] = useState({ total: 0, design: 0, content: 0 });

  // Sync tab if URL changes or initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setMobileTab(initialTab);
    } else if (location.pathname === '/admin/members') {
      setActiveTab('members');
      setMobileTab('members');
    }
  }, [initialTab, location.pathname]);

  // Add class to body to allow desktop layout expansion to 1024px
  useEffect(() => {
    document.body.classList.add('in-admin');
    return () => {
      document.body.classList.remove('in-admin');
    };
  }, []);

  // Fetch committee member counts (excluding admin coordinator)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const members = snap.docs
        .map((d) => d.data())
        .filter((u: any) => u.role !== 'admin' && u.name?.trim().toLowerCase() !== 'yousef ehab');

      setStats({
        total: members.length,
        design: members.filter((m: any) => m.track === 'Design').length,
        content: members.filter((m: any) => m.track === 'Content').length,
      });
    });
    return unsub;
  }, []);

  const navTabs: SectionConfig[] = [
    { id: 'all', title: 'Dashboard (Grid)', icon: 'doodle:dashboard' },
    { id: 'members', title: 'Members Roster', icon: 'doodle:users' },
    { id: 'attendance', title: 'Attendance & Points', icon: 'doodle:clipboard' },
    { id: 'feedback-session', title: 'Session Feedback', icon: 'doodle:star' },
    { id: 'wall-drop', title: 'Wall Drops', icon: 'doodle:megaphone' },
    { id: 'picker', title: 'Random Picker', icon: 'doodle:dice' },
    { id: 'feedback', title: 'Feedback Pairing', icon: 'doodle:users' },
  ];

  return (
    <div className="p-4 sm:p-6 admin-container max-w-[1024px] mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-4 border-b border-[var(--color-pencil-gray)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-semibold px-2.5 py-1 rounded cursor-pointer btn-spring inline-flex items-center gap-1.5"
              style={{
                fontFamily: 'var(--font-inter)',
                color: 'var(--color-forest-ink)',
                backgroundColor: 'var(--color-cream-paper)',
                border: '1px solid var(--color-pencil-gray)',
              }}
            >
              <span>← Team Wall</span>
            </button>
            <span
              className="text-[11px] font-mono px-2 py-0.5"
              style={{
                backgroundColor: 'var(--color-highlighter-yellow)',
                color: 'var(--color-forest-ink)',
                borderRadius: 'var(--radius-buttons)',
              }}
            >
              COORDINATOR MODE
            </span>
          </div>

          <BricolageHeadline highlight={['Admin']} className="text-3xl sm:text-4xl">
            Admin Panel
          </BricolageHeadline>
          <p
            className="text-xs sm:text-sm mt-1"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}
          >
            Social Media & Design Track Management Workstation
          </p>
        </div>

        {/* Live Committee Stats Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveTab('members');
              setMobileTab('members');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer btn-spring hover:bg-[var(--color-sticky-note-mint)] transition-colors"
            style={{
              backgroundColor: activeTab === 'members' ? 'var(--color-sticky-note-mint)' : 'var(--color-cream-paper)',
              border: '1.5px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-buttons)',
            }}
            title="View Members Directory"
          >
            <span
              className="text-xs font-semibold"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)' }}
            >
              {stats.total}
            </span>
            <span
              className="text-[11px] flex items-center gap-1"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
            >
              Members →
            </span>
          </button>

          <div
            className="flex items-center gap-1.5 px-3 py-1.5"
            style={{
              backgroundColor: 'var(--color-sticky-note-mint)',
              border: '1px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-buttons)',
            }}
          >
            <span
              className="text-xs font-semibold"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)' }}
            >
              {stats.design}
            </span>
            <span
              className="text-[11px]"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
            >
              Design
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1.5"
            style={{
              backgroundColor: 'var(--color-sticky-note-teal)',
              border: '1px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-buttons)',
            }}
          >
            <span
              className="text-xs font-semibold"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)' }}
            >
              {stats.content}
            </span>
            <span
              className="text-[11px]"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
            >
              Content
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Tabs (Hidden on mobile) */}
      <div className="hidden md:flex gap-1.5 p-1.5 rounded-xl border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] mb-6 shadow-sm">
        {navTabs.map((s) => {
          const isActive = activeTab === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id as any)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all btn-spring"
              style={{
                fontFamily: 'var(--font-inter)',
                backgroundColor: isActive ? 'var(--color-sticky-note-mint)' : 'transparent',
                border: isActive ? '1.5px solid var(--color-forest-ink)' : '1px solid transparent',
                color: 'var(--color-forest-ink)',
              }}
            >
              <Icon icon={s.icon} width={15} height={15} className="shrink-0" />
              <span>{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════
          Desktop Views (md+)
          ═══════════════════════════════════════════ */}
      <div className="hidden md:block">
        {/* Full 2-Column Dashboard Grid */}
        {activeTab === 'all' && (
          <div className="flex flex-col gap-6">
            {/* Quick jump to Members Directory banner */}
            <div
              className="p-4 rounded-xl border border-[var(--color-forest-ink)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
              style={{ backgroundColor: 'var(--color-cream-paper)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full border border-[var(--color-forest-ink)] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
                >
                  <Icon icon="doodle:users" width={22} height={22} style={{ color: 'var(--color-forest-ink)' }} />
                </div>
                <div>
                  <h4
                    className="text-sm font-bold text-[var(--color-forest-ink)]"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Committee Members Directory
                  </h4>
                  <p
                    className="text-xs text-[var(--color-pencil-gray)]"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    View member PIN IDs, live leaderboard ranks, score ledger, and point adjustments.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className="px-3.5 py-2 text-xs font-bold rounded-lg border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] hover:opacity-90 transition-opacity cursor-pointer btn-spring whitespace-nowrap shrink-0"
                style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
              >
                Open Members Roster ({stats.total}) →
              </button>
            </div>

            {/* Section: Attendance & Quick Points */}
            <section aria-label="Attendance & Points">
              <AttendanceLogger />
            </section>

            {/* Section: Live Session Feedback Manager */}
            <section aria-label="Session Feedback">
              <SessionFeedbackManager />
            </section>

            {/* 2-Column Grid for Drops and Interactive Session Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left Column: Wall Drop Publisher */}
              <div className="flex flex-col gap-6">
                <WallDropPublisher />
              </div>

              {/* Right Column: Random Picker & Feedback Pairing */}
              <div className="flex flex-col gap-6">
                <RandomPicker />
                <FeedbackPairer />
              </div>
            </div>
          </div>
        )}

        {/* Individual Focused Tab Views */}
        {activeTab === 'members' && <MembersRoster />}
        {activeTab === 'attendance' && <AttendanceLogger />}
        {activeTab === 'feedback-session' && <SessionFeedbackManager />}
        {activeTab === 'wall-drop' && <WallDropPublisher />}
        {activeTab === 'picker' && <RandomPicker />}
        {activeTab === 'feedback' && <FeedbackPairer />}
      </div>

      {/* ═══════════════════════════════════════════
          Mobile Accordion View (<md)
          ═══════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col gap-3">
        {[
          {
            id: 'members',
            title: 'Members Directory & Roster',
            icon: 'doodle:users',
            component: <MembersRoster />,
          },
          {
            id: 'attendance',
            title: 'Attendance & Points',
            icon: 'doodle:clipboard',
            component: <AttendanceLogger />,
          },
          {
            id: 'feedback-session',
            title: 'Live Session Feedback',
            icon: 'doodle:star',
            component: <SessionFeedbackManager />,
          },
          {
            id: 'wall-drop',
            title: 'Wall Drops',
            icon: 'doodle:megaphone',
            component: <WallDropPublisher />,
          },
          {
            id: 'picker',
            title: 'Random Picker',
            icon: 'doodle:dice',
            component: <RandomPicker />,
          },
          {
            id: 'feedback',
            title: 'Feedback Pairing',
            icon: 'doodle:users',
            component: <FeedbackPairer />,
          },
        ].map((section) => {
          const isOpen = mobileTab === section.id;
          return (
            <div key={section.id}>
              <button
                onClick={() => setMobileTab(isOpen ? '' : section.id)}
                className="w-full flex items-center gap-2.5 p-3 cursor-pointer btn-spring"
                style={{
                  fontFamily: 'var(--font-inter)',
                  backgroundColor: isOpen ? 'var(--color-sticky-note-mint)' : 'var(--color-cream-paper)',
                  border: '1px solid var(--color-forest-ink)',
                  borderRadius: isOpen
                    ? 'var(--radius-cards) var(--radius-cards) 0 0'
                    : 'var(--radius-cards)',
                  color: 'var(--color-forest-ink)',
                  transition: 'background-color 150ms ease-out',
                }}
              >
                <Icon icon={section.icon} width={18} height={18} className="shrink-0" />
                <span className="text-sm font-bold flex-1 text-left">{section.title}</span>
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
                  className="p-3"
                >
                  {section.component}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
