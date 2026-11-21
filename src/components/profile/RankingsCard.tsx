import { useSession } from '../../context/SessionContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface RankData {
  overallRank: number;
  totalMembers: number;
  trackRank: number;
  trackTotal: number;
}

/**
 * Row 3 Left — Unified Tall Rank Card
 * Pure Bricolage Grotesque typography with decreased letter spacing.
 */
export default function RankingsCard() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [ranks, setRanks] = useState<RankData | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users'), orderBy('points', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      // Exclude admin / coordinator from member ranking calculations
      const memberUsers = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u: any) => u.role !== 'admin' && u.name?.trim().toLowerCase() !== 'yousef ehab') as Array<{
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
    <div
      onClick={() => navigate('/leaderboard')}
      role="button"
      tabIndex={0}
      className="p-5 min-h-[140px] flex flex-col justify-between card-spring cursor-pointer active:scale-[0.98] transition-all rounded-2xl border border-[var(--color-forest-ink)] shadow-xs hover:bg-[#fffdf9] profile-bricolage"
      style={{
        backgroundColor: 'var(--color-cream-paper)',
        fontFamily: 'var(--font-bricolage)',
        letterSpacing: '-0.03em',
      }}
      title="View Leaderboard Rankings"
    >
      {/* Top: #1 Overall (of 9) */}
      <div>
        <div className="flex items-baseline justify-between gap-1">
          <span
            className="text-2xl font-extrabold text-[var(--color-forest-ink)] leading-none tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            #{ranks.overallRank}
          </span>
          <span
            className="text-xs font-semibold text-[var(--color-pencil-gray)] tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            of {ranks.totalMembers}
          </span>
        </div>
        <p
          className="text-xs font-bold text-[var(--color-forest-ink)] mt-1 tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-bricolage)' }}
        >
          Overall Rank
        </p>
      </div>

      {/* Subtle Horizontal Divider */}
      <div className="w-full h-px bg-[var(--color-pencil-gray)]/30 my-1.5" />

      {/* Bottom: #1 Track (of 5) */}
      <div>
        <div className="flex items-baseline justify-between gap-1">
          <span
            className="text-xl font-extrabold text-[var(--color-forest-ink)] leading-none tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            #{ranks.trackRank}
          </span>
          <span
            className="text-xs font-semibold text-[var(--color-pencil-gray)] tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            of {ranks.trackTotal}
          </span>
        </div>
        <p
          className="text-xs font-bold text-[var(--color-forest-ink)] mt-1 tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-bricolage)' }}
        >
          In {user.track}
        </p>
      </div>
    </div>
  );
}
