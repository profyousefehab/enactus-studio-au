import StudioAvatar from '../ui/StudioAvatar';
import TierBadge from '../ui/TierBadge';
import SketchCallout from '../ui/SketchCallout';

interface PodiumMember {
  id: string;
  name: string;
  avatarId: string;
  customAvatarUrl?: string | null;
  points: number;
}

interface Props {
  members: PodiumMember[];
}

const PODIUM_CONFIG = [
  { rank: 2, bg: 'var(--color-sticky-note-teal)', order: 0, height: 160 },
  { rank: 1, bg: 'var(--color-sticky-note-mint)', order: 1, height: 180 },
  { rank: 3, bg: 'var(--color-sticky-note-blush)', order: 2, height: 140 },
];

/**
 * Top-3 podium cards for the leaderboard.
 * Layout: #2 (Teal, left) | #1 (Mint, center, tallest) | #3 (Blush, right)
 */
export default function PodiumCards({ members }: Props) {
  if (members.length === 0) return null;

  // Reorder for podium layout: [#2, #1, #3]
  const podiumOrder = [members[1], members[0], members[2]].filter(Boolean);

  return (
    <div className="flex items-end gap-3 justify-center px-2 pt-7">
      {podiumOrder.map((member, idx) => {
        const config = PODIUM_CONFIG[idx];
        if (!member) return null;

        return (
          <div
            key={member.id}
            className="flex-1 flex flex-col items-center p-3 text-center relative"
            style={{
              backgroundColor: config.bg,
              border: '1px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-cards)',
              minHeight: config.height,
              maxWidth: 140,
              order: config.order,
            }}
          >
            {/* Rank 1 handwritten annotation above the card */}
            {config.rank === 1 && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 select-none pointer-events-none whitespace-nowrap">
                <SketchCallout
                  text="top of the team"
                  arrow="down-right"
                  color="#cb5521"
                  rotate="-rotate-2"
                  fontSize={21}
                  arrowPosition="right"
                />
              </div>
            )}

            {/* Rank */}
            <span
              className="text-lg font-normal mb-2"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)' }}
            >
              #{config.rank}
            </span>

            {/* Avatar */}
            <StudioAvatar
              avatarId={member.avatarId}
              customAvatarUrl={member.customAvatarUrl}
              size={config.rank === 1 ? 56 : 44}
            />

            {/* Name */}
            <p
              className="text-xs font-semibold mt-2 truncate w-full"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
            >
              {member.name}
            </p>

            {/* Tier + Points */}
            <div className="mt-1 flex flex-col items-center gap-0.5">
              <TierBadge points={member.points} showName={false} size="sm" />
              <span
                className="text-xs font-medium px-1.5 py-0.5"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-forest-ink)',
                  backgroundColor: 'var(--color-highlighter-yellow)',
                  borderRadius: 'var(--radius-buttons)',
                }}
              >
                {member.points} pts
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
