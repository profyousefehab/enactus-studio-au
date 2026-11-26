import StickerIcon from '../ui/StickerIcon';
import { useSession } from '../../context/SessionContext';

interface Props {
  onClick?: () => void;
}

/**
 * Row 2 Left — Tall Mint Card (Streak Focus)
 * Tactile SayBriefly sketchbook aesthetic:
 * - Top Row: Crisp pill chip with fire sticker + label, subtle ↗ corner hint
 * - Middle: text-4xl/5xl bold hero number in Roboto Mono paired with subtle 'sessions' label
 * - Bottom: Best streak badge pill with star sticker icon
 */
export default function StreakCard({ onClick }: Props) {
  const { user } = useSession();
  if (!user) return null;

  const content = (
    <>
      {/* Top Row: Tactile Pill Chip + Subtle ↗ Hint */}
      <div className="flex items-center justify-between w-full">
        <span className="inline-flex items-center gap-1.5 bg-[var(--color-cream-paper)] border border-[var(--color-forest-ink)]/25 rounded-full px-3 py-1 text-xs font-semibold text-[var(--color-forest-ink)]">
          <StickerIcon name="fire" size={16} />
          <span>Streak</span>
        </span>
        <span className="text-[var(--color-forest-ink)]/45 text-sm font-bold leading-none select-none" aria-hidden="true">
          ↗
        </span>
      </div>

      {/* Middle: Big Hero Number (Roboto Mono) + 'sessions' Baseline Label (Inter) */}
      <div className="my-2 flex items-baseline gap-1.5">
        <span
          className="text-4xl font-bold tracking-tight leading-none text-[var(--color-forest-ink)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {user.sessionStreak}
        </span>
        <span
          className="text-xs font-medium text-[var(--color-forest-ink)]/65"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          sessions
        </span>
      </div>

      {/* Bottom: Crisp Best Badge Pill with 12px Star Icon */}
      <div>
        <span
          className="inline-flex items-center gap-1 bg-[var(--color-highlighter-yellow)] border border-[var(--color-forest-ink)] rounded-full px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-forest-ink)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <StickerIcon name="star" size={12} />
          <span>Best: {user.bestStreak}</span>
        </span>
      </div>
    </>
  );

  const sharedClasses =
    'p-5 min-h-[164px] w-full text-left flex flex-col justify-between card-spring rounded-xl border border-[var(--color-forest-ink)] relative';
  const sharedStyle = {
    backgroundColor: 'var(--color-sticky-note-mint)',
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
