import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import StickerIcon from '../ui/StickerIcon';

interface Props {
  open: boolean;
  onClose: () => void;
  streak: number;
  bestStreak: number;
}

export default function StreakGuideModal({ open, onClose, streak, bestStreak }: Props) {
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
      aria-labelledby="streak-modal-title"
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
            id="streak-modal-title"
            className="text-base font-bold text-[#1a3300] tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            Attendance Streaks
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

        {/* Current vs Best Streak Numbers at Top */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#d5f5c2] border border-[#1a3300]/20 text-center">
          <div>
            <span
              className="text-[10px] uppercase font-bold text-[#1a3300]/70 block tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              Current
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <StickerIcon name="fire" size={20} />
              <span
                className="text-2xl font-extrabold text-[#1a3300] leading-none tracking-[-0.03em]"
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                {streak}
              </span>
            </div>
          </div>
          <div className="border-l border-[#1a3300]/15">
            <span
              className="text-[10px] uppercase font-bold text-[#1a3300]/70 block tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              Best
            </span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-base leading-none">⭐</span>
              <span
                className="text-2xl font-extrabold text-[#1a3300] leading-none tracking-[-0.03em]"
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                {bestStreak}
              </span>
            </div>
          </div>
        </div>

        {/* Just 2 Short One-Line Bullets */}
        <ul className="flex flex-col gap-2.5 text-xs text-[#1a3300] px-1 font-semibold tracking-[-0.03em]">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a3300] shrink-0" />
            <span>+1 per session attended</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#cb5521] shrink-0" />
            <span>Resets to 0 if missed without excuse</span>
          </li>
        </ul>

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
