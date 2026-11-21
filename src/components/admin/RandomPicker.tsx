import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import FilterPills from '../ui/FilterPills';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';

interface Member {
  id: string;
  name: string;
  avatarId: string;
  customAvatarUrl?: string | null;
  track: 'Design' | 'Content';
  role?: string;
}

const FILTERS = ['All', 'Design', 'Content'];

export default function RandomPicker() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState('All');
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Member | null>(null);
  const [displayName, setDisplayName] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Member))
        // Exclude admin coordinator
        .filter((m) => m.role !== 'admin' && m.name?.trim().toLowerCase() !== 'yousef ehab');
      data.sort((a, b) => a.name.localeCompare(b.name));
      setMembers(data);
    });
    return unsub;
  }, []);

  const filtered = members.filter((m) => {
    if (filter === 'Design') return m.track === 'Design';
    if (filter === 'Content') return m.track === 'Content';
    return true;
  });

  const pick = useCallback(() => {
    if (filtered.length === 0) return;
    const chosen = filtered[Math.floor(Math.random() * filtered.length)];

    if (prefersReducedMotion.current) {
      setWinner(chosen);
      setDisplayName(chosen.name);
      return;
    }

    setSpinning(true);
    setWinner(null);
    let count = 0;
    const totalTicks = 20;

    intervalRef.current = setInterval(() => {
      const random = filtered[Math.floor(Math.random() * filtered.length)];
      setDisplayName(random.name);
      count++;
      if (count >= totalTicks) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayName(chosen.name);
        setWinner(chosen);
        setSpinning(false);
      }
    }, 75 + count * 8);
  }, [filtered]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div
      className="p-4 sm:p-5"
      style={{
        backgroundColor: 'var(--color-cream-paper)',
        border: '1px solid var(--color-forest-ink)',
        borderRadius: 'var(--radius-cards)',
      }}
    >
      <div className="mb-4 pb-3 border-b border-[var(--color-pencil-gray)]">
        <h4
          className="text-base font-bold flex items-center gap-2"
          style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
        >
          <Icon icon="doodle:dice" width={18} height={18} className="shrink-0" />
          Session Random Picker
        </h4>
        <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}>
          Spin to fairly pick a member for design critique, session icebreaker, or live showcase.
        </p>
      </div>

      <div className="max-w-md mx-auto flex flex-col items-center">
        {/* Track filter */}
        <div className="mb-3 w-full flex justify-center">
          <FilterPills options={FILTERS} active={filter} onChange={setFilter} />
        </div>

        <p className="text-xs mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pencil-gray)' }}>
          {filtered.length} committee member{filtered.length !== 1 ? 's' : ''} in pool
        </p>

        {/* Roulette stage card */}
        <div
          className="w-full flex flex-col items-center justify-center py-8 px-4 mb-4 transition-all"
          style={{
            minHeight: '180px',
            backgroundColor: winner
              ? winner.track === 'Design'
                ? 'var(--color-sticky-note-mint)'
                : 'var(--color-sticky-note-teal)'
              : 'var(--color-cream-paper)',
            border: '2px solid var(--color-forest-ink)',
            borderRadius: 'var(--radius-cards)',
          }}
        >
          {winner ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-200">
              <StudioAvatar avatarId={winner.avatarId} customAvatarUrl={winner.customAvatarUrl} size={72} />
              <p
                className="text-xl font-bold mt-3 text-center"
                style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
              >
                {winner.name}
              </p>
              <div className="mt-1.5">
                <TrackBadge track={winner.track} />
              </div>
            </div>
          ) : spinning ? (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full border-2 border-[var(--color-forest-ink)] bg-[var(--color-highlighter-yellow)] flex items-center justify-center animate-bounce">
                <Icon icon="doodle:dice" width={28} height={28} />
              </div>
              <p
                className="text-lg font-bold mt-3"
                style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)', opacity: 0.6 }}
              >
                {displayName || 'Shuffling...'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center opacity-60">
              <Icon icon="doodle:dice" width={36} height={36} className="mb-2" />
              <p className="text-xs font-medium" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
                Press the button below to pick a member
              </p>
            </div>
          )}
        </div>

        <button
          onClick={pick}
          disabled={spinning || filtered.length === 0}
          className="w-full py-3 text-sm font-bold cursor-pointer btn-spring"
          style={{
            fontFamily: 'var(--font-inter)',
            backgroundColor: 'var(--color-forest-ink)',
            color: 'var(--color-cream-paper)',
            border: 'none',
            borderRadius: 'var(--radius-buttons)',
            opacity: spinning || filtered.length === 0 ? 0.4 : 1,
          }}
        >
          {spinning ? 'Selecting...' : 'Pick Random Member \u2192'}
        </button>
      </div>
    </div>
  );
}
