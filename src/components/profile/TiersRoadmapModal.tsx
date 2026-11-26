import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import StickerIcon from '../ui/StickerIcon';
import AnimatedCounter from '../ui/AnimatedCounter';
import { TIERS, getTier, getNextTier, getTierProgress } from '../../utils/tiers';
import { useFocusTrap } from '../../utils/useFocusTrap';

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
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync selected tier with current tier when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTierIndex(currentTierIndex);
    }
  }, [open, currentTierIndex]);

  useFocusTrap(open, modalRef, onClose);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
      style={{
        backgroundColor: 'rgba(26, 51, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        fontFamily: 'var(--font-inter)',
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tiers-modal-title"
        tabIndex={-1}
        className="w-full max-w-[420px] rounded-2xl bg-[var(--color-cream-paper)] border-2 border-[var(--color-forest-ink)] p-4 sm:p-5 z-50 relative flex flex-col gap-3.5 my-auto"
        style={{
          fontFamily: 'var(--font-inter)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row with Title & Close ✕ */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-forest-ink)]/15">
          <div className="flex items-center gap-2">
            <h3
              id="tiers-modal-title"
              className="text-lg font-bold text-[var(--color-forest-ink)]"
              style={{ fontFamily: 'var(--font-inter)' }}
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
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--color-forest-ink)]/10 text-[var(--color-forest-ink)] cursor-pointer transition-colors btn-spring"
            aria-label="Close modal"
          >
            <Icon icon="doodle:close" width={16} height={16} />
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            INTERACTIVE STEPPER RAIL
           ════════════════════════════════════════════════════════════════ */}
        <div className="py-2 px-1">
          <div className="relative flex items-center justify-between">
            {/* Background connecting track */}
            <div className="absolute top-1/2 left-3 right-3 -translate-y-1/2 h-1 bg-[var(--color-forest-ink)]/15 rounded-full -z-0" />

            {/* Filled completed connecting track */}
            <div
              className="absolute top-1/2 left-3 -translate-y-1/2 h-1 bg-[var(--color-forest-ink)] rounded-full transition-all duration-500 ease-out -z-0"
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
                  className="relative z-10 flex flex-col items-center gap-1 cursor-pointer group"
                  title={`${t.name} (${t.minPoints}+ pts)`}
                >
                  {/* Circular Node */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${
                      isCurrent
                        ? 'bg-[var(--color-highlighter-yellow)] border-[var(--color-forest-ink)] ring-3 ring-[var(--color-forest-ink)]/20 scale-110'
                        : isCompleted
                        ? 'bg-[var(--color-sticky-note-mint)] border-[var(--color-forest-ink)]'
                        : 'bg-[var(--color-cream-paper)] border-[var(--color-forest-ink)]/30 opacity-70'
                    } ${isSelected ? 'ring-2 ring-[var(--color-forest-ink)] ring-offset-1' : ''}`}
                  >
                    <StickerIcon name={t.icon} size={18} />
                  </div>

                  {/* You badge for active tier */}
                  {isCurrent && (
                    <span
                      className="absolute -top-3 text-[9px] font-mono font-bold uppercase px-1 py-0.2 rounded bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)] leading-none"
                    >
                      You
                    </span>
                  )}

                  {/* Node label */}
                  <span
                    className={`text-[10px] font-mono font-bold tracking-tight ${
                      isSelected || isCurrent ? 'text-[var(--color-forest-ink)] font-extrabold' : 'text-[var(--color-forest-ink)]/60'
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
          className="p-3.5 rounded-xl border border-[var(--color-forest-ink)] flex flex-col gap-2 relative overflow-hidden"
          style={{
            backgroundColor: 'var(--color-sticky-note-mint)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--color-forest-ink)] uppercase tracking-wider">
                Current Level
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-cream-paper)] border border-[var(--color-forest-ink)]/20">
                <AnimatedCounter value={points} suffix=" pts" />
              </span>
            </div>

            <span className="text-xs font-semibold text-[var(--color-forest-ink)]/80">
              {nextTier ? `${nextTier.minPoints - points} pts to ${nextTier.name}` : 'Max Rank Reached!'}
            </span>
          </div>

          {/* Smooth Progress Bar */}
          <div className="w-full bg-[var(--color-cream-paper)] h-3 rounded-full border border-[var(--color-forest-ink)] overflow-hidden p-0.5">
            <div
              className="h-full bg-[var(--color-forest-ink)] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.max(6, progress)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] font-semibold text-[var(--color-forest-ink)]/75">
            <span>{currentTier.name} ({currentTier.minPoints} pts)</span>
            <span>{nextTier ? `${nextTier.name} (${nextTier.minPoints} pts)` : 'Mythic (500+)'}</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            FOCUSED TIER DETAIL CARD
           ════════════════════════════════════════════════════════════════ */}
        <div
          className="p-3.5 rounded-xl border-2 border-[var(--color-forest-ink)] flex flex-col gap-2 transition-all duration-200"
          style={{
            backgroundColor: focusedTier.color,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[var(--color-cream-paper)] border border-[var(--color-forest-ink)] flex items-center justify-center">
                <StickerIcon name={focusedTier.icon} size={22} />
              </div>
              <div>
                <h4 className="text-base font-bold text-[var(--color-forest-ink)] leading-tight">
                  {focusedTier.name}
                </h4>
                <p className="text-[11px] font-mono text-[var(--color-forest-ink)]/75">
                  {focusedTier.minPoints}
                  {focusedTier.maxPoints !== null ? ` – ${focusedTier.maxPoints} pts` : '+ pts'}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border border-[var(--color-forest-ink)] ${
                isFocusedCurrent
                  ? 'bg-[var(--color-highlighter-yellow)] text-[var(--color-forest-ink)]'
                  : isFocusedUnlocked
                  ? 'bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)]'
                  : 'bg-[var(--color-cream-paper)] text-[var(--color-forest-ink)]/60 border-[var(--color-forest-ink)]/30'
              }`}
            >
              {isFocusedCurrent ? '⭐ Active Tier' : isFocusedUnlocked ? '✓ Unlocked' : '🔒 Locked'}
            </span>
          </div>

          {/* Flavor Text & Perks */}
          <p className="text-xs text-[var(--color-forest-ink)]/90 leading-relaxed mt-0.5">
            {TIER_DESCRIPTIONS[focusedTier.name]?.desc}
          </p>

          <div className="pt-2 border-t border-[var(--color-forest-ink)]/20 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-forest-ink)]">
            <Icon icon="doodle:award" width={14} height={14} className="shrink-0" />
            <span className="truncate">{TIER_DESCRIPTIONS[focusedTier.name]?.perks}</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            ALL TIERS QUICK LADDER (COMPACT LIST)
           ════════════════════════════════════════════════════════════════ */}
        <div className="divide-y divide-[var(--color-forest-ink)]/10 border border-[var(--color-forest-ink)]/20 rounded-xl bg-[var(--color-cream-paper)] overflow-hidden max-h-40 overflow-y-auto">
          {TIERS.map((t, idx) => {
            const isCurrent = t.name === currentTier.name;
            const isUnlocked = points >= t.minPoints;
            const isSelected = idx === selectedTierIndex;

            return (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTierIndex(idx)}
                className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[var(--color-highlighter-yellow)]/30 font-bold'
                    : isCurrent
                    ? 'bg-[var(--color-highlighter-yellow)]/15'
                    : 'hover:bg-[var(--color-forest-ink)]/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <StickerIcon name={t.icon} size={18} />
                  <span className={`text-[var(--color-forest-ink)] ${isCurrent ? 'font-bold' : 'font-medium'}`}>
                    {t.name}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--color-forest-ink)]/60">
                    ({t.minPoints}+)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-highlighter-yellow)] text-[var(--color-forest-ink)] border border-[var(--color-forest-ink)]/30">
                      You
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--color-forest-ink)]/60">
                    {isUnlocked ? '✓' : '🔒'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Button: View Point Rules in Guidelines */}
        <button
          type="button"
          onClick={handleGoToGuidelines}
          className="w-full py-2.5 px-3 min-h-[44px] text-xs font-semibold rounded-md border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] hover:bg-[var(--color-highlighter-yellow)] text-[var(--color-forest-ink)] cursor-pointer btn-spring flex items-center justify-center gap-1.5 mt-1"
        >
          <Icon icon="doodle:book-open" width={16} height={16} />
          <span>How to Earn Points in Guidelines →</span>
        </button>
      </div>
    </div>
  );
}
