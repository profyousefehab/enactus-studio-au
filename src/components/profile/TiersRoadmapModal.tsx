import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import StickerIcon from '../ui/StickerIcon';
import { TIERS, getTier, getNextTier, getTierProgress } from '../../utils/tiers';

interface Props {
  open: boolean;
  onClose: () => void;
  points: number;
}

export default function TiersRoadmapModal({ open, onClose, points }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const currentTier = getTier(points);
  const nextTier = getNextTier(points);
  const progress = getTierProgress(points);

  function handleGoToGuidelines() {
    onClose();
    navigate('/guidelines');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none profile-bricolage"
      style={{
        backgroundColor: 'rgba(26, 51, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        fontFamily: 'var(--font-bricolage)',
        letterSpacing: '-0.03em',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tiers-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[380px] rounded-2xl bg-[#fcfaf5] border-2 border-[#1a3300] p-5 z-50 relative flex flex-col gap-4 shadow-xl animate-fadeIn profile-bricolage"
        style={{
          fontFamily: 'var(--font-bricolage)',
          letterSpacing: '-0.03em',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row with Title & Close ✕ */}
        <div className="flex items-center justify-between">
          <h3
            id="tiers-modal-title"
            className="text-base font-bold text-[#1a3300] tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            Tiers Roadmap
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#1a3300]/10 text-[#1a3300] cursor-pointer transition-colors btn-spring"
            aria-label="Close modal"
          >
            <Icon icon="doodle:close" width={14} height={14} />
          </button>
        </div>

        {/* Progress Bar (e.g. 60 / 150 pts to Pro) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs tracking-[-0.03em]">
            <span className="font-extrabold text-[#1a3300]">{points} pts</span>
            <span className="text-[#1a3300]/60 font-semibold">
              {nextTier ? `${points} / ${nextTier.minPoints} pts to ${nextTier.name}` : 'Max Level 💎'}
            </span>
          </div>
          <div className="w-full bg-[#1a3300]/10 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1a3300] transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Compact 5-row list separated by divide-y */}
        <div className="divide-y divide-[#1a3300]/10 border border-[#1a3300]/10 rounded-xl bg-white overflow-hidden">
          {TIERS.map((t) => {
            const isCurrent = t.name === currentTier.name;
            const isLocked = points < t.minPoints;

            return (
              <div
                key={t.name}
                className={`px-3 py-2.5 flex items-center justify-between text-xs transition-opacity ${
                  isLocked ? 'opacity-45' : 'opacity-100'
                } ${isCurrent ? 'bg-[#ffe95c]/20' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <StickerIcon name={t.icon} size={20} />
                  <span className="font-bold text-[#1a3300] tracking-[-0.03em]">{t.name}</span>
                  <span className="text-[11px] font-semibold text-[#1a3300]/60 tracking-[-0.03em]">{t.minPoints}+</span>
                </div>

                {isCurrent && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ffe95c] text-[#1a3300] border border-[#1a3300]/30 tracking-[-0.03em]">
                    You
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Single Read More Link */}
        <button
          type="button"
          onClick={handleGoToGuidelines}
          className="text-xs font-bold text-[#1a3300] underline text-center cursor-pointer hover:text-[#cb5521] transition-colors mt-1 tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-bricolage)' }}
        >
          Full rules in Guidelines →
        </button>
      </div>
    </div>
  );
}
