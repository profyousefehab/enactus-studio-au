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
import StickerIcon from '../ui/StickerIcon';

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
        // Exclude coordinator / admin accounts from member rosters
        .filter((m) => m.role !== 'admin' && m.name?.trim().toLowerCase() !== 'yousef ehab');
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
        <p className="text-sm animate-pulse" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}>
          Loading committee members...
        </p>
      </div>
    );
  }

  const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
    present: { icon: 'doodle:check', label: 'Present', color: 'var(--color-sticky-note-mint)' },
    absent: { icon: 'doodle:x', label: 'Absent', color: '#fecaca' },
    excused: { icon: 'doodle:minus', label: 'Excused', color: 'var(--color-highlighter-yellow)' },
  };

  const markedCount = Object.values(statuses).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── ATTENDANCE ── */}
      <div
        className="p-4 sm:p-5"
        style={{
          backgroundColor: 'var(--color-cream-paper)',
          border: '1px solid var(--color-forest-ink)',
          borderRadius: 'var(--radius-cards)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--color-pencil-gray)]">
          <div>
            <h4
              className="text-base font-bold flex items-center gap-2"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
            >
              <Icon icon="doodle:clipboard" width={18} height={18} className="shrink-0" />
              Session Attendance
            </h4>
            <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}>
              Mark presence to auto-track streaks and award +10 attendance points.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => markAll('present')}
              className="px-2.5 py-1 text-xs font-semibold cursor-pointer btn-spring"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--color-sticky-note-mint)',
                border: '1px solid var(--color-forest-ink)',
                borderRadius: 'var(--radius-buttons)',
                color: 'var(--color-forest-ink)',
              }}
            >
              Mark all present
            </button>
            <button
              onClick={() => markAll(null)}
              className="px-2.5 py-1 text-xs cursor-pointer btn-spring"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-pencil-gray)',
                borderRadius: 'var(--radius-buttons)',
                color: 'var(--color-forest-ink)',
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {attendanceSuccess && (
          <div
            className="p-3.5 mb-4 rounded-xl border border-[var(--color-forest-ink)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn shadow-xs"
            style={{
              backgroundColor: 'var(--color-sticky-note-mint)',
              color: 'var(--color-forest-ink)',
            }}
          >
            <div>
              <p className="text-xs font-bold font-mono">
                ✓ Attendance logged successfully for "{lastLoggedTitle}"!
              </p>
              <p className="text-[11px] font-inter text-[var(--color-forest-ink)]/80 mt-0.5">
                Launch live session feedback so attending members can rate today's session immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await activateFeedback(lastLoggedTitle);
                setFeedbackActivated(true);
                setTimeout(() => setFeedbackActivated(false), 4000);
              }}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-[var(--color-forest-ink)] bg-white hover:bg-[var(--color-highlighter-yellow)] text-[var(--color-forest-ink)] cursor-pointer btn-spring whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              <StickerIcon name="star" size={15} />
              <span>{feedbackActivated ? 'Feedback Activated!' : 'Launch Session Feedback →'}</span>
            </button>
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
              Session Title
            </label>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="e.g. Weekly Creative Review #03"
              className="w-full text-sm px-3 py-2 focus:outline-none"
              style={{
                fontFamily: 'var(--font-inter)',
                color: 'var(--color-forest-ink)',
                backgroundColor: 'var(--color-cream-paper)',
                border: '1px solid var(--color-pencil-gray)',
                borderRadius: 'var(--radius-buttons)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
              Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full text-sm px-3 py-2 focus:outline-none"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-forest-ink)',
                backgroundColor: 'var(--color-cream-paper)',
                border: '1px solid var(--color-pencil-gray)',
                borderRadius: 'var(--radius-buttons)',
              }}
            />
          </div>
        </div>

        {/* Responsive grid of members */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)' }}>
              Committee Members ({members.length})
            </span>
            <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pencil-gray)' }}>
              {markedCount}/{members.length} marked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[480px] overflow-y-auto pr-1">
            {members.map((m) => {
              const s = statuses[m.id];
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2.5 p-2.5 transition-all"
                  style={{
                    backgroundColor: s ? STATUS_CONFIG[s].color : 'transparent',
                    border: s ? '1.5px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
                    borderRadius: 'var(--radius-cards)',
                  }}
                >
                  <StudioAvatar avatarId={m.avatarId} customAvatarUrl={m.customAvatarUrl} size={32} />
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
                    >
                      {m.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <TrackBadge track={m.track} size="sm" />
                      <span className="text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pencil-gray)' }}>
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

        <button
          onClick={handleLogAttendance}
          disabled={loggingAttendance || markedCount === 0}
          className="w-full mt-4 py-2.5 text-sm font-semibold cursor-pointer btn-spring"
          style={{
            fontFamily: 'var(--font-inter)',
            backgroundColor: 'var(--color-forest-ink)',
            color: 'var(--color-cream-paper)',
            border: 'none',
            borderRadius: 'var(--radius-buttons)',
            opacity: loggingAttendance || markedCount === 0 ? 0.4 : 1,
          }}
        >
          {loggingAttendance ? 'Saving Attendance...' : `Submit Attendance for ${markedCount} Member${markedCount !== 1 ? 's' : ''} \u2192`}
        </button>
      </div>

      {/* ── QUICK POINTS ── */}
      <div
        className="p-4 sm:p-5"
        style={{
          backgroundColor: 'var(--color-cream-paper)',
          border: '1px solid var(--color-forest-ink)',
          borderRadius: 'var(--radius-cards)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--color-pencil-gray)]">
          <div>
            <h4
              className="text-base font-bold flex items-center gap-2"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
            >
              <Icon icon="doodle:star" width={18} height={18} className="shrink-0" />
              Award Points
            </h4>
            <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}>
              Select members and apply point rewards or penalties with a single click.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => selectAllMembers()}
              className="px-2 py-1 text-xs cursor-pointer btn-spring"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-pencil-gray)',
                borderRadius: 'var(--radius-buttons)',
                color: 'var(--color-forest-ink)',
              }}
            >
              Select All
            </button>
            <button
              onClick={() => selectAllMembers('Design')}
              className="px-2 py-1 text-xs cursor-pointer btn-spring"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-pencil-gray)',
                borderRadius: 'var(--radius-buttons)',
                color: 'var(--color-forest-ink)',
              }}
            >
              All Design
            </button>
            <button
              onClick={() => selectAllMembers('Content')}
              className="px-2 py-1 text-xs cursor-pointer btn-spring"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-pencil-gray)',
                borderRadius: 'var(--radius-buttons)',
                color: 'var(--color-forest-ink)',
              }}
            >
              All Content
            </button>
            {selectedMembers.size > 0 && (
              <button
                onClick={clearMemberSelection}
                className="px-2 py-1 text-xs cursor-pointer btn-spring"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-terracotta)',
                  borderRadius: 'var(--radius-buttons)',
                  color: 'var(--color-terracotta)',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {pointsSuccess && (
          <div
            className="text-xs font-medium px-3 py-2 mb-4"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--color-sticky-note-mint)',
              border: '1px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-buttons)',
              color: 'var(--color-forest-ink)',
            }}
          >
            Points applied successfully.
          </div>
        )}

        {/* Member selector chips */}
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)' }}>
            Select Recipients ({selectedMembers.size} selected)
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
            {members.map((m) => {
              const isSelected = selectedMembers.has(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs cursor-pointer pill-spring"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isSelected ? 'var(--color-sticky-note-teal)' : 'var(--color-cream-paper)',
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

        {/* Preset selector */}
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)' }}>
            Point Reason & Amount
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {POINT_PRESETS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => setPresetIdx(i)}
                className="text-xs py-2 px-2.5 text-center cursor-pointer btn-spring"
                style={{
                  fontFamily: 'var(--font-mono)',
                  borderRadius: 'var(--radius-buttons)',
                  backgroundColor: presetIdx === i ? 'var(--color-highlighter-yellow)' : 'var(--color-cream-paper)',
                  border: presetIdx === i ? '2px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
                  color: p.amount < 0 ? 'var(--color-terracotta)' : 'var(--color-forest-ink)',
                  fontWeight: presetIdx === i ? 700 : 500,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {POINT_PRESETS[presetIdx].label === 'Custom' && (
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
              Custom Amount (+ or −)
            </label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="e.g. 25 or -10"
              className="w-full sm:w-64 text-sm px-3 py-2 focus:outline-none"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-forest-ink)',
                backgroundColor: 'var(--color-cream-paper)',
                border: '1px solid var(--color-pencil-gray)',
                borderRadius: 'var(--radius-buttons)',
              }}
            />
          </div>
        )}

        <button
          onClick={handleApplyPoints}
          disabled={applyingPoints || selectedMembers.size === 0}
          className="w-full py-2.5 text-sm font-semibold cursor-pointer btn-spring"
          style={{
            fontFamily: 'var(--font-inter)',
            backgroundColor: 'var(--color-forest-ink)',
            color: 'var(--color-cream-paper)',
            border: 'none',
            borderRadius: 'var(--radius-buttons)',
            opacity: applyingPoints || selectedMembers.size === 0 ? 0.4 : 1,
          }}
        >
          {applyingPoints ? 'Applying Points...' : `Award Points to ${selectedMembers.size} Member${selectedMembers.size !== 1 ? 's' : ''} \u2192`}
        </button>
      </div>
    </div>
  );
}
