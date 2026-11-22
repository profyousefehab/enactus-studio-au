import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import StickerIcon from '../ui/StickerIcon';
import AnimatedCounter from '../ui/AnimatedCounter';
import { TIERS, getTier, getNextTier, getTierProgress } from '../../utils/tiers';

interface Props {
  open: boolean;
  onClose: () => void;
  points: number;
}

// Tier roadmap descriptions & flavor copy
const TIER_DESCRIPTIONS: Record<string, { desc: string; perks: string }> = {
  Potato: {
    desc: 'Starting the season strong. Attending early workshops and getting familiar with the studio.',
    perks: 'Access to Studio Wall & Feedback Partner pairing',
  },
  Rookie: {
    desc: 'Actively submitting creative tasks, earning attendance streaks, and engaging in discussions.',
    perks: 'Unlocked custom avatar upload & task badge highlights',
  },
  Pro: {
    desc: 'Consistent committee regular. Reliable teammate with quality submissions and great feedback.',
    perks: 'Eligible for Spotlight showcase & feedback lead roles',
  },
  Legend: {
    desc: 'High-impact committee standout. Leading critiques, answering golden questions, and setting the standard.',
    perks: 'Top-tier leaderboard podium contender & priority pairings',
  },
  Mythic: {
    desc: 'Creative supremacy. Unstoppable mastery of design and content at Enactus AU.',
    perks: 'Season MVP status & immortalized on the studio hall of fame',
  },
};

