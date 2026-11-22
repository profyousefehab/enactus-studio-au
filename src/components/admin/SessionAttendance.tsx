import { useState, useEffect, useRef, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import { useSessionFeedback } from '../../context/SessionFeedbackContext';
import { isExcludedMember } from '../../utils/accounts';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import StickerIcon from '../ui/StickerIcon';
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

interface AttendanceDoc {
  id: string;
  sessionTitle: string;
  sessionDate: string;
  userId: string;
  status: 'present' | 'absent' | 'excused';
  createdAt: any;
}

interface ActiveSession {
  name: string;
  date: string;
}

export default function SessionAttendance() {
  const { activateFeedback } = useSessionFeedback();

  const [members, setMembers] = useState<Member[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Session: null = Sessions list view; object = Live Check-In view
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  // Create session modal/form state
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionDate, setNewSessionDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Live Check-in input state
  const [idInput, setIdInput] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackSessionLaunched, setFeedbackSessionLaunched] = useState(false);

  // Secondary manual roster toggle
  const [showFullRoster, setShowFullRoster] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to members
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

  // Subscribe to all attendance records
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'attendance'), (snap) => {
      const records = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AttendanceDoc[];
      setAttendanceRecords(records);
    });
    return unsub;
  }, []);

  // Keep ID input focused when live session is open
  useEffect(() => {
    if (activeSession && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeSession]);

  // Aggregate past sessions from attendance records
  const pastSessions = useMemo(() => {
    const map = new Map<string, { name: string; date: string; attendedCount: number; latestCreatedAt: any }>();

    attendanceRecords.forEach((r) => {
      const title = r.sessionTitle?.trim() || 'Untitled Session';
      const date = r.sessionDate || 'Unknown Date';
      const key = `${title}___${date}`;

      const existing = map.get(key);
      const isPresent = r.status === 'present';

      if (existing) {
        if (isPresent) existing.attendedCount++;
        if (r.createdAt && (!existing.latestCreatedAt || r.createdAt.seconds > existing.latestCreatedAt.seconds)) {
          existing.latestCreatedAt = r.createdAt;
        }
      } else {
        map.set(key, {
          name: title,
          date,
          attendedCount: isPresent ? 1 : 0,
          latestCreatedAt: r.createdAt || null,
        });
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [attendanceRecords]);

  // Records for currently active session
  const activeSessionRecords = useMemo(() => {
    if (!activeSession) return [];
    return attendanceRecords.filter(
      (r) =>
        r.sessionTitle?.trim().toLowerCase() === activeSession.name.trim().toLowerCase() &&
        r.sessionDate === activeSession.date
    );
  }, [attendanceRecords, activeSession]);

  // Set of member IDs who have attended the active session
  const attendedMemberIds = useMemo(() => {
    return new Set(
      activeSessionRecords.filter((r) => r.status === 'present').map((r) => r.userId)
    );
  }, [activeSessionRecords]);

  // Check-in history for active session, most recent first
  const attendedList = useMemo(() => {
    const presentRecords = activeSessionRecords.filter((r) => r.status === 'present');
    // Sort most recent first
    presentRecords.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    return presentRecords.map((r) => {
      const member = members.find((m) => m.id === r.userId);
      return {
        recordId: r.id,
        member,
        userId: r.userId,
        createdAt: r.createdAt,
      };
    });
  }, [activeSessionRecords, members]);

  // Handle starting a new session
  function handleStartNewSession(e: React.FormEvent) {
    e.preventDefault();
    if (!newSessionName.trim()) {
      alert('Please enter a session name.');
      return;
    }
    setActiveSession({
      name: newSessionName.trim(),
      date: newSessionDate,
    });
    setShowNewSessionModal(false);
    setNewSessionName('');
    setFeedbackNotice(null);
  }

  // Handle ID Check-in
  async function handleCheckIn(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!activeSession || isProcessing) return;

    const trimmed = idInput.trim();
    if (!trimmed) return;

    setIsProcessing(true);

    // Find member by 4-digit PIN code or user ID
    const foundMember = members.find(
      (m) => m.pinCode === trimmed || m.id === trimmed
    );

    // Edge Case 1: Unknown ID
    if (!foundMember) {
      setFeedbackNotice({
        type: 'error',
        message: `⚠️ Unknown ID "${trimmed}". No matching committee member found.`,
      });
      setIdInput('');
      setIsProcessing(false);
      inputRef.current?.focus();
      return;
    }

    // Edge Case 2: Already attended
    if (attendedMemberIds.has(foundMember.id)) {
      setFeedbackNotice({
        type: 'info',
        message: `✓ ${foundMember.name} is already checked in for this session.`,
      });
      setIdInput('');
      setIsProcessing(false);
      inputRef.current?.focus();
      return;
    }

    // Edge Case 3: Success Check-in
    try {
      // 1. Add attendance record
      await addDoc(collection(db, 'attendance'), {
        sessionTitle: activeSession.name.trim(),
        sessionDate: activeSession.date,
        userId: foundMember.id,
        status: 'present',
        createdAt: Timestamp.now(),
      });

      // 2. Update member streak & points
      const userRef = doc(db, 'users', foundMember.id);
      const newStreak = (foundMember.sessionStreak ?? 0) + 1;
      const newBest = Math.max(newStreak, foundMember.bestStreak ?? 0);

      await updateDoc(userRef, {
        sessionStreak: newStreak,
        bestStreak: newBest,
        points: increment(10),
      });

      // 3. Log point event
      await addDoc(collection(db, 'pointEvents'), {
        userId: foundMember.id,
        amount: 10,
        reason: `Session Attendance: ${activeSession.name.trim()}`,
        createdAt: Timestamp.now(),
      });

      setFeedbackNotice({
        type: 'success',
        message: `✓ ${foundMember.name} marked present! (+10 PTS awarded)`,
      });
      setIdInput('');
    } catch (err: any) {
      console.error('Check-in error:', err);
      setFeedbackNotice({
        type: 'error',
        message: `Failed to check in: ${err?.message || err}`,
      });
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  }

  // Handle Undoing a check-in
  async function handleUndoCheckIn(recordId: string, userId: string, memberName?: string) {
    if (!activeSession) return;
    if (!window.confirm(`Undo attendance for ${memberName || 'this member'}?`)) return;

    try {
      // Delete attendance doc
      await deleteDoc(doc(db, 'attendance', recordId));

      // Revert streak & points
      const member = members.find((m) => m.id === userId);
      const userRef = doc(db, 'users', userId);
      const prevStreak = Math.max(0, (member?.sessionStreak ?? 1) - 1);

      await updateDoc(userRef, {
        sessionStreak: prevStreak,
        points: increment(-10),
      });

      // Log reverse point event
      await addDoc(collection(db, 'pointEvents'), {
        userId,
        amount: -10,
        reason: `Undo Session Attendance: ${activeSession.name.trim()}`,
        createdAt: Timestamp.now(),
      });

      setFeedbackNotice({
        type: 'info',
        message: `Undid check-in for ${memberName || 'member'}. (-10 PTS adjusted)`,
      });
    } catch (err: any) {
      console.error('Undo error:', err);
      alert('Failed to undo check-in: ' + err?.message);
    }
  }

  // Manual Roster Marking helper
  async function handleManualMark(member: Member, status: 'present' | 'absent' | 'excused') {
    if (!activeSession) return;

    const existingRecord = activeSessionRecords.find((r) => r.userId === member.id);

    try {
      if (existingRecord) {
        // If changing away from present, deduct points
        if (existingRecord.status === 'present' && status !== 'present') {
          const userRef = doc(db, 'users', member.id);
          await updateDoc(userRef, {
            sessionStreak: Math.max(0, (member.sessionStreak ?? 1) - 1),
            points: increment(-10),
          });
          await addDoc(collection(db, 'pointEvents'), {
            userId: member.id,
            amount: -10,
            reason: `Reverted attendance to ${status}: ${activeSession.name}`,
            createdAt: Timestamp.now(),
          });
        }
        await updateDoc(doc(db, 'attendance', existingRecord.id), { status });
      } else {
        // Create new
        await addDoc(collection(db, 'attendance'), {
          sessionTitle: activeSession.name.trim(),
          sessionDate: activeSession.date,
          userId: member.id,
          status,
          createdAt: Timestamp.now(),
        });

        if (status === 'present') {
          const userRef = doc(db, 'users', member.id);
          const newStreak = (member.sessionStreak ?? 0) + 1;
          const newBest = Math.max(newStreak, member.bestStreak ?? 0);
          await updateDoc(userRef, {
            sessionStreak: newStreak,
            bestStreak: newBest,
            points: increment(10),
          });
          await addDoc(collection(db, 'pointEvents'), {
            userId: member.id,
            amount: 10,
            reason: `Session Attendance: ${activeSession.name.trim()}`,
            createdAt: Timestamp.now(),
          });
        }
      }

      // Success
    } catch (err: any) {
      console.error('Manual mark error:', err);
      alert('Error updating attendance: ' + err?.message);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-mono animate-pulse text-[var(--color-pencil-gray)]">
          Loading attendance records...
        </p>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // VIEW 1: SESSIONS LIST (Default Landing)
  // ═════════════════════════════════════════════════════════════
  if (!activeSession) {
    return (
      <div className="flex flex-col gap-6">
        {/* In-Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-pencil-gray)]/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-forest-ink)]"
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                Session Attendance
              </h2>
              <span
                className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--color-forest-ink)]"
                style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
              >
                CHECK-IN SESSIONS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--color-pencil-gray)]" style={{ fontFamily: 'var(--font-inter)' }}>
              Open a past meeting to review presence or create a new session for live check-in.
            </p>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 flex-wrap">
            <div className="hidden sm:block">
              <SketchCallout
                text="type member ID for instant check-in ⤵"
                arrow="down-right"
                color="#cb5521"
                rotate="-rotate-2"
                fontSize={18}
              />
            </div>
            {/* Primary Action: New Session */}
            <button
              type="button"
              onClick={() => setShowNewSessionModal(true)}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl border border-[var(--color-forest-ink)] bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)] hover:opacity-90 cursor-pointer btn-spring whitespace-nowrap shadow-xs flex items-center justify-center gap-2"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              <Icon icon="doodle:plus" width={16} height={16} />
              <span>New Session</span>
            </button>
          </div>
        </div>

        {/* New Session Creation Modal */}
        {showNewSessionModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              className="w-full max-w-md p-5 sm:p-6 rounded-2xl border-2 border-[var(--color-forest-ink)] shadow-xl bg-[var(--color-cream-paper)] animate-fadeIn"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--color-pencil-gray)]/30">
                <h3
                  className="text-lg font-bold text-[var(--color-forest-ink)]"
                  style={{ fontFamily: 'var(--font-bricolage)' }}
                >
                  Create Attendance Session
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="w-7 h-7 rounded-lg border border-[var(--color-pencil-gray)] flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                >
                  <Icon icon="doodle:close" width={14} height={14} />
                </button>
              </div>

              <form onSubmit={handleStartNewSession} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-[var(--color-forest-ink)] font-inter">
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="e.g. Workshop #04 — Design Crit & Brand Sprint"
                    autoFocus
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white text-[var(--color-forest-ink)]"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-[var(--color-forest-ink)] font-inter">
                    Session Date
                  </label>
                  <input
                    type="date"
                    value={newSessionDate}
                    onChange={(e) => setNewSessionDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white font-mono text-[var(--color-forest-ink)]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-pencil-gray)]/30">
                  <button
                    type="button"
                    onClick={() => setShowNewSessionModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-pencil-gray)] bg-white text-[var(--color-pencil-gray)] hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold rounded-lg border border-[var(--color-forest-ink)] bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)] hover:opacity-90 cursor-pointer btn-spring"
                  >
                    Start Check-In →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sessions List Cards */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]">
              All Sessions ({pastSessions.length})
            </span>
            <span className="text-xs font-mono text-[var(--color-pencil-gray)]">
              {members.length} active committee members
            </span>
          </div>

          {pastSessions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[var(--color-pencil-gray)] bg-white/60">
              <div className="w-10 h-10 rounded-full border border-[var(--color-forest-ink)] bg-[var(--color-highlighter-yellow)] flex items-center justify-center mx-auto mb-2">
                <Icon icon="doodle:clipboard" width={20} height={20} className="text-[var(--color-forest-ink)]" />
              </div>
              <p className="text-sm font-bold text-[var(--color-forest-ink)] font-inter">
                No attendance sessions logged yet.
              </p>
              <p className="text-xs text-[var(--color-pencil-gray)] font-inter mt-0.5">
                Click "+ New Session" above to launch today's live ID check-in.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {pastSessions.map((session) => (
                <div
                  key={`${session.name}___${session.date}`}
                  className="p-4 rounded-xl border border-[var(--color-forest-ink)] bg-white flex flex-col justify-between gap-3 shadow-2xs card-spring"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-[var(--color-forest-ink)]/30 bg-[var(--color-cream-paper)] text-[var(--color-forest-ink)] font-semibold">
                        {session.date}
                      </span>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)]">
                        {session.attendedCount}/{members.length} attended
                      </span>
                    </div>

                    <h4
                      className="text-sm font-bold text-[var(--color-forest-ink)] line-clamp-2"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      {session.name}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSession({ name: session.name, date: session.date });
                      setFeedbackNotice(null);
                    }}
                    className="w-full py-2 text-xs font-bold rounded-lg border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] hover:bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)] cursor-pointer btn-spring transition-colors text-center"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Open Live Check-In →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // VIEW 2: LIVE CHECK-IN SCREEN (Primary ID Input + Recent Feed)
  // ═════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-6">
      {/* Top Session Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-pencil-gray)]/30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveSession(null);
              setFeedbackNotice(null);
            }}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--color-pencil-gray)] bg-white text-[var(--color-forest-ink)] hover:bg-gray-50 cursor-pointer btn-spring flex items-center gap-1.5 shrink-0"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <Icon icon="doodle:arrow-left" width={16} height={16} />
            <span>All Sessions</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2
                className="text-lg sm:text-xl font-extrabold text-[var(--color-forest-ink)]"
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                {activeSession.name}
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-highlighter-yellow)] border border-[var(--color-forest-ink)] text-[var(--color-forest-ink)]">
                {activeSession.date}
              </span>
            </div>
            <p className="text-xs text-[var(--color-pencil-gray)]" style={{ fontFamily: 'var(--font-inter)' }}>
              Type 4-digit PIN/ID and press Enter for rapid instant check-in.
            </p>
          </div>
        </div>

        {/* Live Running Count & Finish Action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)] shadow-2xs">
            {attendedList.length}/{members.length} attended
          </span>

          <button
            type="button"
            onClick={async () => {
              await activateFeedback(activeSession.name);
              setFeedbackSessionLaunched(true);
              setTimeout(() => setFeedbackSessionLaunched(false), 4000);
            }}
            className="min-h-[44px] px-3.5 py-2 text-xs font-bold rounded-xl border border-[var(--color-forest-ink)] bg-[var(--color-highlighter-yellow)] hover:opacity-90 text-[var(--color-forest-ink)] cursor-pointer btn-spring flex items-center gap-1.5 shadow-2xs"
          >
            <StickerIcon name="star" size={16} />
            <span>{feedbackSessionLaunched ? 'Feedback Launched!' : 'Launch Feedback →'}</span>
          </button>
        </div>
      </div>

      {/* ───── PRIMARY ELEMENT: LARGE ID INPUT ───── */}
      <div
        className="p-5 sm:p-6 rounded-2xl border-2 border-[var(--color-forest-ink)] shadow-md bg-white flex flex-col items-center text-center max-w-xl mx-auto w-full card-spring"
      >
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-pencil-gray)] mb-2">
          Rapid Member ID Check-In
        </span>

        <form onSubmit={handleCheckIn} className="w-full flex flex-col items-center gap-3">
          <div className="relative w-full">
            <input
              ref={inputRef}
              type="text"
              value={idInput}
              onChange={(e) => setIdInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              inputMode="numeric"
              maxLength={4}
              disabled={isProcessing}
              className="w-full py-3 px-4 text-3xl sm:text-4xl font-mono font-extrabold text-center tracking-[0.25em] rounded-xl border-2 border-[var(--color-forest-ink)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-[var(--color-cream-paper)] text-[var(--color-forest-ink)] placeholder-[var(--color-pencil-gray)]/40 shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 w-full justify-center">
            <button
              type="submit"
              disabled={idInput.length !== 4 || isProcessing}
              className="w-full min-h-[44px] py-3 px-6 rounded-xl border border-[var(--color-forest-ink)] text-xs sm:text-sm font-bold cursor-pointer btn-spring transition-all disabled:opacity-40 flex items-center justify-center"
              style={{
                fontFamily: 'var(--font-inter)',
                backgroundColor: 'var(--color-forest-ink)',
                color: 'var(--color-cream-paper)',
              }}
            >
              {isProcessing ? 'Checking in...' : 'Attend Member (Enter) →'}
            </button>
          </div>
        </form>

        {/* Feedback Notices: Success / Gentle Already Checked-In / Clear Error */}
        {feedbackNotice && (
          <div
            className={`w-full mt-3 p-3 rounded-xl border text-xs font-semibold text-center animate-fadeIn ${
              feedbackNotice.type === 'success'
                ? 'bg-[var(--color-sticky-note-mint)] border-[var(--color-forest-ink)] text-[var(--color-forest-ink)]'
                : feedbackNotice.type === 'info'
                ? 'bg-[var(--color-sticky-note-teal)] border-[var(--color-forest-ink)] text-[var(--color-forest-ink)]'
                : 'bg-[#ffebe6] border-[var(--color-terracotta)] text-[var(--color-terracotta)]'
            }`}
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {feedbackNotice.message}
          </div>
        )}
      </div>

      {/* ───── LIVE CHECKED-IN LIST (MOST RECENT FIRST) ───── */}
      <div
        className="p-4 sm:p-5 rounded-2xl border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] shadow-xs flex flex-col gap-3"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-pencil-gray)]/30">
          <div className="flex items-center gap-2">
            <Icon icon="doodle:check-circle" width={18} height={18} className="text-[var(--color-forest-ink)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
              Checked In So Far ({attendedList.length}) — Most Recent First
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--color-pencil-gray)]">
            +10 PTS logged to profile
          </span>
        </div>

        {attendedList.length === 0 ? (
          <p className="text-xs font-inter text-[var(--color-pencil-gray)] text-center py-6">
            No members checked in yet for this session. Type a member's 4-digit ID above to check them in.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
            {attendedList.map(({ recordId, member, userId }) => (
              <div
                key={recordId}
                className="p-2.5 rounded-xl border border-[var(--color-forest-ink)] bg-white flex items-center justify-between gap-2 shadow-2xs card-spring"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <StudioAvatar
                    avatarId={member?.avatarId || '1'}
                    customAvatarUrl={member?.customAvatarUrl}
                    size={28}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-[var(--color-forest-ink)]" style={{ fontFamily: 'var(--font-inter)' }}>
                      {member?.name || 'Member'}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {member && <TrackBadge track={member.track} size="sm" />}
                      <span className="text-[10px] font-mono text-[var(--color-pencil-gray)]">
                        {member?.sessionStreak || 0}🔥
                      </span>
                    </div>
                  </div>
                </div>

                {/* Undo Check-In Action: min 44px touch target */}
                <button
                  type="button"
                  onClick={() => handleUndoCheckIn(recordId, userId, member?.name)}
                  className="min-h-[44px] min-w-[48px] px-3 py-2 text-xs font-mono font-bold rounded-lg border border-gray-300 bg-white text-[var(--color-terracotta)] hover:bg-[#ffebe6] cursor-pointer btn-spring shrink-0 flex items-center justify-center"
                  title="Undo attendance and remove +10 PTS"
                >
                  Undo
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ───── SECONDARY TOGGLE: MANUAL ROSTER MARKING ───── */}
      <div className="rounded-2xl border border-[var(--color-pencil-gray)] bg-white/70 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFullRoster(!showFullRoster)}
          className="w-full flex items-center justify-between p-3.5 bg-[var(--color-cream-paper)] cursor-pointer text-left hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <Icon icon="doodle:users" width={16} height={16} className="text-[var(--color-forest-ink)]" />
            <span className="text-xs font-bold font-inter text-[var(--color-forest-ink)]">
              Secondary: Manual Roster Checklist ({members.length} members)
            </span>
          </div>
          <Icon
            icon="doodle:chevron-down"
            width={16}
            height={16}
            style={{
              transform: showFullRoster ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease-out',
            }}
          />
        </button>

        {showFullRoster && (
          <div className="p-4 border-t border-[var(--color-pencil-gray)]/30 flex flex-col gap-3">
            <p className="text-xs text-[var(--color-pencil-gray)] font-inter">
              Mark members manually who do not have their PIN or need absent/excused statuses.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {members.map((m) => {
                const isAttended = attendedMemberIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                      isAttended
                        ? 'border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)]/50'
                        : 'border-[var(--color-pencil-gray)] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <StudioAvatar avatarId={m.avatarId} customAvatarUrl={m.customAvatarUrl} size={24} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-[var(--color-forest-ink)]">
                          {m.name}
                        </p>
                        <TrackBadge track={m.track} size="sm" />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleManualMark(m, 'present')}
                        className={`min-h-[44px] px-2.5 py-1 text-xs font-mono font-bold rounded-lg border cursor-pointer flex items-center justify-center ${
                          isAttended
                            ? 'bg-[var(--color-forest-ink)] text-white border-[var(--color-forest-ink)]'
                            : 'bg-white text-[var(--color-forest-ink)] border-gray-300'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleManualMark(m, 'absent')}
                        className="min-h-[44px] px-2.5 py-1 text-xs font-mono rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-red-600 cursor-pointer flex items-center justify-center"
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
