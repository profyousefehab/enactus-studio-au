import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import { useSessionFeedback } from '../../context/SessionFeedbackContext';
import { useGoldenQuestion } from '../../context/GoldenQuestionContext';
import SketchCallout from '../ui/SketchCallout';

interface DashboardStats {
  total: number;
  design: number;
  content: number;
  totalPoints: number;
  avgPoints: number;
  unpairedCount: number;
  loading: boolean;
}

interface DashboardHomeProps {
  onNavigateTab: (tabId: 'members' | 'attendance' | 'points' | 'golden-question' | 'feedback-session' | 'wall-drop' | 'picker' | 'feedback') => void;
}

export default function DashboardHome({ onNavigateTab }: DashboardHomeProps) {
  const { feedbackSettings } = useSessionFeedback();
  const { activeQuestion } = useGoldenQuestion();

  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    design: 0,
    content: 0,
    totalPoints: 0,
    avgPoints: 0,
    unpairedCount: 0,
    loading: true,
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const allMembers = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((u) => u.role !== 'admin' && u.role !== 'hr' && u.name?.trim().toLowerCase() !== 'yousef ehab');

      const total = allMembers.length;
      const design = allMembers.filter((m) => m.track === 'Design').length;
      const content = allMembers.filter((m) => m.track === 'Content').length;
      const totalPoints = allMembers.reduce((sum, m) => sum + (m.points || 0), 0);
      const avgPoints = total > 0 ? Math.round(totalPoints / total) : 0;
      const unpairedCount = allMembers.filter((m) => !m.feedbackPartnerId).length;

      setStats({
        total,
        design,
        content,
        totalPoints,
        avgPoints,
        unpairedCount,
        loading: false,
      });
    });

    return unsub;
  }, []);

  // Attention items evaluated from real Firestore data
  const attentionItems = [];

  if (!stats.loading && stats.unpairedCount > 0) {
    attentionItems.push({
      id: 'unpaired',
      category: 'PEOPLE',
      title: `${stats.unpairedCount} member${stats.unpairedCount !== 1 ? 's' : ''} still unpaired`,
      description: 'Members need an assigned peer partner for bi-weekly cross-track feedback.',
      actionLabel: 'Go to Pairing →',
      targetTab: 'feedback' as const,
      color: 'var(--color-sticky-note-teal)',
      icon: 'doodle:users',
    });
  }

  if (!feedbackSettings?.isOpen) {
    attentionItems.push({
      id: 'feedback-inactive',
      category: 'LIVE SESSION',
      title: 'Feedback session is inactive',
      description: 'Activate real-time 1–5 star ratings so members can submit their thoughts today.',
      actionLabel: 'Collect feedback →',
      targetTab: 'feedback-session' as const,
      color: 'var(--color-sticky-note-blush)',
      icon: 'doodle:star',
    });
  }

  if (activeQuestion?.isActive && !activeQuestion?.winnerId) {
    attentionItems.push({
      id: 'quiz-live',
      category: 'LIVE SESSION',
      title: 'Golden Question ⚡ is live now',
      description: `"${activeQuestion.question}" · ${activeQuestion.points} PTS awaiting first winner!`,
      actionLabel: 'View live quiz →',
      targetTab: 'golden-question' as const,
      color: 'var(--color-highlighter-yellow)',
      icon: 'fluent-emoji-flat:high-voltage',
    });
  } else if (!activeQuestion?.isActive && activeQuestion?.winnerName) {
    attentionItems.push({
      id: 'quiz-solved',
      category: 'QUIZ',
      title: `Last quiz solved by ${activeQuestion.winnerName}`,
      description: `Awarded +${activeQuestion.points} PTS. Ready to launch another Golden Question.`,
      actionLabel: 'Launch quiz →',
      targetTab: 'golden-question' as const,
      color: 'var(--color-sticky-note-mint)',
      icon: 'fluent-emoji-flat:trophy',
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ───── Section Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-pencil-gray)]/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-forest-ink)]"
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              Session Overview
            </h2>
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--color-forest-ink)]"
              style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
            >
              COORDINATOR HOME
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-pencil-gray)]" style={{ fontFamily: 'var(--font-inter)' }}>
            Real-time committee pulse, day-of-session shortcuts, and pending operational tasks.
          </p>
        </div>

        <SketchCallout
          text="daily session hub ⤵"
          arrow="down-right"
          color="#cb5521"
          rotate="-rotate-2"
          fontSize={19}
        />
      </div>

      {/* ───── 4 Key Stat Cards (Single source of truth) ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Members */}
        <div
          className="p-4 rounded-xl border border-[var(--color-forest-ink)] flex flex-col justify-between shadow-2xs card-spring"
          style={{ backgroundColor: 'var(--color-cream-paper)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[var(--color-pencil-gray)] font-bold">
              Total Members
            </span>
            <Icon icon="doodle:users" width={18} height={18} className="text-[var(--color-forest-ink)] opacity-70" />
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[var(--color-forest-ink)] leading-none">
              {stats.loading ? '—' : stats.total}
            </span>
          </div>
          <span className="text-xs font-inter text-[var(--color-pencil-gray)]">
            active committee members
          </span>
        </div>

        {/* Design Track */}
        <div
          className="p-4 rounded-xl border border-[var(--color-forest-ink)] flex flex-col justify-between shadow-2xs card-spring"
          style={{ backgroundColor: 'var(--color-sticky-note-teal)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[var(--color-forest-ink)]/80 font-bold">
              Design Track
            </span>
            <Icon icon="doodle:brush" width={18} height={18} className="text-[var(--color-forest-ink)] opacity-70" />
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[var(--color-forest-ink)] leading-none">
              {stats.loading ? '—' : stats.design}
            </span>
          </div>
          <span className="text-xs font-inter text-[var(--color-forest-ink)]/80">
            visual designers & creatives
          </span>
        </div>

        {/* Content Track */}
        <div
          className="p-4 rounded-xl border border-[var(--color-forest-ink)] flex flex-col justify-between shadow-2xs card-spring"
          style={{ backgroundColor: 'var(--color-sticky-note-mint)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[var(--color-forest-ink)]/80 font-bold">
              Content Track
            </span>
            <Icon icon="doodle:file-text" width={18} height={18} className="text-[var(--color-forest-ink)] opacity-70" />
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[var(--color-forest-ink)] leading-none">
              {stats.loading ? '—' : stats.content}
            </span>
          </div>
          <span className="text-xs font-inter text-[var(--color-forest-ink)]/80">
            copywriters & storytellers
          </span>
        </div>

        {/* Total Points */}
        <div
          className="p-4 rounded-xl border border-[var(--color-forest-ink)] flex flex-col justify-between shadow-2xs card-spring"
          style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[var(--color-forest-ink)] font-bold">
              Total Points
            </span>
            <Icon icon="doodle:star" width={18} height={18} className="text-[var(--color-forest-ink)] opacity-70" />
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[var(--color-forest-ink)] leading-none">
              {stats.loading ? '—' : stats.totalPoints.toLocaleString()}
            </span>
          </div>
          <span className="text-xs font-inter text-[var(--color-forest-ink)]">
            avg {stats.loading ? '—' : stats.avgPoints} pts / member
          </span>
        </div>
      </div>

      {/* ───── Session Day Quick Actions ───── */}
      <div
        className="p-4 sm:p-5 rounded-2xl border border-[var(--color-forest-ink)] bg-white/70 shadow-xs flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="doodle:zap" width={18} height={18} className="text-[var(--color-forest-ink)]" />
            <h3
              className="text-sm font-bold uppercase tracking-wider text-[var(--color-forest-ink)] font-mono"
            >
              Session Day Quick Actions
            </h3>
          </div>
          <span className="text-xs font-inter text-[var(--color-pencil-gray)] hidden sm:inline">
            4 core coordinator workflows
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Action 1: Take attendance */}
          <button
            type="button"
            onClick={() => onNavigateTab('attendance')}
            className="p-3 sm:p-4 rounded-xl border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] hover:bg-[var(--color-sticky-note-mint)] transition-all cursor-pointer text-left btn-spring flex flex-col gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Icon icon="doodle:clipboard" width={16} height={16} className="text-[var(--color-forest-ink)]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[var(--color-forest-ink)] font-inter">
                Take attendance
              </p>
              <p className="text-[11px] text-[var(--color-pencil-gray)] font-inter line-clamp-1">
                Log presence & streaks
              </p>
            </div>
          </button>

          {/* Action 2: Launch quiz */}
          <button
            type="button"
            onClick={() => onNavigateTab('golden-question')}
            className="p-3 sm:p-4 rounded-xl border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] hover:bg-[var(--color-highlighter-yellow)] transition-all cursor-pointer text-left btn-spring flex flex-col gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg border border-[var(--color-forest-ink)] bg-[var(--color-highlighter-yellow)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Icon icon="doodle:zap" width={16} height={16} className="text-[var(--color-forest-ink)]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[var(--color-forest-ink)] font-inter">
                Launch quiz
              </p>
              <p className="text-[11px] text-[var(--color-pencil-gray)] font-inter line-clamp-1">
                Golden Question ⚡
              </p>
            </div>
          </button>

          {/* Action 3: Collect feedback */}
          <button
            type="button"
            onClick={() => onNavigateTab('feedback-session')}
            className="p-3 sm:p-4 rounded-xl border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] hover:bg-[var(--color-sticky-note-blush)] transition-all cursor-pointer text-left btn-spring flex flex-col gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-blush)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Icon icon="doodle:star" width={16} height={16} className="text-[var(--color-forest-ink)]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[var(--color-forest-ink)] font-inter">
                Collect feedback
              </p>
              <p className="text-[11px] text-[var(--color-pencil-gray)] font-inter line-clamp-1">
                Live star ratings
              </p>
            </div>
          </button>

          {/* Action 4: Post a drop */}
          <button
            type="button"
            onClick={() => onNavigateTab('wall-drop')}
            className="p-3 sm:p-4 rounded-xl border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] hover:bg-[var(--color-sticky-note-teal)] transition-all cursor-pointer text-left btn-spring flex flex-col gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-teal)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Icon icon="doodle:megaphone" width={16} height={16} className="text-[var(--color-forest-ink)]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[var(--color-forest-ink)] font-inter">
                Post a drop
              </p>
              <p className="text-[11px] text-[var(--color-pencil-gray)] font-inter line-clamp-1">
                Broadcast to Wall
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ───── Needs Your Attention (Driven by Real Firestore Data) ───── */}
      <div
        className="p-4 sm:p-5 rounded-2xl border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] shadow-xs flex flex-col gap-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-pencil-gray)]/30">
          <div className="flex items-center gap-2">
            <Icon icon="doodle:check-circle" width={18} height={18} className="text-[var(--color-forest-ink)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-forest-ink)] font-mono">
              Needs Your Attention
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--color-pencil-gray)]">
            {stats.loading ? 'Checking...' : `${attentionItems.length} item${attentionItems.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {stats.loading ? (
          <div className="p-6 text-center">
            <p className="text-xs font-mono text-[var(--color-pencil-gray)] animate-pulse">
              Inspecting session operations...
            </p>
          </div>
        ) : attentionItems.length === 0 ? (
          /* Honest Empty State */
          <div className="p-6 text-center rounded-xl border border-dashed border-[var(--color-pencil-gray)] bg-white/50 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] flex items-center justify-center mb-2">
              <Icon icon="doodle:check" width={20} height={20} className="text-[var(--color-forest-ink)]" />
            </div>
            <p className="text-sm font-bold text-[var(--color-forest-ink)] font-inter">
              All clear! Session operations are running smoothly.
            </p>
            <p className="text-xs text-[var(--color-pencil-gray)] font-inter mt-0.5">
              No pending pairings, uncollected feedback, or unanswered quiz questions need immediate coordinator attention.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-[var(--color-forest-ink)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs card-spring"
                style={{ backgroundColor: item.color }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-[var(--color-forest-ink)] bg-white/80 flex items-center justify-center shrink-0">
                    <Icon icon={item.icon} width={18} height={18} className="text-[var(--color-forest-ink)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/10 text-[var(--color-forest-ink)]">
                        {item.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--color-forest-ink)] font-inter">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs text-[var(--color-forest-ink)]/80 font-inter mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab(item.targetTab)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-[var(--color-forest-ink)] bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)] hover:opacity-90 transition-opacity cursor-pointer btn-spring whitespace-nowrap self-start sm:self-auto shrink-0 shadow-2xs"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {item.actionLabel}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
