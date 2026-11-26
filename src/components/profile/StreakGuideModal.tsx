import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import StickerIcon from '../ui/StickerIcon';
import { useFocusTrap } from '../../utils/useFocusTrap';

interface Props {
  open: boolean;
  onClose: () => void;
  streak: number;
  bestStreak: number;
}

export default function StreakGuideModal({ open, onClose, streak, bestStreak }: Props) {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(open, modalRef, onClose);

  if (!open) return null;

  function handleGoToGuidelines() {
    onClose();
    navigate('/guidelines');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{
        backgroundColor: 'rgba(26, 51, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        fontFamily: 'var(--font-inter)',
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="streak-modal-title"
        tabIndex={-1}
        className="w-full max-w-[380px] rounded-2xl bg-[var(--color-cream-paper)] border-2 border-[var(--color-forest-ink)] p-5 z-50 relative flex flex-col gap-4 animate-fadeIn"
        style={{
          fontFamily: 'var(--font-inter)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row with Title & Close ✕ */}
        <div className="flex items-center justify-between">
          <h3
            id="streak-modal-title"
            className="text-base font-bold text-[var(--color-forest-ink)]"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Attendance Streaks
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--color-forest-ink)]/10 text-[var(--color-forest-ink)] cursor-pointer transition-colors btn-spring"
            aria-label="Close modal"
          >
            <Icon icon="doodle:close" width={14} height={14} />
          </button>
        </div>

        {/* Current vs Best Streak Numbers at Top */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--color-sticky-note-mint)] border border-[var(--color-forest-ink)]/20 text-center">
          <div>
            <span
              className="text-[10px] uppercase font-bold text-[var(--color-forest-ink)]/70 block"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Current
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <StickerIcon name="fire" size={20} />
              <span
                className="text-2xl font-bold text-[var(--color-forest-ink)] leading-none"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {streak}
              </span>
            </div>
          </div>
          <div className="border-l border-[var(--color-forest-ink)]/15">
            <span
              className="text-[10px] uppercase font-bold text-[var(--color-forest-ink)]/70 block"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Best
            </span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <StickerIcon name="star" size={16} />
              <span
                className="text-2xl font-bold text-[var(--color-forest-ink)] leading-none"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {bestStreak}
              </span>
            </div>
          </div>
        </div>

        {/* Just 2 Short One-Line Bullets */}
        <ul className="flex flex-col gap-2.5 text-xs text-[var(--color-forest-ink)] px-1 font-medium">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-forest-ink)] shrink-0" />
            <span>+1 per session attended</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-terracotta)] shrink-0" />
            <span>Resets to 0 if missed without excuse</span>
          </li>
        </ul>

        {/* Single Read More Link */}
        <button
          type="button"
          onClick={handleGoToGuidelines}
          className="text-xs font-semibold text-[var(--color-forest-ink)] underline text-center cursor-pointer hover:text-[var(--color-terracotta)] transition-colors mt-1 min-h-[36px]"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Full rules in Guidelines →
        </button>
      </div>
    </div>
  );
}
