import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import TierBadge from '../ui/TierBadge';

interface Props {
  rank: number;
  name: string;
  avatarId: string;
  customAvatarUrl?: string | null;
  track: 'Design' | 'Content';
  points: number;
  isCurrentUser: boolean;
}

/**
 * Single row in the leaderboard ranked list (below podium).
 */
export default function LeaderboardRow({
  rank,
  name,
  avatarId,
  customAvatarUrl,
  track,
  points,
  isCurrentUser,
}: Props) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        backgroundColor: isCurrentUser ? 'rgba(168, 229, 229, 0.15)' : 'var(--color-cream-paper)',
        border: isCurrentUser ? '2px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
        borderRadius: 'var(--radius-cards)',
      }}
    >
      {/* Rank */}
      <span
        className="text-sm font-normal w-8 text-center shrink-0"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)' }}
      >
        #{rank}
      </span>

      {/* Avatar */}
      <StudioAvatar avatarId={avatarId} customAvatarUrl={customAvatarUrl} size={36} />

      {/* Name + Track */}
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-semibold truncate"
          style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
        >
          {isCurrentUser ? `${name} (You)` : name}
        </p>
        <TrackBadge track={track} size="sm" />
      </div>

      {/* Tier + Points */}
      <div className="flex items-center gap-2 shrink-0">
        <TierBadge points={points} showName={false} size="sm" />
        <span
          className="text-xs font-medium px-1.5 py-0.5"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-forest-ink)',
            backgroundColor: 'var(--color-highlighter-yellow)',
            borderRadius: 'var(--radius-buttons)',
          }}
        >
          {points}
        </span>
      </div>
    </div>
  );
}
