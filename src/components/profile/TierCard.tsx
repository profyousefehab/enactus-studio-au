import StickerIcon from '../ui/StickerIcon';
import AnimatedCounter from '../ui/AnimatedCounter';
import { useSession } from '../../context/SessionContext';
import { TIERS, getTier, getNextTier, getTierProgress } from '../../utils/tiers';

interface Props {
  onClick?: () => void;
}

/**
 * Row 2 Right — Tall Blush Card (Tier & Progress)
 * Tactile SayBriefly sketchbook aesthetic featuring a
 * segmented milestone progress rail with interactive roadmap prompt.
 */
export default function TierCard({ onClick }: Props) {
  const { user } = useSession();
  if (!user) return null;

  const tier = getTier(user.points);
  const nextTier = getNextTier(user.points);
  const progress = getTierProgress(user.points);
  const currentTierIndex = TIERS.findIndex((t) => t.name === tier.name);

  const content = (
    <>
      {/* Top Row: Tactile Pill Chip + Subtle ↗ Hint */}
      <div className="flex items-center justify-between w-full">
        <span className="inline-flex items-center gap-1.5 bg-[var(--color-cream-paper)] border border-[var(--color-forest-ink)]/25 rounded-full px-3 py-1 text-xs font-semibold text-[var(--color-forest-ink)]">
          <StickerIcon name={tier.icon} size={16} />
          <span className="truncate">{tier.name}</span>
        </span>
        <span className="text-[var(--color-forest-ink)]/45 group-hover:text-[var(--color-forest-ink)] transition-colors text-sm font-bold leading-none select-none" aria-hidden="true">
          ↗
        </span>
      </div>

      {/* Middle: Big Hero Number (Roboto Mono) + 'pts' Baseline Label (Inter) */}
      <div className="my-2 flex items-baseline gap-1.5">
        <AnimatedCounter
          value={user.points}
          className="text-4xl font-bold tracking-tight leading-none text-[var(--color-forest-ink)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        />
        <span
          className="text-xs font-medium text-[var(--color-forest-ink)]/65"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          pts
        </span>
      </div>

      {/* Bottom: Gamified Segmented Stepper Progress Bar */}
      <div className="space-y-1.5 w-full">
        {/* 5-segment milestone track */}
        <div className="flex items-center gap-1 w-full">
          {TIERS.map((t, idx) => {
            const isCompleted = idx < currentTierIndex;
            const isCurrent = idx === currentTierIndex;

            return (
              <div
                key={t.name}
                className="flex-1 h-2 rounded-full overflow-hidden border border-[var(--color-forest-ink)]/30 bg-[var(--color-cream-paper)] relative"
                title={`${t.name}: ${t.minPoints}+ pts`}
              >
                {isCompleted ? (
                  <div className="h-full w-full bg-[var(--color-forest-ink)]" />
                ) : isCurrent ? (
                  <div
                    className="h-full bg-[var(--color-forest-ink)] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(10, progress)}%` }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Milestone info row */}
        <div className="flex items-center justify-between text-[11px] font-medium text-[var(--color-forest-ink)]/80 leading-none">
          <span className="truncate max-w-[130px]" style={{ fontFamily: 'var(--font-inter)' }}>
            {nextTier ? `${nextTier.minPoints - user.points} to ${nextTier.name}` : 'Max Tier 💎'}
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-cream-paper)]/75 border border-[var(--color-forest-ink)]/20"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {progress}%
          </span>
        </div>
      </div>
    </>
  );

  const sharedClasses =
    'p-5 min-h-[164px] w-full text-left flex flex-col justify-between card-spring rounded-xl border border-[var(--color-forest-ink)] relative group';
  const sharedStyle = {
    backgroundColor: 'var(--color-sticky-note-blush)',
    fontFamily: 'var(--font-inter)',
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${sharedClasses} cursor-pointer active:scale-[0.98] transition-all`}
        style={sharedStyle}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={sharedClasses} style={sharedStyle}>
      {content}
    </div>
  );
}
