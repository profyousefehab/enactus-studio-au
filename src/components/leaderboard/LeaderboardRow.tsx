import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import TierBadge from '../ui/TierBadge';
import AnimatedCounter from '../ui/AnimatedCounter';

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
 * Features smooth spring micro-interaction and animated point counter.
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
  const formattedRank = `#${rank.toString().padStart(2, '0')}`;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 card-spring cursor-default"
      style={{
        backgroundColor: isCurrentUser ? 'rgba(168, 229, 229, 0.22)' : 'var(--color-cream-paper)',
        border: isCurrentUser ? '2px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
        borderRadius: 'var(--radius-cards)',
      }}
    >
      {/* Rank Badge beside user photo */}
      <div className="shrink-0 flex items-center justify-center min-w-[38px]">
        <span
          className="text-xs font-bold px-2 py-1 rounded-md min-w-[38px] text-center inline-block tracking-tight"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-forest-ink)',
            backgroundColor: isCurrentUser ? 'rgba(26, 51, 0, 0.12)' : 'rgba(26, 51, 0, 0.06)',
            border: '1px solid rgba(26, 51, 0, 0.25)',
          }}
        >
          {formattedRank}
        </span>
      </div>

      {/* Avatar */}
      <StudioAvatar
        avatarId={avatarId}
        customAvatarUrl={customAvatarUrl}
        size={38}
        className={isCurrentUser ? 'ring-2 ring-[var(--color-forest-ink)] ring-offset-1' : ''}
      />

      {/* Name + Track */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className="text-sm font-semibold truncate"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
          >
            {name}
          </p>
          {isCurrentUser && (
            <span
              className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded shrink-0"
              style={{
                backgroundColor: 'var(--color-forest-ink)',
                color: 'var(--color-cream-paper)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              You
            </span>
          )}
        </div>
        <div className="mt-0.5">
          <TrackBadge track={track} size="sm" />
        </div>
      </div>

      {/* Tier + Animated Points Counter */}
      <div className="flex items-center gap-2 shrink-0">
        <TierBadge points={points} showName={false} size="sm" />
        <span
          className="text-xs font-semibold px-2 py-0.5 inline-flex items-center justify-center min-w-[52px]"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-forest-ink)',
            backgroundColor: 'var(--color-highlighter-yellow)',
            borderRadius: 'var(--radius-buttons)',
            border: '1px solid rgba(26, 51, 0, 0.15)',
          }}
        >
          <AnimatedCounter value={points} suffix=" pts" />
        </span>
      </div>
    </div>
  );
}
