import StudioAvatar from '../ui/StudioAvatar';
import TierBadge from '../ui/TierBadge';
import SketchCallout from '../ui/SketchCallout';
import AnimatedCounter from '../ui/AnimatedCounter';

interface PodiumMember {
  id: string;
  name: string;
  avatarId: string;
  customAvatarUrl?: string | null;
  points: number;
}

interface Props {
  members: PodiumMember[];
  currentUserId?: string;
}

const PODIUM_CONFIG = [
  { rank: 2, bg: 'var(--color-sticky-note-teal)', order: 0, height: 168, delay: '120ms', label: '#2' },
  { rank: 1, bg: 'var(--color-sticky-note-mint)', order: 1, height: 196, delay: '0ms', label: '#1' },
  { rank: 3, bg: 'var(--color-sticky-note-blush)', order: 2, height: 148, delay: '220ms', label: '#3' },
];

/**
 * Hand-drawn crown doodle in SayBriefly sketchbook aesthetic.
 */
function CrownDoodle() {
  return (
    <svg
      width="22"
      height="16"
      viewBox="0 0 24 18"
      fill="none"
      className="inline-block select-none pointer-events-none -mb-1"
      aria-hidden="true"
    >
      <path
        d="M 2 15 L 4 4 L 9 10 L 12 2 L 15 10 L 20 4 L 22 15 Z"
        fill="#ffe95c"
        stroke="#1a3300"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="4" cy="4" r="1.4" fill="#1a3300" />
      <circle cx="12" cy="2" r="1.4" fill="#1a3300" />
      <circle cx="20" cy="4" r="1.4" fill="#1a3300" />
    </svg>
  );
}

/**
 * Top-3 podium cards for the leaderboard.
 * Layout: #2 (Teal, left) | #1 (Mint, center, tallest) | #3 (Blush, right)
 * Enhanced with staggered entrance animations, animated point counters,
 * and tactile spring micro-interactions.
 */
export default function PodiumCards({ members, currentUserId }: Props) {
  if (members.length === 0) return null;

  // Pair each member safely with their respective podium config
  const podiumSlots = [
    { member: members[1], config: PODIUM_CONFIG[0] }, // Rank 2 (Teal, Left)
    { member: members[0], config: PODIUM_CONFIG[1] }, // Rank 1 (Mint, Center)
    { member: members[2], config: PODIUM_CONFIG[2] }, // Rank 3 (Blush, Right)
  ].filter((slot) => Boolean(slot.member));

  return (
    <div className="flex items-end gap-3 justify-center px-1 pt-8 pb-1">
      {podiumSlots.map(({ member, config }) => {
        const isMe = member.id === currentUserId;

        return (
          <div
            key={member.id}
            className="flex-1 flex flex-col items-center p-3 text-center relative card-spring animate-podium group cursor-default"
            style={{
              backgroundColor: config.bg,
              border: isMe ? '2px solid var(--color-forest-ink)' : '1px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-cards)',
              minHeight: config.height,
              maxWidth: 140,
              order: config.order,
              animationDelay: config.delay,
              boxShadow: isMe ? '0 4px 12px rgba(26, 51, 0, 0.12)' : undefined,
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

            {/* Rank Label & Crown */}
            <div className="flex flex-col items-center justify-center mb-1.5">
              {config.rank === 1 && <CrownDoodle />}
              <span
                className="text-base font-semibold leading-none tracking-tight flex items-center gap-1"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)' }}
              >
                {config.label}
              </span>
            </div>

            {/* Avatar with pinned rank badge beside photo */}
            <div className="relative inline-block my-1">
              <StudioAvatar
                avatarId={member.avatarId}
                customAvatarUrl={member.customAvatarUrl}
                size={config.rank === 1 ? 58 : 46}
                className={isMe ? 'ring-2 ring-forest-ink ring-offset-2' : ''}
              />
              {/* Pinned Rank Badge */}
              <span
                className="absolute -top-1 -left-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full border border-forest-ink shadow-xs"
                style={{
                  backgroundColor: config.rank === 1 ? 'var(--color-highlighter-yellow)' : 'var(--color-cream-paper)',
                  color: '#1a3300',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: '1',
                }}
              >
                {config.label}
              </span>
              {isMe && (
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full border border-forest-ink shadow-xs"
                  style={{
                    backgroundColor: 'var(--color-forest-ink)',
                    color: 'var(--color-cream-paper)',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: '1.2',
                  }}
                >
                  You
                </span>
              )}
            </div>

            {/* Name */}
            <p
              className="text-xs font-semibold mt-2.5 truncate w-full"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
              title={member.name}
            >
              {member.name}
            </p>

            {/* Tier + Animated Points Counter */}
            <div className="mt-1 flex flex-col items-center gap-1">
              <TierBadge points={member.points} showName={false} size="sm" />
              <span
                className="text-xs font-semibold px-2 py-0.5 inline-flex items-center gap-1"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-forest-ink)',
                  backgroundColor: 'var(--color-highlighter-yellow)',
                  borderRadius: 'var(--radius-buttons)',
                  border: '1px solid rgba(26, 51, 0, 0.18)',
                }}
              >
                <AnimatedCounter value={member.points} suffix=" pts" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
