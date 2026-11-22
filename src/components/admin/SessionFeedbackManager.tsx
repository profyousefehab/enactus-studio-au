import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import { useSession } from '../../context/SessionContext';
import { useSessionFeedback } from '../../context/SessionFeedbackContext';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import StickerIcon from '../ui/StickerIcon';
import SketchCallout from '../ui/SketchCallout';

interface FeedbackResponse {
  id: string;
  sessionId: string;
  sessionTitle: string;
  userId: string;
  userName: string;
  userAvatarId?: string;
  userCustomAvatarUrl?: string | null;
  userTrack?: 'Design' | 'Content';
  rating: number;
  message: string;
  createdAt: any;
}

export default function SessionFeedbackManager() {
  const { user } = useSession();
  const { feedbackSettings, activateFeedback, closeFeedback } = useSessionFeedback();

  const [sessionTitleInput, setSessionTitleInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('current');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

  // Strict Privacy: Only admins can view this manager
  if (user?.role !== 'admin') {
    return null;
  }

  // Pre-fill session title from active session if available
  useEffect(() => {
    if (feedbackSettings?.sessionTitle && !sessionTitleInput) {
      setSessionTitleInput(feedbackSettings.sessionTitle);
    }
  }, [feedbackSettings?.sessionTitle]);

  // Subscribe to all session feedback responses
  useEffect(() => {
    const q = query(
      collection(db, 'sessionFeedbackResponses'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as FeedbackResponse[];

        setResponses(data);
        setLoadingResponses(false);
      },
      (err) => {
        console.error('Error listening to sessionFeedbackResponses:', err);
        setLoadingResponses(false);
      }
    );

    return () => unsub();
  }, []);

  // Distinct sessions list from all responses
  const knownSessions = useMemo(() => {
    const map = new Map<string, { id: string; title: string; count: number }>();
    responses.forEach((r) => {
      const existing = map.get(r.sessionId);
      if (existing) {
        existing.count++;
      } else {
        map.set(r.sessionId, { id: r.sessionId, title: r.sessionTitle || 'Session', count: 1 });
      }
    });
    return Array.from(map.values());
  }, [responses]);

  // Filtered responses for current or chosen session
  const activeSessionId = feedbackSettings?.sessionId;

  const currentSessionResponses = useMemo(() => {
    if (selectedSessionFilter === 'current' && activeSessionId) {
      return responses.filter((r) => r.sessionId === activeSessionId);
    }
    if (selectedSessionFilter !== 'all' && selectedSessionFilter !== 'current') {
      return responses.filter((r) => r.sessionId === selectedSessionFilter);
    }
    return responses;
  }, [responses, selectedSessionFilter, activeSessionId]);

  // Apply star rating filter
  const displayedResponses = useMemo(() => {
    if (ratingFilter === 'all') return currentSessionResponses;
    return currentSessionResponses.filter((r) => r.rating === ratingFilter);
  }, [currentSessionResponses, ratingFilter]);

  // Summary Metrics: Average Rating, Counts, Breakdown
  const metrics = useMemo(() => {
    const total = currentSessionResponses.length;
    if (total === 0) {
      return {
        total: 0,
        average: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const sum = currentSessionResponses.reduce((acc, r) => acc + (r.rating || 0), 0);
    const average = Math.round((sum / total) * 10) / 10;

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    currentSessionResponses.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 1)));
      breakdown[star] = (breakdown[star] || 0) + 1;
    });

    return { total, average, breakdown };
  }, [currentSessionResponses]);

  async function handleActivate() {
    if (!sessionTitleInput.trim()) {
      alert('Please enter a session title to activate feedback.');
      return;
    }
    setActivating(true);
    try {
      await activateFeedback(sessionTitleInput);
      setSelectedSessionFilter('current');
    } catch (err: any) {
      alert(`Error activating feedback: ${err?.message || err}`);
    } finally {
      setActivating(false);
    }
  }

  async function handleClose() {
    if (!window.confirm('Close active live session feedback? Members will no longer see the feedback prompt.')) {
      return;
    }
    setClosing(true);
    try {
      await closeFeedback();
    } catch (err: any) {
      alert(`Error closing feedback: ${err?.message || err}`);
    } finally {
      setClosing(false);
    }
  }

  function formatTime(ts?: any) {
    if (!ts) return 'Just now';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return (
        d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
        ' · ' +
        d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return 'Just now';
    }
  }

  const isLive = Boolean(feedbackSettings?.isOpen);

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
              Live Session Feedback
            </h2>
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--color-forest-ink)]"
              style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
            >
              COORDINATOR PRIVATE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-pencil-gray)]" style={{ fontFamily: 'var(--font-inter)' }}>
            Launch real-time 1–5 star ratings and suggestions. Strictly private to the coordinator.
          </p>
        </div>

        <SketchCallout
          text="members see the pop-up instantly ⤵"
          arrow="down-right"
          color="#cb5521"
          rotate="-rotate-2"
          fontSize={18}
        />
      </div>

      {/* ───── Shared 2-Column Section Template (Desktop lg+) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (~2/3): Responses & Sentiment Breakdown */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          <div
            className="p-4 sm:p-5 rounded-2xl border border-[var(--color-forest-ink)] shadow-xs flex flex-col gap-5"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            {/* Results Header (R6 rename: Feedback results) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--color-pencil-gray)]/30">
              <div>
                <h3
                  className="text-lg font-bold tracking-tight text-[var(--color-forest-ink)]"
                  style={{ fontFamily: 'var(--font-bricolage)' }}
                >
                  Feedback results
                </h3>
                <p className="text-xs text-[var(--color-pencil-gray)]" style={{ fontFamily: 'var(--font-inter)' }}>
                  Real-time rating distribution and direct member suggestions.
                </p>
              </div>

              {/* Star Filter Pill if active */}
              {ratingFilter !== 'all' && (
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 font-bold">
                    Filtered by {ratingFilter}★
                  </span>
                  <button
                    type="button"
                    onClick={() => setRatingFilter('all')}
                    className="font-bold underline text-[var(--color-forest-ink)] cursor-pointer text-xs"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Metrics Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Average Rating Big Card */}
              <div
                className="p-4 rounded-xl border border-[var(--color-forest-ink)] flex flex-col justify-between text-center"
                style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
              >
                <span className="text-xs font-mono uppercase font-bold text-[var(--color-forest-ink)]">
                  Average Rating
                </span>
                <div className="my-2 flex flex-col items-center">
                  <span className="text-4xl sm:text-5xl font-bold font-mono text-[var(--color-forest-ink)] leading-none">
                    {metrics.total > 0 ? metrics.average.toFixed(1) : '—'}
                  </span>
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StickerIcon
                        key={star}
                        name="star"
                        size={18}
                        className={
                          star <= Math.round(metrics.average)
                            ? 'opacity-100 drop-shadow-xs'
                            : 'opacity-25 grayscale'
                        }
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs font-mono font-medium text-[var(--color-forest-ink)]">
                  Based on {metrics.total} response{metrics.total !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Star Distribution Breakdown */}
              <div
                className="sm:col-span-2 p-4 rounded-xl border border-[var(--color-forest-ink)] flex flex-col justify-between bg-white"
              >
                <span className="text-xs font-mono uppercase font-bold text-[var(--color-pencil-gray)] mb-2">
                  Rating Distribution (Tap to filter)
                </span>

                <div className="flex flex-col gap-1.5 flex-1 justify-center">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = metrics.breakdown[stars] || 0;
                    const percentage = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                    const isFilterActive = ratingFilter === stars;

                    return (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => setRatingFilter(isFilterActive ? 'all' : stars)}
                        className={`flex items-center gap-2 text-xs py-0.5 px-1.5 rounded transition-colors cursor-pointer text-left ${
                          isFilterActive ? 'bg-amber-100 font-bold' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="w-10 font-mono font-semibold flex items-center gap-1 shrink-0">
                          {stars} <StickerIcon name="star" size={13} />
                        </span>

                        <div className="flex-1 h-3 rounded-full bg-gray-100 border border-[var(--color-forest-ink)]/20 overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor:
                                stars >= 4
                                  ? 'var(--color-sticky-note-mint)'
                                  : stars === 3
                                  ? 'var(--color-highlighter-yellow)'
                                  : 'var(--color-sticky-note-blush)',
                            }}
                          />
                        </div>

                        <span className="w-12 font-mono text-right text-[11px] text-[var(--color-pencil-gray)] shrink-0">
                          {count} ({percentage}%)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Individual Submissions Feed */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]">
                  Member Submissions ({displayedResponses.length})
                </span>
                <span className="text-xs font-mono text-[var(--color-pencil-gray)]">
                  Real-time feed
                </span>
              </div>

              {loadingResponses && (
                <p className="text-xs font-mono text-[var(--color-pencil-gray)] animate-pulse py-4 text-center">
                  Loading responses...
                </p>
              )}

              {!loadingResponses && displayedResponses.length === 0 && (
                <div className="p-8 text-center rounded-xl border border-dashed border-[var(--color-pencil-gray)] bg-white/70">
                  <div className="w-10 h-10 rounded-full border border-[var(--color-forest-ink)] bg-[var(--color-highlighter-yellow)] flex items-center justify-center mx-auto mb-2">
                    <StickerIcon name="star" size={20} />
                  </div>
                  <p className="text-sm font-bold text-[var(--color-forest-ink)]" style={{ fontFamily: 'var(--font-inter)' }}>
                    {metrics.total === 0
                      ? isLive
                        ? 'Waiting for member feedback...'
                        : 'No feedback submitted for this session.'
                      : 'No responses match the selected star filter.'}
                  </p>
                  <p className="text-xs text-[var(--color-pencil-gray)] mt-0.5" style={{ fontFamily: 'var(--font-inter)' }}>
                    {isLive
                      ? 'Active members see the pop-up on their screen and can submit anytime.'
                      : 'Activate a feedback session on the right to start receiving responses.'}
                  </p>
                </div>
              )}

              {!loadingResponses && displayedResponses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {displayedResponses.map((res) => (
                    <div
                      key={res.id}
                      className="p-3.5 rounded-xl border border-[var(--color-forest-ink)] bg-white flex flex-col justify-between gap-2.5 shadow-2xs card-spring"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <StudioAvatar
                            avatarId={res.userAvatarId || 'custom'}
                            customAvatarUrl={res.userCustomAvatarUrl}
                            size={32}
                          />
                          <div className="min-w-0">
                            <h5
                              className="text-xs font-bold truncate text-[var(--color-forest-ink)]"
                              style={{ fontFamily: 'var(--font-inter)' }}
                            >
                              {res.userName}
                            </h5>
                            {res.userTrack && (
                              <div className="mt-0.5">
                                <TrackBadge track={res.userTrack} size="sm" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0 bg-[var(--color-cream-paper)] px-1.5 py-0.5 rounded border border-[var(--color-forest-ink)]">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StickerIcon
                              key={star}
                              name="star"
                              size={12}
                              className={star <= res.rating ? 'opacity-100' : 'opacity-20 grayscale'}
                            />
                          ))}
                        </div>
                      </div>

                      {res.message ? (
                        <div
                          className="p-2.5 rounded-lg border border-[var(--color-forest-ink)]/15 text-xs leading-relaxed bg-[var(--color-cream-paper)] text-[var(--color-forest-ink)]"
                          style={{ fontFamily: 'var(--font-inter)' }}
                        >
                          "{res.message}"
                        </div>
                      ) : (
                        <p className="text-xs italic text-[var(--color-pencil-gray)] font-inter">
                          (Rated {res.rating}★ without comment)
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-pencil-gray)] pt-1 border-t border-gray-100">
                        <span className="truncate max-w-[150px]">{res.sessionTitle}</span>
                        <span>{formatTime(res.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (~1/3): Sticky Activation & Session Controls Rail */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20 z-10 flex flex-col gap-4">
          <div
            className="p-4 sm:p-5 rounded-2xl border-2 border-[var(--color-forest-ink)] shadow-sm flex flex-col gap-4"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-pencil-gray)]/30">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                Feedback Controls
              </span>
              {isLive ? (
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)]"
                >
                  <span className="w-2 h-2 rounded-full bg-[#1a3300] animate-ping" />
                  LIVE NOW
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--color-pencil-gray)] bg-gray-100 text-[var(--color-pencil-gray)]">
                  ● INACTIVE
                </span>
              )}
            </div>

            {/* Session selector */}
            <div>
              <label className="block text-xs font-bold font-inter mb-1 text-[var(--color-forest-ink)]">
                View Feedback For
              </label>
              <select
                value={selectedSessionFilter}
                onChange={(e) => setSelectedSessionFilter(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs font-semibold rounded-lg border border-[var(--color-forest-ink)] bg-white text-[var(--color-forest-ink)] cursor-pointer focus:outline-none"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {activeSessionId && (
                  <option value="current">Current Active Session ({isLive ? 'Live' : 'Last'})</option>
                )}
                <option value="all">All Sessions ({responses.length})</option>
                {knownSessions
                  .filter((s) => s.id !== activeSessionId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.count})
                    </option>
                  ))}
              </select>
            </div>

            {/* Session Title Input */}
            <div>
              <label
                htmlFor="session-feedback-title"
                className="block text-xs font-bold font-inter mb-1 text-[var(--color-forest-ink)]"
              >
                Session Title
              </label>
              <input
                id="session-feedback-title"
                type="text"
                value={sessionTitleInput}
                disabled={isLive}
                onChange={(e) => setSessionTitleInput(e.target.value)}
                placeholder="e.g. Workshop #04 & Brand Sprint"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white transition-colors disabled:bg-gray-100 disabled:opacity-80 text-[var(--color-forest-ink)]"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
            </div>

            {isLive && (
              <div className="p-2.5 rounded-lg border border-[var(--color-forest-ink)]/20 bg-[var(--color-sticky-note-mint)] text-xs text-[var(--color-forest-ink)]">
                <p className="font-bold font-mono">Active Session: "{feedbackSettings?.sessionTitle}"</p>
                <p className="text-[11px] font-inter mt-0.5 opacity-80">Listening for incoming ratings live.</p>
              </div>
            )}

            {/* Exactly ONE dark-green primary CTA or quiet destructive */}
            {isLive ? (
              <button
                type="button"
                disabled={closing}
                onClick={handleClose}
                className="w-full py-2.5 px-4 rounded-xl border border-[var(--color-terracotta)] text-xs font-bold cursor-pointer btn-spring transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 bg-white text-[var(--color-terracotta)] hover:bg-[#ffebe6]"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <Icon icon="doodle:close" width={14} height={14} />
                <span>{closing ? 'Closing...' : 'Close Feedback Session'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={activating || !sessionTitleInput.trim()}
                onClick={handleActivate}
                className="w-full py-2.5 px-4 rounded-xl border border-[var(--color-forest-ink)] text-xs font-bold cursor-pointer btn-spring transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--color-forest-ink)',
                  color: 'var(--color-cream-paper)',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                <StickerIcon name="star" size={16} />
                <span>{activating ? 'Activating...' : 'Activate Feedback →'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
