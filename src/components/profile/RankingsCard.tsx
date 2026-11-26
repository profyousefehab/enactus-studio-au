import { useSession } from '../../context/SessionContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { isExcludedMember } from '../../utils/accounts';

interface RankData {
  overallRank: number;
  totalMembers: number;
  trackRank: number;
  trackTotal: number;
}

/**
 * Row 3 Left — Unified Tall Rank Card
 */
export default function RankingsCard() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [ranks, setRanks] = useState<RankData | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users'), orderBy('points', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      // Exclude admin coordinator, HR, and test accounts from member ranking calculations
      const memberUsers = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u: any) => !isExcludedMember(u)) as Array<{
          id: string;
          track: string;
          points: number;
        }>;

      const overallRank = memberUsers.findIndex((u) => u.id === user.id) + 1;
      const trackUsers = memberUsers.filter((u) => u.track === user.track);
      const trackRank = trackUsers.findIndex((u) => u.id === user.id) + 1;

      setRanks({
        overallRank: overallRank || memberUsers.length,
        totalMembers: memberUsers.length,
        trackRank: trackRank || trackUsers.length,
        trackTotal: trackUsers.length,
      });
    });

    return unsub;
  }, [user]);

  if (!user || !ranks) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/leaderboard')}
      className="p-5 min-h-[140px] w-full text-left flex flex-col justify-between card-spring cursor-pointer active:scale-[0.98] transition-all rounded-xl border border-[var(--color-forest-ink)]"
      style={{
        backgroundColor: 'var(--color-cream-paper)',
        fontFamily: 'var(--font-inter)',
      }}
      title="View Leaderboard Rankings"
    >
      {/* Top: #1 Overall (of 9) */}
      <div className="w-full">
        <div className="flex items-baseline justify-between gap-1">
          <span
            className="text-2xl font-bold text-[var(--color-forest-ink)] leading-none"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            #{ranks.overallRank}
          </span>
          <span
            className="text-xs font-medium text-[var(--color-forest-ink)]/65"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            of {ranks.totalMembers}
          </span>
        </div>
        <p
          className="text-xs font-semibold text-[var(--color-forest-ink)] mt-1"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Overall Rank
        </p>
      </div>

      {/* Subtle Horizontal Divider */}
      <div className="w-full h-px bg-[var(--color-pencil-gray)]/50 my-1.5" />

      {/* Bottom: #1 Track (of 5) */}
      <div className="w-full">
        <div className="flex items-baseline justify-between gap-1">
          <span
            className="text-xl font-bold text-[var(--color-forest-ink)] leading-none"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            #{ranks.trackRank}
          </span>
          <span
            className="text-xs font-medium text-[var(--color-forest-ink)]/65"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            of {ranks.trackTotal}
          </span>
        </div>
        <p
          className="text-xs font-semibold text-[var(--color-forest-ink)] mt-1"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          In {user.track}
        </p>
      </div>
    </button>
  );
}
