import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import FilterPills from '../ui/FilterPills';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import { isExcludedMember } from '../../utils/accounts';
import SketchCallout from '../ui/SketchCallout';

interface Member {
  id: string;
  name: string;
  avatarId: string;
  customAvatarUrl?: string | null;
  track: 'Design' | 'Content';
  role?: string;
  points?: number;
}

const FILTERS = ['All', 'Design', 'Content'];

// Confetti colors matching SayBriefly sketchbook palette
const CONFETTI_COLORS = [
  'var(--color-highlighter-yellow)',
  'var(--color-sticky-note-mint)',
  'var(--color-sticky-note-teal)',
  'var(--color-sticky-note-blush)',
  'var(--color-terracotta)',
  'var(--color-forest-ink)',
];

// Audio synthesized effects for live workshops with dynamic pitch
function playWheelClick(frequency = 550, duration = 0.04) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.45, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio permission restrictions
  }
}

function playWinFanfare() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    // 5-note victory fanfare arpeggio (C5 -> E5 -> G5 -> C6 -> E6)
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.14, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.36);
    });
  } catch {
    // Ignore audio context restrictions
  }
}

/**
 * Animated falling paper confetti burst
 */
function ConfettiBurst() {
  const pieces = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    left: `${(i / 24) * 100}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${(i % 5) * 0.08}s`,
    size: i % 2 === 0 ? 'w-2 h-3' : 'w-2.5 h-2.5 rounded-full',
    drift: (i % 2 === 0 ? 1 : -1) * (15 + (i % 4) * 10),
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-20">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`absolute -top-4 animate-confetti ${p.size}`}
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            transform: `translateX(${p.drift}px)`,
          }}
        />
      ))}
    </div>
  );
}