export default function TiersRoadmapModal({ open, onClose, points }: Props) {
  const navigate = useNavigate();
  const currentTier = getTier(points);
  const nextTier = getNextTier(points);
  const progress = getTierProgress(points);
  const currentTierIndex = TIERS.findIndex((t) => t.name === currentTier.name);

  const [selectedTierIndex, setSelectedTierIndex] = useState(currentTierIndex);

  // Sync selected tier with current tier when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTierIndex(currentTierIndex);
    }
  }, [open, currentTierIndex]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleGoToGuidelines() {
    onClose();
    navigate('/guidelines');
  }

  const focusedTier = TIERS[selectedTierIndex] || currentTier;
  const isFocusedCurrent = focusedTier.name === currentTier.name;
  const isFocusedUnlocked = points >= focusedTier.minPoints;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none profile-bricolage overflow-y-auto"
      style={{
        backgroundColor: 'rgba(26, 51, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        fontFamily: 'var(--font-bricolage)',
        letterSpacing: '-0.03em',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tiers-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl bg-[#fcfaf5] border-2 border-[#1a3300] p-4 sm:p-5 z-50 relative flex flex-col gap-3.5 shadow-2xl animate-in zoom-in-95 duration-200 my-auto"
        style={{
          fontFamily: 'var(--font-bricolage)',
          letterSpacing: '-0.03em',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row with Title & Close ✕ */}
        <div className="flex items-center justify-between pb-2 border-b border-[#1a3300]/15">
          <div className="flex items-center gap-2">
            <h3
              id="tiers-modal-title"
              className="text-lg font-extrabold text-[#1a3300] tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              Tiers Roadmap
            </h3>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase"
              style={{
                backgroundColor: 'var(--color-highlighter-yellow)',
                color: 'var(--color-forest-ink)',
                border: '1px solid rgba(26, 51, 0, 0.15)',
              }}
            >
              Progression
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#1a3300]/10 text-[#1a3300] cursor-pointer transition-colors btn-spring"
            aria-label="Close modal"
          >
            <Icon icon="doodle:close" width={16} height={16} />
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            INTERACTIVE STEPPER RAIL (PaceUI Stepper Pattern)
           ════════════════════════════════════════════════════════════════ */}
        <div className="py-2 px-1">
          <div className="relative flex items-center justify-between">
            {/* Background connecting track */}
            <div className="absolute top-1/2 left-3 right-3 -translate-y-1/2 h-1 bg-[#1a3300]/15 rounded-full -z-0" />

            {/* Filled completed connecting track */}
            <div
              className="absolute top-1/2 left-3 -translate-y-1/2 h-1 bg-[#1a3300] rounded-full transition-all duration-500 ease-out -z-0"
              style={{
                width: `${(currentTierIndex / (TIERS.length - 1)) * 92}%`,
              }}
            />

            {/* Step Nodes */}
            {TIERS.map((t, idx) => {
              const isCompleted = idx < currentTierIndex;
              const isCurrent = idx === currentTierIndex;
              const isSelected = idx === selectedTierIndex;

              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setSelectedTierIndex(idx)}
                  className={`relative z-10 flex flex-col items-center gap-1 cursor-pointer group focus:outline-none`}
                  title={`${t.name} (${t.minPoints}+ pts)`}
                >
                  {/* Circular Node */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${
                      isCurrent
                        ? 'bg-[#ffe95c] border-[#1a3300] ring-3 ring-[#1a3300]/20 scale-110 shadow-xs'
                        : isCompleted
                        ? 'bg-[#d5f5c2] border-[#1a3300]'
                        : 'bg-[#fcfaf5] border-[#1a3300]/30 opacity-70'
                    } ${isSelected ? 'ring-2 ring-forest-ink ring-offset-1' : ''}`}
                  >
                    <StickerIcon name={t.icon} size={18} />
                  </div>

                  {/* You badge for active tier */}
                  {isCurrent && (
                    <span
                      className="absolute -top-3 text-[9px] font-mono font-bold uppercase px-1 py-0.2 rounded bg-forest-ink text-cream-paper shadow-2xs leading-none"
                    >
                      You
                    </span>
                  )}

                  {/* Node label */}
                  <span
                    className={`text-[10px] font-bold tracking-tight ${
                      isSelected || isCurrent ? 'text-forest-ink font-extrabold' : 'text-forest-ink/60'
                    }`}
                  >
                    {t.minPoints}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            ACTIVE TIER PROGRESSION BANNER
           ════════════════════════════════════════════════════════════════ */}
        <div
          className="p-3.5 rounded-xl border border-[#1a3300] flex flex-col gap-2 relative overflow-hidden"
          style={{
            backgroundColor: 'var(--color-sticky-note-mint)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-forest-ink uppercase tracking-wider">
                Current Level
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#fcfaf5] border border-forest-ink/20">
                <AnimatedCounter value={points} suffix=" pts" />
              </span>
            </div>

            <span className="text-xs font-semibold text-forest-ink/80">
              {nextTier ? `${nextTier.minPoints - points} pts to ${nextTier.name}` : 'Max Rank Reached!'}
            </span>
          </div>

          {/* Smooth Spring Progress Bar */}
          <div className="w-full bg-[#fcfaf5] h-3 rounded-full border border-[#1a3300] overflow-hidden p-0.5">
            <div
              className="h-full bg-[#1a3300] rounded-full transition-all duration-700 ease-out animate-shimmer"
              style={{ width: `${Math.max(6, progress)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] font-semibold text-forest-ink/75">
            <span>{currentTier.name} ({currentTier.minPoints} pts)</span>
            <span>{nextTier ? `${nextTier.name} (${nextTier.minPoints} pts)` : 'Mythic (500+)'}</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            FOCUSED TIER DETAIL CARD
           ════════════════════════════════════════════════════════════════ */}
        <div
          className="p-3.5 rounded-xl border-2 border-forest-ink flex flex-col gap-2 transition-all duration-200"
          style={{
            backgroundColor: focusedTier.color,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#fcfaf5] border border-forest-ink flex items-center justify-center shadow-xs">
                <StickerIcon name={focusedTier.icon} size={22} />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-forest-ink leading-tight">
                  {focusedTier.name}
                </h4>
                <p className="text-[11px] font-mono text-forest-ink/75">
                  {focusedTier.minPoints}
                  {focusedTier.maxPoints !== null ? ` – ${focusedTier.maxPoints} pts` : '+ pts'}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border border-forest-ink shadow-2xs ${
                isFocusedCurrent
                  ? 'bg-[#ffe95c] text-forest-ink'
                  : isFocusedUnlocked
                  ? 'bg-forest-ink text-cream-paper'
                  : 'bg-[#fcfaf5] text-forest-ink/60 border-forest-ink/30'
              }`}
            >
              {isFocusedCurrent ? '⭐ Active Tier' : isFocusedUnlocked ? '✓ Unlocked' : '🔒 Locked'}
            </span>
          </div>

          {/* Flavor Text & Perks */}
          <p className="text-xs text-forest-ink/90 leading-relaxed mt-0.5">
            {TIER_DESCRIPTIONS[focusedTier.name]?.desc}
          </p>

          <div className="pt-2 border-t border-forest-ink/20 flex items-center gap-1.5 text-[11px] font-semibold text-forest-ink">
            <Icon icon="doodle:award" width={14} height={14} className="shrink-0" />
            <span className="truncate">{TIER_DESCRIPTIONS[focusedTier.name]?.perks}</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            ALL TIERS QUICK LADDER (COMPACT LIST)
           ════════════════════════════════════════════════════════════════ */}
        <div className="divide-y divide-[#1a3300]/10 border border-[#1a3300]/20 rounded-xl bg-white overflow-hidden max-h-40 overflow-y-auto">
          {TIERS.map((t, idx) => {
            const isCurrent = t.name === currentTier.name;
            const isUnlocked = points >= t.minPoints;
            const isSelected = idx === selectedTierIndex;

            return (
              <div
                key={t.name}
                onClick={() => setSelectedTierIndex(idx)}
                className={`px-3 py-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#ffe95c]/30 font-bold'
                    : isCurrent
                    ? 'bg-[#ffe95c]/15'
                    : 'hover:bg-[#1a3300]/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <StickerIcon name={t.icon} size={18} />
                  <span className={`text-forest-ink ${isCurrent ? 'font-extrabold' : 'font-medium'}`}>
                    {t.name}
                  </span>
                  <span className="text-[11px] font-mono text-pencil-gray">
                    ({t.minPoints}+)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#ffe95c] text-forest-ink border border-forest-ink/30">
                      You
                    </span>
                  )}
                  <span className="text-[11px] text-forest-ink/60">
                    {isUnlocked ? '✓' : '🔒'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button: View Point Rules in Guidelines */}
        <button
          type="button"
          onClick={handleGoToGuidelines}
          className="w-full py-2.5 px-3 text-xs font-bold rounded-lg border border-forest-ink bg-[#fcfaf5] hover:bg-[#ffe95c] text-forest-ink cursor-pointer btn-spring flex items-center justify-center gap-1.5 shadow-2xs mt-1"
        >
          <Icon icon="doodle:book-open" width={16} height={16} />
          <span>How to Earn Points in Guidelines →</span>
        </button>
      </div>
    </div>
  );
}
