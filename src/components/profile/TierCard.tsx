import StickerIcon from '../ui/StickerIcon';
import AnimatedCounter from '../ui/AnimatedCounter';
import { useSession } from '../../context/SessionContext';
import { TIERS, getTier, getNextTier, getTierProgress } from '../../utils/tiers';

interface Props {
  onClick?: () => void;
}

/**
 * Row 2 Right — Tall Blush Card (Tier & Progress)
 * Tactile SayBriefly sketchbook aesthetic featuring PaceUI-inspired
 * segmented milestone progress rail with interactive roadmap prompt.
 */
export default function TierCard({ onClick }: Props) {
  const { user } = useSession();
  if (!user) return null;

  const tier = getTier(user.points);
  const nextTier = getNextTier(user.points);
  const progress = getTierProgress(user.points);
  const currentTierIndex = TIERS.findIndex((t) => t.name === tier.name);

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`p-5 min-h-[164px] flex flex-col justify-between card-spring rounded-2xl border border-[var(--color-forest-ink)] shadow-xs profile-bricolage relative group ${
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
        <span className="text-[#1a3300]/40 group-hover:text-[#1a3300] transition-colors text-sm font-bold leading-none select-none">
          ↗
        </span>
      </div>

      {/* Middle: Big text-5xl Hero Number + 'pts' Baseline Label */}
      <div className="my-2 flex items-baseline gap-1.5">
        <AnimatedCounter
          value={user.points}
          className="text-5xl font-extrabold tracking-tight leading-none text-[#1a3300]"
          style={{ fontFamily: 'var(--font-bricolage)' }}
        />
        <span
          className="text-xs font-medium text-[#1a3300]/60 tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-bricolage)' }}
        >
          pts
        </span>
      </div>

      {/* Bottom: Gamified Segmented Stepper Progress Bar */}
      <div className="space-y-1.5">
        {/* 5-segment milestone track */}
        <div className="flex items-center gap-1 w-full">
          {TIERS.map((t, idx) => {
            const isCompleted = idx < currentTierIndex;
            const isCurrent = idx === currentTierIndex;

            return (
              <div
                key={t.name}
                className="flex-1 h-2 rounded-full overflow-hidden border border-[#1a3300]/30 bg-[#fcfaf5] relative"
                title={`${t.name}: ${t.minPoints}+ pts`}
              >
                {isCompleted ? (
                  <div className="h-full w-full bg-[#1a3300]" />
                ) : isCurrent ? (
                  <div
                    className="h-full bg-[#1a3300] rounded-full transition-all duration-500 ease-out animate-shimmer"
                    style={{ width: `${Math.max(10, progress)}%` }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Milestone info row */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#1a3300]/80 leading-none tracking-[-0.03em]">
          <span className="truncate max-w-[130px]">
            {nextTier ? `${nextTier.minPoints - user.points} to ${nextTier.name}` : 'Max Tier 💎'}
          </span>
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#fcfaf5]/70 border border-[#1a3300]/20">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
