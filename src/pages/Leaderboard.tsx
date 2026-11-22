import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSession } from '../context/SessionContext';
import BricolageHeadline from '../components/ui/BricolageHeadline';
import FilterPills from '../components/ui/FilterPills';
import PodiumCards from '../components/leaderboard/PodiumCards';
import LeaderboardRow from '../components/leaderboard/LeaderboardRow';
import SkeletonCard from '../components/ui/SkeletonCard';

interface LeaderboardUser {
  id: string;
  name: string;
  avatarId: string;
  customAvatarUrl?: string | null;
  track: 'Design' | 'Content';
  points: number;
}

const FILTERS = ['All Social Media', 'Design', 'Content'];

export default function Leaderboard() {
  const { user } = useSession();
  const location = useLocation();

  const getInitialTrack = () => {
    const param = location.state?.track || new URLSearchParams(location.search).get('track');
    if (param === 'Design' || param === 'Content') return param;
    return 'All Social Media';
  };

  const [filter, setFilter] = useState(getInitialTrack);

  // Sync if navigation state or query changes
  useEffect(() => {
    const param = location.state?.track || new URLSearchParams(location.search).get('track');
    if (param === 'Design' || param === 'Content') {
      setFilter(param);
    } else if (param === 'all' || param === 'All') {
      setFilter('All Social Media');
    }
  }, [location.state, location.search]);
  const [allUsers, setAllUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('points', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          avatarId: doc.data().avatarId,
          customAvatarUrl: doc.data().customAvatarUrl ?? null,
          track: doc.data().track,
          points: doc.data().points ?? 0,
          role: doc.data().role,
        }))
        // Exclude admin coordinator from committee rankings
        .filter((u) => u.role !== 'admin' && u.name?.trim().toLowerCase() !== 'yousef ehab') as LeaderboardUser[];

      setAllUsers(data);
      setLoading(false);
    });

    return unsub;
  }, []);

  // Filter by track
  const filtered = filter === 'All Social Media'
    ? allUsers
    : allUsers.filter((u) => u.track === filter);

  const podiumMembers = filtered.slice(0, 3);
  const restMembers = filtered.slice(3);

  return (
    <div className="p-4 flex flex-col gap-4">
      <BricolageHeadline highlight={['Leaderboard']} className="text-3xl">
        Leaderboard
      </BricolageHeadline>

      {/* Filter pills */}
      <FilterPills options={FILTERS} active={filter} onChange={setFilter} />

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 justify-center">
            <SkeletonCard height={140} className="flex-1" />
            <SkeletonCard height={160} className="flex-1" />
            <SkeletonCard height={120} className="flex-1" />
          </div>
          <SkeletonCard height={56} />
          <SkeletonCard height={56} />
          <SkeletonCard height={56} />
        </div>
      )}

      {/* Podium */}
      {!loading && podiumMembers.length > 0 && (
        <div key={`podium-${filter}`}>
          <PodiumCards members={podiumMembers} currentUserId={user?.id} />
        </div>
      )}

      {/* Ranked list */}
      {!loading && restMembers.length > 0 && (
        <div key={`list-${filter}`} className="flex flex-col gap-2">
          {restMembers.map((member, idx) => (
            <LeaderboardRow
              key={member.id}
              rank={idx + 4}
              name={member.name}
              avatarId={member.avatarId}
              customAvatarUrl={member.customAvatarUrl}
              track={member.track}
              points={member.points}
              isCurrentUser={member.id === user?.id}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div
          className="p-8 text-center"
          style={{
            backgroundColor: 'var(--color-cream-paper)',
            border: '1px solid var(--color-pencil-gray)',
            borderRadius: 'var(--radius-cards)',
          }}
        >
          <p
            className="text-sm"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'var(--color-pencil-gray)',
              fontStyle: 'italic',
            }}
          >
            No members in this track yet.
          </p>
        </div>
      )}
    </div>
  );
}
