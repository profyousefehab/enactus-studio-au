import StickerIcon from '../ui/StickerIcon';
import { useSession } from '../../context/SessionContext';

interface Props {
  onClick?: () => void;
}

/**
 * Row 2 Left — Tall Mint Card (Streak Focus)
 * Tactile SayBriefly sketchbook aesthetic:
 * - Top Row: Crisp pill chip with fire sticker + label, subtle ↗ corner hint
 * - Middle: text-5xl bold hero number paired with subtle 'sessions' baseline label
 * - Bottom: Best streak badge pill with star sticker icon
 */
export default function StreakCard({ onClick }: Props) {
  const { user } = useSession();
  if (!user) return null;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`p-5 min-h-[164px] flex flex-col justify-between card-spring rounded-2xl border border-[var(--color-forest-ink)] shadow-xs profile-bricolage relative ${
        onClick ? 'cursor-pointer active:scale-[0.98] transition-all hover:shadow-sm' : ''
      }`}
      style={{
        backgroundColor: 'var(--color-sticky-note-mint)',
        fontFamily: 'var(--font-bricolage)',
        letterSpacing: '-0.03em',
      }}
    >
      {/* Top Row: Tactile Pill Chip + Subtle ↗ Hint */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 bg-[#fcfaf5] border border-[#1a3300]/25 rounded-full px-3 py-1 text-xs font-bold text-[#1a3300] shadow-2xs">
          <StickerIcon name="fire" size={16} />
          <span>Streak</span>
        </span>
        <span className="text-[#1a3300]/40 text-sm font-bold leading-none select-none">
          ↗
        </span>
      </div>

      {/* Middle: Big text-5xl Hero Number + 'sessions' Baseline Label */}
      <div className="my-2 flex items-baseline gap-1.5">
        <span
          className="text-5xl font-extrabold tracking-tight leading-none text-[#1a3300]"
          style={{ fontFamily: 'var(--font-bricolage)' }}
        >
          {user.sessionStreak}
        </span>
        <span
          className="text-xs font-medium text-[#1a3300]/60 tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-bricolage)' }}
        >
          sessions
        </span>
      </div>

      {/* Bottom: Crisp Best Badge Pill with 12px Star Icon */}
      <div>
        <span
          className="inline-flex items-center gap-1 bg-[#ffe95c] border border-[#1a3300] rounded-full px-2.5 py-0.5 text-[11px] font-bold text-[#1a3300] shadow-2xs tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-bricolage)' }}
        >
          <StickerIcon name="star" size={12} />
          <span>Best: {user.bestStreak}</span>
        </span>
      </div>
    </div>
  );
}
