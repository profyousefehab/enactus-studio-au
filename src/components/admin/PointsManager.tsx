import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import SketchCallout from '../ui/SketchCallout';

interface Member {
  id: string;
  name: string;
  pinCode: string;
  avatarId: string;
  customAvatarUrl?: string | null;
  track: 'Design' | 'Content';
  role: string;
  points: number;
  sessionStreak: number;
  bestStreak: number;
}

const POINT_ACTIONS = [
  { label: '+20 Task Completed', amount: 20, bg: 'var(--color-sticky-note-mint)' },
  { label: '+10 Session', amount: 10, bg: 'var(--color-highlighter-yellow)' },
  { label: '+15 Initiative', amount: 15, bg: 'var(--color-sticky-note-teal)' },
  { label: '\u221210 Missed Deadline', amount: -10, bg: 'var(--color-sticky-note-blush)', isNegative: true },
];

export default function PointsManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState<'All' | 'Design' | 'Content'>('All');

  // Direct Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Action status
  const [isApplying, setIsApplying] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Custom Point input state
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  // Fetch committee members
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Member))
        .filter((m) => m.role !== 'admin' && m.role !== 'hr' && m.name?.trim().toLowerCase() !== 'yousef ehab');
      data.sort((a, b) => (b.points || 0) - (a.points || 0));
      setMembers(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (trackFilter !== 'All' && m.track !== trackFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = m.name?.toLowerCase().includes(query);
        const matchesPin = m.pinCode?.includes(query);
        return matchesName || matchesPin;
      }
      return true;
    });
  }, [members, trackFilter, searchQuery]);

  // Toggle selection for a single member
  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Quick Select Helpers
  function selectAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredMembers.forEach((m) => next.add(m.id));
      return next;
    });
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  // Apply Points Action
  async function handleAwardPoints(amount: number, reason: string) {
    if (selectedIds.size === 0 || isApplying) return;

    setIsApplying(true);
    setSuccessNotice(null);

    try {
      const targets = Array.from(selectedIds);
      for (const userId of targets) {
        // Log point event
        await addDoc(collection(db, 'pointEvents'), {
          userId,
          amount,
          reason,
          createdAt: Timestamp.now(),
        });

        // Update user score
        await updateDoc(doc(db, 'users', userId), {
          points: increment(amount),
        });
      }

      setSuccessNotice(`✓ Awarded ${amount > 0 ? `+${amount}` : amount} PTS to ${targets.length} member${targets.length !== 1 ? 's' : ''}!`);
      setSelectedIds(new Set());
      setShowCustomInput(false);
      setCustomAmount('');

      setTimeout(() => {
        setSuccessNotice(null);
      }, 4000);
    } catch (err: any) {
      console.error('Error applying points:', err);
      alert('Failed to apply points: ' + (err?.message || err));
    } finally {
      setIsApplying(false);
    }
  }

  // Apply Custom Points
  function handleApplyCustom(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseInt(customAmount, 10);
    if (isNaN(parsed) || parsed === 0) {
      alert('Please enter a valid positive or negative integer.');
      return;
    }
    handleAwardPoints(parsed, `Manual adjustment (${parsed > 0 ? '+' : ''}${parsed} PTS)`);
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-mono animate-pulse text-[var(--color-pencil-gray)]">
          Loading committee members...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-44 sm:pb-36">
      {/* ───── In-Page Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-pencil-gray)]/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-forest-ink)]"
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              Score Adjustment & Points
            </h2>
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--color-forest-ink)]"
              style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
            >
              SCORE LEDGER
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-pencil-gray)]" style={{ fontFamily: 'var(--font-inter)' }}>
            Select members directly from the list below and apply score adjustments using the action bar.
          </p>
        </div>

        <SketchCallout
          text="select members to award points ⤵"
          arrow="down-right"
          color="#cb5521"
          rotate="-rotate-2"
          fontSize={18}
        />
      </div>

      {/* ───── Filter & Search Bar ───── */}
      <div
        className="p-3.5 sm:p-4 rounded-2xl border border-[var(--color-forest-ink)] bg-white/70 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Icon
              icon="doodle:search"
              width={16}
              height={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-pencil-gray)] pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member name or PIN..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-[var(--color-cream-paper)] text-[var(--color-forest-ink)]"
              style={{ fontFamily: 'var(--font-inter)' }}
            />
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold underline text-[var(--color-pencil-gray)] hover:text-[var(--color-forest-ink)] cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Track Filter Pills & Quick Select */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--color-pencil-gray)] bg-[var(--color-cream-paper)]">
            {(['All', 'Design', 'Content'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTrackFilter(t)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                  trackFilter === t
                    ? 'bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)] shadow-2xs'
                    : 'text-[var(--color-forest-ink)] hover:bg-black/5'
                }`}
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={selectAllFiltered}
              className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg border border-[var(--color-pencil-gray)] bg-white text-[var(--color-forest-ink)] hover:bg-gray-50 cursor-pointer btn-spring"
            >
              Select All ({filteredMembers.length})
            </button>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={deselectAll}
                className="px-2.5 py-1 text-xs font-mono rounded-lg border border-[var(--color-terracotta)] text-[var(--color-terracotta)] hover:bg-[#ffebe6] cursor-pointer btn-spring"
              >
                Clear ({selectedIds.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successNotice && (
        <div className="p-3 rounded-xl border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)] text-xs font-bold font-mono animate-fadeIn flex items-center justify-between">
          <span>{successNotice}</span>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-[var(--color-forest-ink)] hover:opacity-70 cursor-pointer"
          >
            <Icon icon="doodle:close" width={14} height={14} />
          </button>
        </div>
      )}

      {/* ───── Member Selection Grid ───── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]">
            Committee Directory ({filteredMembers.length} members)
          </span>
          <span className="text-xs font-mono text-[var(--color-pencil-gray)]">
            {selectedIds.size} checked
          </span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-[var(--color-pencil-gray)] bg-white/60">
            <p className="text-sm font-bold text-[var(--color-forest-ink)] font-inter">
              No matching members found.
            </p>
            <p className="text-xs text-[var(--color-pencil-gray)] font-inter mt-0.5">
              Try adjusting your search query or track filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredMembers.map((member) => {
              const isSelected = selectedIds.has(member.id);

              return (
                <div
                  key={member.id}
                  onClick={() => toggleSelection(member.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none card-spring flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'border-2 border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-teal)]/70 shadow-xs'
                      : 'border-[var(--color-pencil-gray)] bg-white hover:border-[var(--color-forest-ink)]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <StudioAvatar
                        avatarId={member.avatarId}
                        customAvatarUrl={member.customAvatarUrl}
                        size={32}
                      />
                      <div className="min-w-0">
                        <p
                          className="text-xs font-bold truncate text-[var(--color-forest-ink)]"
                          style={{ fontFamily: 'var(--font-inter)' }}
                        >
                          {member.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <TrackBadge track={member.track} size="sm" />
                          <span className="text-[10px] font-mono text-[var(--color-pencil-gray)]">
                            {member.sessionStreak}🔥
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Checkbox indicator */}
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-[var(--color-forest-ink)] bg-[var(--color-forest-ink)] text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Icon icon="doodle:check" width={13} height={13} />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--color-forest-ink)]/10">
                    <span className="text-[11px] font-mono text-[var(--color-pencil-gray)]">Score</span>
                    <span className="font-mono font-bold text-[var(--color-forest-ink)]">
                      {member.points} PTS
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ───── STICKY BOTTOM ACTION BAR (Shown only when members are selected) ───── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-6 md:left-8 md:right-8 z-40 max-w-7xl mx-auto animate-fadeIn">
          <div
            className="p-3 sm:p-4 rounded-2xl border-2 border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
          >
            {/* Selected Count & Helpers */}
            <div className="flex items-center gap-3 justify-between md:justify-start">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-xs sm:text-sm font-mono font-bold text-[var(--color-forest-ink)]">
                  {selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''} selected
                </span>
              </div>

              <button
                type="button"
                onClick={deselectAll}
                className="min-h-[44px] px-3 py-1.5 text-xs font-semibold underline text-[var(--color-terracotta)] hover:opacity-80 cursor-pointer flex items-center"
              >
                Deselect
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {POINT_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={isApplying}
                  onClick={() =>
                    handleAwardPoints(
                      action.amount,
                      action.label.replace(/^[+\u2212]\d+\s*/, '')
                    )
                  }
                  className={`min-h-[44px] px-3.5 py-2 text-xs font-mono font-bold rounded-xl border border-[var(--color-forest-ink)] cursor-pointer btn-spring transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center ${
                    action.isNegative ? 'text-[var(--color-terracotta)]' : 'text-[var(--color-forest-ink)]'
                  }`}
                  style={{
                    backgroundColor: action.bg,
                  }}
                >
                  {action.label}
                </button>
              ))}

              {/* Custom Action Toggle */}
              <button
                type="button"
                disabled={isApplying}
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="min-h-[44px] px-3.5 py-2 text-xs font-mono font-bold rounded-xl border border-[var(--color-forest-ink)] bg-white text-[var(--color-forest-ink)] hover:bg-gray-50 cursor-pointer btn-spring disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                Custom...
              </button>
            </div>
          </div>

          {/* Custom Amount Sub-Bar */}
          {showCustomInput && (
            <form
              onSubmit={handleApplyCustom}
              className="mt-2 p-3 rounded-xl border-2 border-[var(--color-forest-ink)] bg-white shadow-lg flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2.5 w-full sm:max-w-md sm:ml-auto animate-fadeIn"
            >
              <span className="text-xs font-bold text-[var(--color-forest-ink)] font-inter shrink-0">
                Amount (+ or −):
              </span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="e.g. 25 or -10"
                autoFocus
                className="flex-1 sm:flex-none min-w-[110px] w-28 min-h-[44px] text-xs p-2 rounded-lg border border-[var(--color-pencil-gray)] font-mono text-center focus:border-[var(--color-forest-ink)] focus:outline-none shrink-0"
              />
              <button
                type="submit"
                disabled={!customAmount.trim() || isApplying}
                className="min-h-[44px] px-4 py-2 text-xs font-bold rounded-lg border border-[var(--color-forest-ink)] bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)] hover:opacity-90 cursor-pointer disabled:opacity-40 shrink-0 flex items-center justify-center"
              >
                Apply
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
