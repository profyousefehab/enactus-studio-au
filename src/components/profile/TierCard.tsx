import StickerIcon from '../ui/StickerIcon';
import { useSession } from '../../context/SessionContext';
import { getTier, getNextTier, getTierProgress } from '../../utils/tiers';

interface Props {
  onClick?: () => void;
}

/**
 * Row 2 Right — Tall Blush Card (Tier & Progress)
 * Tactile SayBriefly sketchbook aesthetic:
 * - Top Row: Crisp pill chip with tier sticker + name, subtle ↗ corner hint
 * - Middle: text-5xl bold hero number paired with subtle 'pts' baseline label
 * - Bottom: Crisp 1px #1a3300 bordered progress bar + sharp next tier status
 */
export default function TierCard({ onClick }: Props) {
  const { user } = useSession();
  if (!user) return null;

  const tier = getTier(user.points);
  const nextTier = getNextTier(user.points);
  const progress = getTierProgress(user.points);

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`p-5 min-h-[164px] flex flex-col justify-between card-spring rounded-2xl border border-[var(--color-forest-ink)] shadow-xs profile-bricolage relative ${
        onClick ? 'cursor-pointer active:scale-[0.98] transition-all hover:shadow-sm' : ''
      }`}
      style={{
        backgroundColor: 'var(--color-sticky-note-blush)',
        fontFamily: 'var(--font-bricolage)',
        letterSpacing: '-0.03em',
      }}
    >
      {/* Top Row: Tactile Pill Chip + Subtle ↗ Hint */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 bg-[#fcfaf5] border border-[#1a3300]/25 rounded-full px-3 py-1 text-xs font-bold text-[#1a3300] shadow-2xs">
          <StickerIcon name={tier.icon} size={16} />
          <span className="truncate">{tier.name}</span>
        </span>
        <span className="text-[#1a3300]/40 text-sm font-bold leading-none select-none">
          ↗
        </span>
      </div>

      {/* Middle: Big text-5xl Hero Number + 'pts' Baseline Label */}
      <div className="my-2 flex items-baseline gap-1.5">
        <span
          className="text-5xl font-extrabold tracking-tight leading-none text-[#1a3300]"
          style={{ fontFamily: 'var(--font-bricolage)' }}
        >
          {user.points}
        </span>
        <span
          className="text-xs font-medium text-[#1a3300]/60 tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-bricolage)' }}
        >
          pts
        </span>
      </div>

      {/* Bottom: Crisp 1px solid #1a3300 bordered progress bar + sharp next tier text */}
      <div className="space-y-1.5">
        <div
          className="w-full h-2.5 rounded-full border border-[#1a3300] overflow-hidden bg-[#fcfaf5]"
        >
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: '#1a3300',
            }}
          />
        </div>
        {nextTier ? (
          <p
            className="text-[11px] font-semibold text-[#1a3300]/80 leading-none truncate tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            {nextTier.minPoints - user.points} to {nextTier.name}
          </p>
        ) : (
          <p
            className="text-[11px] text-[#1a3300] font-bold leading-none tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            Max Tier 💎
          </p>
        )}
      </div>
    </div>
  );
}
