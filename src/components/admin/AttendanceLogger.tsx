import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import { useSessionFeedback } from '../../context/SessionFeedbackContext';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import { isExcludedMember } from '../../utils/accounts';
import StickerIcon from '../ui/StickerIcon';
import SketchCallout from '../ui/SketchCallout';

interface Member {
  id: string;
  name: string;
  nameLower?: string;
  avatarId: string;
  customAvatarUrl?: string | null;
  track: 'Design' | 'Content';
  role: string;
  points: number;
  sessionStreak: number;
  bestStreak: number;
}

type AttendanceStatus = 'present' | 'absent' | 'excused' | null;

const POINT_PRESETS = [
  { label: '+20 Task Completed', amount: 20 },
  { label: '+10 Session', amount: 10 },
  { label: '+15 Initiative', amount: 15 },
  { label: '\u221210 Missed Deadline', amount: -10 },
  { label: 'Custom', amount: 0 },
];

const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  present: { icon: 'doodle:check', label: 'Present', color: 'var(--color-sticky-note-mint)' },
  absent: { icon: 'doodle:x', label: 'Absent', color: '#fecaca' },
  excused: { icon: 'doodle:minus', label: 'Excused', color: 'var(--color-highlighter-yellow)' },
};

export default function AttendanceLogger() {
  const { activateFeedback } = useSessionFeedback();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Attendance
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [loggingAttendance, setLoggingAttendance] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);
  const [lastLoggedTitle, setLastLoggedTitle] = useState('');
  const [feedbackActivated, setFeedbackActivated] = useState(false);

  // Points
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [presetIdx, setPresetIdx] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [applyingPoints, setApplyingPoints] = useState(false);
  const [pointsSuccess, setPointsSuccess] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Member))
        .filter((m) => !isExcludedMember(m));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setMembers(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  function setStatus(memberId: string, status: AttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [memberId]: prev[memberId] === status ? null : status }));
  }

  function markAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {};
    for (const m of members) {
      next[m.id] = status;
    }
    setStatuses(next);
  }

  function toggleMember(id: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAllMembers(track?: 'Design' | 'Content') {
    if (track) {
      const ids = members.filter((m) => m.track === track).map((m) => m.id);
      setSelectedMembers((prev) => new Set([...prev, ...ids]));
    } else {
      setSelectedMembers(new Set(members.map((m) => m.id)));
    }
  }

  function clearMemberSelection() {
    setSelectedMembers(new Set());
  }

  async function handleLogAttendance() {
    if (!sessionTitle.trim()) { alert('Enter a session title.'); return; }
    const entries = Object.entries(statuses).filter(([, s]) => s !== null);
    if (entries.length === 0) { alert('Mark at least one member.'); return; }

    setLoggingAttendance(true);
    try {
      for (const [userId, status] of entries) {
        await addDoc(collection(db, 'attendance'), {
          sessionTitle: sessionTitle.trim(),
          userId,
          status,
          sessionDate,
          createdAt: Timestamp.now(),
        });

        const userRef = doc(db, 'users', userId);
        if (status === 'present') {
          const member = members.find((m) => m.id === userId);
          const newStreak = (member?.sessionStreak ?? 0) + 1;
          const newBest = Math.max(newStreak, member?.bestStreak ?? 0);
          await updateDoc(userRef, { sessionStreak: newStreak, bestStreak: newBest });
          await addDoc(collection(db, 'pointEvents'), {
            userId, amount: 10, reason: 'Session Attendance', createdAt: Timestamp.now(),
          });
          await updateDoc(userRef, { points: increment(10) });
        } else if (status === 'absent') {
          await updateDoc(userRef, { sessionStreak: 0 });
        }
      }
      const savedTitle = sessionTitle.trim();
      setLastLoggedTitle(savedTitle);
      setStatuses({});
      setSessionTitle('');
      setAttendanceSuccess(true);
      setTimeout(() => setAttendanceSuccess(false), 8000);
    } catch (err) {
      console.error('Attendance error:', err);
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoggingAttendance(false);
    }
  }

  async function handleApplyPoints() {
    if (selectedMembers.size === 0) { alert('Select at least one member.'); return; }
    const preset = POINT_PRESETS[presetIdx];
    const amount = preset.label === 'Custom' ? parseInt(customAmount) : preset.amount;
    if (isNaN(amount) || amount === 0) { alert('Enter a valid point amount.'); return; }

    setApplyingPoints(true);
    try {
      for (const userId of selectedMembers) {
        await addDoc(collection(db, 'pointEvents'), {
          userId,
          amount,
          reason: preset.label === 'Custom'
            ? `Manual adjustment (${amount > 0 ? '+' : ''}${amount})`
            : preset.label.replace(/^[+\u2212]\d+\s/, ''),
          createdAt: Timestamp.now(),
        });
        await updateDoc(doc(db, 'users', userId), { points: increment(amount) });
      }
      setSelectedMembers(new Set());
      setPointsSuccess(true);
      setTimeout(() => setPointsSuccess(false), 3000);
    } catch (err) {
      console.error('Points error:', err);
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setApplyingPoints(false);
    }
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

  const markedCount = Object.values(statuses).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      {/* ───── In-Page Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-pencil-gray)]/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-forest-ink)]"
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              Session Attendance & Points
            </h2>
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--color-forest-ink)]"
              style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
            >
              OPERATIONS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-pencil-gray)]" style={{ fontFamily: 'var(--font-inter)' }}>
            Mark presence to auto-track streaks and award +10 attendance points, or adjust scores directly.
          </p>
        </div>

        <SketchCallout
          text="pin stays in view while scrolling ⤵"
          arrow="down-right"
          color="#cb5521"
          rotate="-rotate-2"
          fontSize={18}
        />
      </div>

      {/* ───── Shared 2-Column Section Template (Desktop lg+) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (~2/3): Scrollable Member Attendance Checklist + Point Recipients */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          {/* Attendance Checklist Card */}
          <div
            className="p-4 sm:p-5 rounded-2xl border border-[var(--color-forest-ink)] shadow-xs"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-pencil-gray)]/30">
              <div className="flex items-center gap-2">
                <Icon icon="doodle:clipboard" width={18} height={18} className="text-[var(--color-forest-ink)]" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                  Committee Roster ({members.length})
                </span>
              </div>
              <span className="text-xs font-mono font-medium text-[var(--color-pencil-gray)]">
                {markedCount}/{members.length} marked
              </span>
            </div>

            {/* Scrollable list of members */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
              {members.map((m) => {
                const s = statuses[m.id];
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 p-2.5 transition-all card-spring"
                    style={{
                      backgroundColor: s ? STATUS_CONFIG[s].color : 'white',
                      border: s ? '1.5px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
                      borderRadius: 'var(--radius-cards)',
                    }}
                  >
                    <StudioAvatar avatarId={m.avatarId} customAvatarUrl={m.customAvatarUrl} size={32} />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-semibold truncate text-[var(--color-forest-ink)]"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        {m.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <TrackBadge track={m.track} size="sm" />
                        <span className="text-[10px] font-mono text-[var(--color-pencil-gray)]">
                          {m.sessionStreak}🔥
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      {(['present', 'absent', 'excused'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatus(m.id, st)}
                          className="w-7 h-7 flex items-center justify-center cursor-pointer btn-spring"
                          style={{
                            borderRadius: 'var(--radius-buttons)',
                            border: s === st ? '2px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
                            backgroundColor: s === st ? STATUS_CONFIG[st].color : 'var(--color-cream-paper)',
                          }}
                          title={STATUS_CONFIG[st].label}
                          aria-label={`${m.name}: ${STATUS_CONFIG[st].label}`}
                        >
                          <Icon icon={STATUS_CONFIG[st].icon} width={13} height={13} />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Points Recipient Selection Card */}
          <div
            className="p-4 sm:p-5 rounded-2xl border border-[var(--color-forest-ink)] shadow-xs"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-[var(--color-pencil-gray)]/30">
              <div className="flex items-center gap-2">
                <Icon icon="doodle:star" width={18} height={18} className="text-[var(--color-forest-ink)]" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                  Award Points Recipients ({selectedMembers.size} selected)
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => selectAllMembers()}
                  className="px-2 py-0.5 text-xs font-mono rounded border border-[var(--color-pencil-gray)] bg-white text-[var(--color-forest-ink)] hover:bg-gray-50 cursor-pointer btn-spring"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => selectAllMembers('Design')}
                  className="px-2 py-0.5 text-xs font-mono rounded border border-[var(--color-pencil-gray)] bg-white text-[var(--color-forest-ink)] hover:bg-gray-50 cursor-pointer btn-spring"
                >
                  Design
                </button>
                <button
                  type="button"
                  onClick={() => selectAllMembers('Content')}
                  className="px-2 py-0.5 text-xs font-mono rounded border border-[var(--color-pencil-gray)] bg-white text-[var(--color-forest-ink)] hover:bg-gray-50 cursor-pointer btn-spring"
                >
                  Content
                </button>
                {selectedMembers.size > 0 && (
                  <button
                    type="button"
                    onClick={clearMemberSelection}
                    className="px-2 py-0.5 text-xs font-mono rounded border border-[var(--color-terracotta)] text-[var(--color-terracotta)] hover:bg-[#ffebe6] cursor-pointer btn-spring"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
              {members.map((m) => {
                const isSelected = selectedMembers.has(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs cursor-pointer pill-spring"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isSelected ? 'var(--color-sticky-note-teal)' : 'white',
                      border: isSelected ? '1.5px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
                      color: 'var(--color-forest-ink)',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    <StudioAvatar avatarId={m.avatarId} customAvatarUrl={m.customAvatarUrl} size={18} />
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (~1/3): Sticky Controls Rail */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20 z-10 flex flex-col gap-4">
          {/* Attendance Controls Box */}
          <div
            className="p-4 sm:p-5 rounded-2xl border-2 border-[var(--color-forest-ink)] shadow-sm"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-pencil-gray)]/30">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                Attendance Controls
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => markAll('present')}
                  className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)] cursor-pointer btn-spring"
                >
                  Mark All
                </button>
                <button
                  type="button"
                  onClick={() => markAll(null)}
                  className="px-2 py-0.5 text-[11px] font-mono rounded border border-[var(--color-pencil-gray)] bg-white text-[var(--color-forest-ink)] cursor-pointer btn-spring"
                >
                  Reset
                </button>
              </div>
            </div>

            {attendanceSuccess && (
              <div
                className="p-3 mb-3 rounded-xl border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)] animate-fadeIn text-xs shadow-2xs"
              >
                <p className="font-bold font-mono">
                  ✓ Attendance logged for "{lastLoggedTitle}"!
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await activateFeedback(lastLoggedTitle);
                    setFeedbackActivated(true);
                    setTimeout(() => setFeedbackActivated(false), 4000);
                  }}
                  className="mt-2 w-full py-1.5 px-2.5 text-xs font-bold rounded-lg border border-[var(--color-forest-ink)] bg-white hover:bg-[var(--color-highlighter-yellow)] text-[var(--color-forest-ink)] cursor-pointer btn-spring flex items-center justify-center gap-1.5"
                >
                  <StickerIcon name="star" size={14} />
                  <span>{feedbackActivated ? 'Feedback Activated!' : 'Launch Live Feedback →'}</span>
                </button>
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-[var(--color-forest-ink)] font-inter">
                  Session Title
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Workshop #04 & Brand Sprint"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white text-[var(--color-forest-ink)]"
                  style={{ fontFamily: 'var(--font-inter)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-[var(--color-forest-ink)] font-inter">
                  Date
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white text-[var(--color-forest-ink)] font-mono"
                />
              </div>
            </div>

            {/* Exactly ONE dark-green primary CTA */}
            <button
              type="button"
              onClick={handleLogAttendance}
              disabled={loggingAttendance || markedCount === 0}
              className="w-full py-2.5 text-xs font-bold cursor-pointer btn-spring rounded-xl border border-[var(--color-forest-ink)] text-center transition-all disabled:opacity-40"
              style={{
                fontFamily: 'var(--font-inter)',
                backgroundColor: 'var(--color-forest-ink)',
                color: 'var(--color-cream-paper)',
              }}
            >
              {loggingAttendance
                ? 'Saving Attendance...'
                : `Submit Attendance (${markedCount} marked) →`}
            </button>
          </div>

          {/* Quick Points Adjustment Rail Card */}
          <div
            className="p-4 sm:p-5 rounded-2xl border border-[var(--color-forest-ink)] shadow-xs"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-pencil-gray)]/30">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                Score Adjustment
              </span>
              <span className="text-[11px] font-mono text-[var(--color-pencil-gray)]">
                {selectedMembers.size} selected
              </span>
            </div>

            {pointsSuccess && (
              <div className="text-xs font-mono font-bold px-2.5 py-1.5 mb-3 rounded-lg border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)]">
                Points applied successfully.
              </div>
            )}

            {/* Presets */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {POINT_PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPresetIdx(i)}
                  className="text-xs py-1.5 px-2 text-center rounded-lg cursor-pointer btn-spring transition-colors"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: presetIdx === i ? 'var(--color-highlighter-yellow)' : 'white',
                    border: presetIdx === i ? '1.5px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
                    color: p.amount < 0 ? 'var(--color-terracotta)' : 'var(--color-forest-ink)',
                    fontWeight: presetIdx === i ? 700 : 500,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {POINT_PRESETS[presetIdx].label === 'Custom' && (
              <div className="mb-3">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="e.g. 25 or -10"
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white font-mono text-[var(--color-forest-ink)]"
                />
              </div>
            )}

            {/* Action CTA */}
            <button
              type="button"
              onClick={handleApplyPoints}
              disabled={applyingPoints || selectedMembers.size === 0}
              className="w-full py-2 text-xs font-bold cursor-pointer btn-spring rounded-lg border border-[var(--color-forest-ink)] transition-opacity disabled:opacity-40"
              style={{
                fontFamily: 'var(--font-inter)',
                backgroundColor: 'var(--color-forest-ink)',
                color: 'var(--color-cream-paper)',
              }}
            >
              {applyingPoints
                ? 'Applying Points...'
                : `Award to ${selectedMembers.size} Member${selectedMembers.size !== 1 ? 's' : ''} →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