export default function RandomPicker() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState('All');
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Member | null>(null);

  // Active items visible in the slot reel (previous, current, next)
  const [currentSlotMember, setCurrentSlotMember] = useState<Member | null>(null);
  const [prevSlotMember, setPrevSlotMember] = useState<Member | null>(null);
  const [nextSlotMember, setNextSlotMember] = useState<Member | null>(null);

  // Suspense progress meter & stage text
  const [spinProgress, setSpinProgress] = useState(0);
  const [suspenseText, setSuspenseText] = useState('');
  const [pointerTick, setPointerTick] = useState(false);

  // Workshop session settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stageMode, setStageMode] = useState(false);
  const [excludePicked, setExcludePicked] = useState(true);
  const [pickedHistory, setPickedHistory] = useState<Member[]>([]);

  // Quick point awarding
  const [awardingPoints, setAwardingPoints] = useState(false);
  const [awardedFeedback, setAwardedFeedback] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Real-time member pool listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Member))
        // Exclude admin coordinator, HR, and test accounts
        .filter((m) => !isExcludedMember(m));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setMembers(data);
    });
    return unsub;
  }, []);

  // Filter pool by track
  const trackFiltered = members.filter((m) => {
    if (filter === 'Design') return m.track === 'Design';
    if (filter === 'Content') return m.track === 'Content';
    return true;
  });

  // Filter out already picked members if "without replacement" is enabled
  const pickedIds = new Set(pickedHistory.map((p) => p.id));
  const availablePool = excludePicked
    ? trackFiltered.filter((m) => !pickedIds.has(m.id))
    : trackFiltered;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Slower, multi-stage dramatic spin with gradual deceleration curve
  const spin = useCallback(() => {
    if (availablePool.length === 0 || spinning) return;

    // Pick final winner randomly from the available pool
    const chosenWinner = availablePool[Math.floor(Math.random() * availablePool.length)];

    if (prefersReducedMotion.current) {
      setWinner(chosenWinner);
      setCurrentSlotMember(chosenWinner);
      setPickedHistory((prev) => [chosenWinner, ...prev]);
      if (soundEnabled) playWinFanfare();
      return;
    }

    setSpinning(true);
    setWinner(null);
    setAwardedFeedback(null);
    setSpinProgress(0);

    // Multi-phase deceleration schedule (~5.2 seconds total, 31 ticks)
    // Phase 1 (1.5s): High-speed blur (45ms to 120ms)
    // Phase 2 (2.0s): Gradual braking (140ms to 420ms)
    // Phase 3 (1.7s): Heart-pounding cliffhanger crawl (520ms to 1050ms)
    const delays = [
      // Phase 1: High-Speed Rapid Spin
      45, 45, 50, 50, 55, 60, 65, 70, 75, 85, 95, 110, 130,
      // Phase 2: Noticeable Braking & Deceleration
      155, 185, 220, 265, 320, 385, 460, 540,
      // Phase 3: The Suspense Crawl (Near-Miss Final Candidates)
      630, 730, 840, 960, 1100,
    ];

    let step = 0;
    const totalSteps = delays.length;

    const tick = () => {
      // Pick random candidates for the 3-tier slot reel
      const activeIdx = Math.floor(Math.random() * trackFiltered.length);
      const prevIdx = (activeIdx - 1 + trackFiltered.length) % trackFiltered.length;
      const nextIdx = (activeIdx + 1) % trackFiltered.length;

      const randomActive = trackFiltered[activeIdx];
      const randomPrev = trackFiltered[prevIdx];
      const randomNext = trackFiltered[nextIdx];

      setPrevSlotMember(randomPrev);
      setNextSlotMember(randomNext);
      setCurrentSlotMember(randomActive);

      // Trigger pointer flapper animation
      setPointerTick((prev) => !prev);

      // Calculate progress percentage
      const progressPercent = Math.round(((step + 1) / totalSteps) * 100);
      setSpinProgress(progressPercent);

      // Contextual suspense caption
      if (step < 8) {
        setSuspenseText('🌀 Accelerating the wheel...');
      } else if (step < 16) {
        setSuspenseText('⚡ Shuffling candidate pool...');
      } else if (step < 22) {
        setSuspenseText('👀 Slowing down... almost there!');
      } else {
        setSuspenseText('🎯 Who is going to be in the spotlight?!');
      }

      // Audio frequency lowers as wheel decelerates (from 680Hz down to 320Hz)
      if (soundEnabled) {
        const pitchProgress = step / totalSteps;
        const currentPitch = Math.round(680 - pitchProgress * 360);
        const clickDuration = 0.035 + pitchProgress * 0.045;
        playWheelClick(currentPitch, clickDuration);
      }

      step++;

      if (step < totalSteps) {
        timeoutRef.current = setTimeout(tick, delays[step]);
      } else {
        // Landing precisely on the chosen winner!
        setCurrentSlotMember(chosenWinner);
        setWinner(chosenWinner);
        setSpinning(false);
        setSpinProgress(100);
        setSuspenseText('🎉 Winner locked in!');
        setPickedHistory((prev) => [chosenWinner, ...prev]);
        if (soundEnabled) playWinFanfare();
      }
    };

    tick();
  }, [availablePool, spinning, trackFiltered, soundEnabled]);

  // Award points to current winner directly
  async function handleAwardPoints(amount: number, reason: string) {
    if (!winner || awardingPoints) return;
    setAwardingPoints(true);
    try {
      const userRef = doc(db, 'users', winner.id);
      await addDoc(collection(db, 'pointEvents'), {
        userId: winner.id,
        amount,
        reason: `Live Workshop — ${reason}`,
        createdAt: Timestamp.now(),
      });
      await updateDoc(userRef, {
        points: increment(amount),
      });

      setAwardedFeedback(`+${amount} PTS awarded!`);
      setTimeout(() => setAwardedFeedback(null), 3500);
    } catch (err) {
      console.error('Error awarding points:', err);
      alert('Failed to award points.');
    } finally {
      setAwardingPoints(false);
    }
  }

  function handleResetPool() {
    setPickedHistory([]);
    setWinner(null);
    setAwardedFeedback(null);
    setSpinProgress(0);
    setSuspenseText('');
  }

  return (
    <div
      className={`transition-all duration-300 ${
        stageMode
          ? 'fixed inset-0 z-50 p-6 sm:p-10 overflow-y-auto flex flex-col items-center justify-center'
          : 'p-4 sm:p-5'
      }`}
      style={{
        backgroundColor: 'var(--color-cream-paper)',
        border: stageMode ? 'none' : '1px solid var(--color-forest-ink)',
        borderRadius: stageMode ? 0 : 'var(--radius-cards)',
      }}
    >
      {/* Header & Controls Bar */}
      <div
        className={`w-full ${
          stageMode ? 'max-w-2xl' : ''
        } mb-4 pb-3 border-b border-[var(--color-pencil-gray)] flex flex-wrap items-center justify-between gap-3`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h4
              className="text-base sm:text-lg font-bold flex items-center gap-2"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
            >
              <Icon icon="doodle:dice" width={22} height={22} className="shrink-0 text-forest-ink" />
              Live Workshop Random Picker
            </h4>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase"
              style={{
                backgroundColor: 'var(--color-highlighter-yellow)',
                color: 'var(--color-forest-ink)',
              }}
            >
              Spotlight Wheel
            </span>
          </div>
          <p
            className="text-xs mt-0.5"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}
          >
            Slower dramatic spin with audio clicks for live sessions, design critiques, and showcases.
          </p>
        </div>

        {/* Stage & Sound Controls */}
        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="p-1.5 rounded-md border border-[var(--color-pencil-gray)] hover:bg-[#1a3300]/5 text-xs font-semibold btn-spring flex items-center gap-1 cursor-pointer"
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            style={{ color: 'var(--color-forest-ink)' }}
          >
            <Icon icon={soundEnabled ? 'doodle:volume-2' : 'doodle:volume-x'} width={16} height={16} />
            <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Spotlight Stage Toggle */}
          <button
            type="button"
            onClick={() => setStageMode((v) => !v)}
            className="px-2.5 py-1.5 rounded-md border border-forest-ink text-xs font-bold btn-spring flex items-center gap-1.5 cursor-pointer shadow-2xs"
            style={{
              backgroundColor: stageMode ? 'var(--color-forest-ink)' : 'var(--color-cream-paper)',
              color: stageMode ? 'var(--color-cream-paper)' : 'var(--color-forest-ink)',
            }}
          >
            <Icon icon="doodle:maximize" width={14} height={14} />
            <span>{stageMode ? 'Exit Stage' : 'Spotlight Stage'}</span>
          </button>
        </div>
      </div>

      <div className={`w-full ${stageMode ? 'max-w-2xl' : 'max-w-md'} mx-auto flex flex-col items-center`}>
        {/* Track Filter Pills */}
        <div className="mb-3 w-full flex justify-center">
          <FilterPills options={FILTERS} active={filter} onChange={setFilter} />
        </div>

        {/* Pool Metadata & Options */}
        <div
          className="flex items-center justify-between w-full text-xs mb-2.5 px-1"
          style={{ color: 'var(--color-forest-ink)' }}
        >
          <span className="font-mono font-medium" style={{ color: 'var(--color-pencil-gray)' }}>
            {availablePool.length} of {trackFiltered.length} candidates left
          </span>

          <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium">
            <input
              type="checkbox"
              checked={excludePicked}
              onChange={(e) => setExcludePicked(e.target.checked)}
              className="rounded accent-[var(--color-forest-ink)] cursor-pointer"
            />
            <span>No duplicates</span>
          </label>
        </div>

        {/* Suspense Progress Bar during spinning */}
        {spinning && (
          <div className="w-full mb-3 flex flex-col gap-1 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px] font-mono text-forest-ink font-semibold">
              <span className="animate-pulse">{suspenseText}</span>
              <span>{spinProgress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-pencil-gray/30 overflow-hidden">
              <div
                className="h-full bg-forest-ink transition-all duration-100 ease-out"
                style={{ width: `${spinProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Stage Card / Slot Reel Display */}
        <div
          className={`w-full flex flex-col items-center justify-center p-6 sm:p-8 mb-4 transition-all duration-300 relative card-spring overflow-hidden ${
            spinning ? 'ring-3 ring-[var(--color-highlighter-yellow)]' : ''
          }`}
          style={{
            minHeight: stageMode ? '310px' : '240px',
            backgroundColor: winner
              ? winner.track === 'Design'
                ? 'var(--color-sticky-note-mint)'
                : 'var(--color-sticky-note-teal)'
              : spinning
              ? '#fffdf9'
              : 'var(--color-cream-paper)',
            border: '2px solid var(--color-forest-ink)',
            borderRadius: 'var(--radius-cards)',
            boxShadow: winner
              ? '0 10px 30px rgba(26, 51, 0, 0.15)'
              : '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Confetti Celebration on Winner Reveal */}
          {winner && <ConfettiBurst />}

          {/* ════════════════════════════════════════════════════════════════
              STATE 1: WINNER REVEALED
             ════════════════════════════════════════════════════════════════ */}
          {winner ? (
            <div className="flex flex-col items-center text-center animate-winner-stamp w-full relative z-10">
              {/* Hand-drawn celebration callout */}
              <div className="absolute -top-12 select-none pointer-events-none">
                <SketchCallout
                  text="you're in the spotlight!"
                  arrow="down-right"
                  color="#cb5521"
                  rotate="-rotate-2"
                  fontSize={19}
                  arrowPosition="right"
                />
              </div>

              {/* Avatar with celebratory badge */}
              <div className="relative mb-2 mt-1">
                <StudioAvatar
                  avatarId={winner.avatarId}
                  customAvatarUrl={winner.customAvatarUrl}
                  size={stageMode ? 100 : 80}
                  className="ring-4 ring-forest-ink ring-offset-2 shadow-lg"
                />
                <span
                  className="absolute -top-2 -right-2 text-xl select-none animate-bounce"
                  style={{ animationDuration: '2s' }}
                >
                  ⭐
                </span>
                <span
                  className="absolute -bottom-1 -left-1 text-sm select-none"
                  style={{ animationDuration: '2s' }}
                >
                  🎉
                </span>
              </div>

              {/* Winner Name */}
              <h3
                className={`${
                  stageMode ? 'text-3xl' : 'text-2xl'
                } font-extrabold tracking-tight text-forest-ink mt-2`}
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {winner.name}
              </h3>

              {/* Track Badge + Points */}
              <div className="mt-1.5 flex items-center gap-2">
                <TrackBadge track={winner.track} />
                {winner.points !== undefined && (
                  <span
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded shadow-2xs"
                    style={{
                      backgroundColor: 'var(--color-highlighter-yellow)',
                      color: 'var(--color-forest-ink)',
                      border: '1px solid rgba(26, 51, 0, 0.15)',
                    }}
                  >
                    {winner.points} pts
                  </span>
                )}
              </div>

              {/* Quick Point Awarding Bar */}
              <div className="mt-4 pt-3 border-t border-[var(--color-forest-ink)]/20 w-full flex flex-col items-center">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2 opacity-70">
                  Quick Session Points
                </p>

                {awardedFeedback ? (
                  <div className="text-xs font-bold text-forest-ink bg-[var(--color-highlighter-yellow)] px-3 py-1.5 rounded-md animate-in fade-in flex items-center gap-1.5 border border-forest-ink shadow-xs">
                    <Icon icon="doodle:check" width={16} height={16} />
                    {awardedFeedback}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={awardingPoints}
                      onClick={() => handleAwardPoints(10, 'Live Participation')}
                      className="px-3 py-1.5 text-xs font-bold rounded-md bg-[#fcfaf5] border border-forest-ink text-forest-ink hover:bg-[var(--color-highlighter-yellow)] btn-spring cursor-pointer shadow-2xs"
                    >
                      +10 Participation
                    </button>
                    <button
                      type="button"
                      disabled={awardingPoints}
                      onClick={() => handleAwardPoints(15, 'Brilliant Critique')}
                      className="px-3 py-1.5 text-xs font-bold rounded-md bg-[#fcfaf5] border border-forest-ink text-forest-ink hover:bg-[var(--color-highlighter-yellow)] btn-spring cursor-pointer shadow-2xs"
                    >
                      +15 Great Critique
                    </button>
                    <button
                      type="button"
                      disabled={awardingPoints}
                      onClick={() => handleAwardPoints(5, 'Question Answered')}
                      className="px-3 py-1.5 text-xs font-bold rounded-md bg-[#fcfaf5] border border-forest-ink text-forest-ink hover:bg-[var(--color-highlighter-yellow)] btn-spring cursor-pointer shadow-2xs"
                    >
                      +5 Answer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : spinning && currentSlotMember ? (
            /* ════════════════════════════════════════════════════════════════
                STATE 2: DRAMATIC ROLLING SLOT-MACHINE REEL
               ════════════════════════════════════════════════════════════════ */
            <div className="flex flex-col items-center justify-center w-full py-1 relative">
              {/* Mechanical Flapper Pointers (Left and Right) */}
              <div
                key={`flapper-left-${pointerTick}`}
                className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-20 animate-flick-left pointer-events-none"
              >
                <span
                  className="px-2 py-1 text-xs font-mono font-bold rounded border border-forest-ink shadow-xs"
                  style={{
                    backgroundColor: 'var(--color-highlighter-yellow)',
                    color: 'var(--color-forest-ink)',
                  }}
                >
                  ▶
                </span>
              </div>

              <div
                key={`flapper-right-${pointerTick}`}
                className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-20 animate-flick-right pointer-events-none"
              >
                <span
                  className="px-2 py-1 text-xs font-mono font-bold rounded border border-forest-ink shadow-xs"
                  style={{
                    backgroundColor: 'var(--color-highlighter-yellow)',
                    color: 'var(--color-forest-ink)',
                  }}
                >
                  ◀
                </span>
              </div>

              {/* Peeking Previous Candidate (Top) */}
              {prevSlotMember && (
                <div className="opacity-25 scale-75 transform -translate-y-2 select-none pointer-events-none flex items-center gap-2">
                  <StudioAvatar
                    avatarId={prevSlotMember.avatarId}
                    customAvatarUrl={prevSlotMember.customAvatarUrl}
                    size={36}
                  />
                  <span className="text-xs font-semibold text-forest-ink truncate max-w-[120px]">
                    {prevSlotMember.name}
                  </span>
                </div>
              )}

              {/* Active Centered Candidate with Reel Slide Keyframe */}
              <div
                key={currentSlotMember.id}
                className="flex flex-col items-center text-center animate-reel-item my-2 px-6 py-3 rounded-xl border border-forest-ink/25 bg-[#fcfaf5] shadow-xs max-w-[260px] w-full"
              >
                <div className="relative mb-2">
                  <StudioAvatar
                    avatarId={currentSlotMember.avatarId}
                    customAvatarUrl={currentSlotMember.customAvatarUrl}
                    size={stageMode ? 86 : 68}
                    className="ring-2 ring-forest-ink ring-offset-2"
                  />
                </div>
                <p
                  className={`${
                    stageMode ? 'text-2xl' : 'text-lg'
                  } font-extrabold tracking-tight text-forest-ink truncate w-full`}
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {currentSlotMember.name}
                </p>
                <div className="mt-1">
                  <TrackBadge track={currentSlotMember.track} size="sm" />
                </div>
              </div>

              {/* Peeking Next Candidate (Bottom) */}
              {nextSlotMember && (
                <div className="opacity-25 scale-75 transform translate-y-2 select-none pointer-events-none flex items-center gap-2">
                  <StudioAvatar
                    avatarId={nextSlotMember.avatarId}
                    customAvatarUrl={nextSlotMember.customAvatarUrl}
                    size={36}
                  />
                  <span className="text-xs font-semibold text-forest-ink truncate max-w-[120px]">
                    {nextSlotMember.name}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* ════════════════════════════════════════════════════════════════
                STATE 3: IDLE READY STATE
               ════════════════════════════════════════════════════════════════ */
            <div className="flex flex-col items-center text-center opacity-75">
              <div className="w-16 h-16 rounded-full border-2 border-[var(--color-forest-ink)] bg-[var(--color-highlighter-yellow)]/50 flex items-center justify-center mb-2 shadow-2xs">
                <Icon icon="doodle:dice" width={32} height={32} className="text-forest-ink" />
              </div>
              <p
                className="text-sm font-bold"
                style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
              >
                {availablePool.length === 0
                  ? 'All members have participated!'
                  : 'Ready to spin the spotlight wheel'}
              </p>
              <p className="text-xs text-pencil-gray mt-0.5">
                {availablePool.length === 0
                  ? 'Click "Reset Pool" below to start another round'
                  : 'Tap below to start the dramatic suspense spin'}
              </p>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="w-full flex gap-2">
          {availablePool.length === 0 ? (
            <button
              type="button"
              onClick={handleResetPool}
              className="w-full py-3 text-sm font-bold cursor-pointer btn-spring rounded-[var(--radius-buttons)] flex items-center justify-center gap-2 border border-forest-ink"
              style={{
                backgroundColor: 'var(--color-sticky-note-mint)',
                color: 'var(--color-forest-ink)',
              }}
            >
              <Icon icon="doodle:rotate-ccw" width={16} height={16} />
              Reset Pool for Next Round
            </button>
          ) : (
            <button
              type="button"
              onClick={spin}
              disabled={spinning}
              className="flex-1 py-3 text-sm font-bold cursor-pointer btn-spring flex items-center justify-center gap-2 shadow-sm"
              style={{
                fontFamily: 'var(--font-inter)',
                backgroundColor: 'var(--color-forest-ink)',
                color: 'var(--color-cream-paper)',
                border: 'none',
                borderRadius: 'var(--radius-buttons)',
                opacity: spinning ? 0.6 : 1,
              }}
            >
              <Icon icon="doodle:dice" width={18} height={18} />
              <span>
                {spinning
                  ? 'Selecting Lucky Member...'
                  : winner
                  ? 'Spin Next Member ↻'
                  : 'Spin Spotlight Wheel →'}
              </span>
            </button>
          )}

          {pickedHistory.length > 0 && (
            <button
              type="button"
              onClick={handleResetPool}
              title="Clear session picked history"
              className="px-3 py-3 rounded-[var(--radius-buttons)] border border-[var(--color-pencil-gray)] hover:bg-[#1a3300]/5 text-xs font-semibold btn-spring flex items-center justify-center cursor-pointer"
              style={{ color: 'var(--color-forest-ink)' }}
            >
              <Icon icon="doodle:trash" width={16} height={16} />
            </button>
          )}
        </div>

        {/* Picked History Bar */}
        {pickedHistory.length > 0 && (
          <div className="w-full mt-4 pt-3 border-t border-[var(--color-pencil-gray)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-forest-ink uppercase tracking-wider">
                Picked This Workshop ({pickedHistory.length})
              </span>
              <button
                type="button"
                onClick={handleResetPool}
                className="text-[11px] underline text-pencil-gray hover:text-forest-ink cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {pickedHistory.map((m, idx) => (
                <span
                  key={`${m.id}-${idx}`}
                  className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border border-forest-ink/30 bg-[#fcfaf5] text-forest-ink shadow-2xs"
                >
                  <StudioAvatar avatarId={m.avatarId} customAvatarUrl={m.customAvatarUrl} size={16} />
                  <span className="font-medium truncate max-w-[100px]">{m.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
