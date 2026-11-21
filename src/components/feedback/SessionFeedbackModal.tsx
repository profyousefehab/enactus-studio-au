import { useState } from 'react';
import { Icon } from '@iconify/react';
import StickerIcon from '../ui/StickerIcon';
import SketchCallout from '../ui/SketchCallout';
import { useSessionFeedback } from '../../context/SessionFeedbackContext';

const RATING_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Needs improvement 🌧️', color: 'var(--color-terracotta)' },
  2: { text: 'A bit slow / confusing ⛅', color: 'var(--color-terracotta)' },
  3: { text: 'Solid session 👍', color: 'var(--color-forest-ink)' },
  4: { text: 'Great energy & learned a lot! 🚀', color: '#147a4d' },
  5: { text: 'Loved it! Inspiring & productive ✨', color: '#147a4d' },
};

export default function SessionFeedbackModal() {
  const { feedbackSettings, isModalOpen, dismissModal, submitFeedback } = useSessionFeedback();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isModalOpen || !feedbackSettings?.isOpen) return null;

  const currentRating = hoverRating || rating;
  const activeRatingInfo = currentRating > 0 ? RATING_LABELS[currentRating] : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError('Please tap a star to give a rating (1 to 5).');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await submitFeedback(rating, message);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
      }, 1800);
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      setError(err?.message || 'Failed to submit feedback. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{
        backgroundColor: 'rgba(26, 51, 0, 0.45)',
        backdropFilter: 'blur(3px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border-2 border-[var(--color-forest-ink)] overflow-hidden shadow-2xl relative transition-all transform animate-fadeIn"
        style={{ backgroundColor: 'var(--color-cream-paper)' }}
      >
        {/* Washi Tape Accent on Top-Right */}
        <div
          className="absolute -top-3.5 right-6 z-10 w-20 h-6 pointer-events-none shadow-xs -rotate-6"
          style={{
            backgroundColor: 'rgba(255, 233, 92, 0.85)',
            border: '1px dashed rgba(26, 51, 0, 0.25)',
          }}
        />

        {submitted ? (
          /* ── Success Celebration Screen ── */
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <div
              className="w-16 h-16 rounded-full border-2 border-[var(--color-forest-ink)] flex items-center justify-center shadow-sm"
              style={{ backgroundColor: 'var(--color-sticky-note-mint)' }}
            >
              <StickerIcon name="star" size={36} />
            </div>
            <h3
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-forest-ink)' }}
            >
              Thank you for your feedback!
            </h3>
            <p
              className="text-sm font-medium"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}
            >
              Your thoughts help make our beta sessions and creative workflows better.
            </p>
            <div className="mt-2">
              <SketchCallout
                text="feedback recorded privately ↩"
                arrow="none"
                color="#cb5521"
                rotate="-rotate-1"
                fontSize={22}
              />
            </div>
          </div>
        ) : (
          /* ── Main Feedback Form ── */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4">
            {/* Top Bar: Title & Live Badge */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold border border-[var(--color-forest-ink)]"
                    style={{ backgroundColor: 'var(--color-highlighter-yellow)', color: 'var(--color-forest-ink)' }}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#1a3300] animate-pulse" />
                    LIVE SESSION FEEDBACK
                  </span>
                </div>
                <h3
                  id="feedback-modal-title"
                  className="text-xl sm:text-2xl font-bold tracking-tight leading-snug"
                  style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-forest-ink)' }}
                >
                  {feedbackSettings.sessionTitle || 'Session Feedback'}
                </h3>
              </div>

              {/* Dismiss / Later Button */}
              <button
                type="button"
                onClick={dismissModal}
                className="w-8 h-8 rounded-full border border-[var(--color-forest-ink)] flex items-center justify-center bg-white hover:bg-[var(--color-sticky-note-blush)] cursor-pointer shrink-0 transition-colors btn-spring"
                title="Dismiss for now (can reopen from menu)"
              >
                <Icon icon="doodle:close" width={16} height={16} style={{ color: 'var(--color-forest-ink)' }} />
              </button>
            </div>

            {/* Handwritten note */}
            <div className="flex items-center justify-start -mt-1 select-none">
              <SketchCallout
                text="be honest, only the coordinator sees this!"
                arrow="down-right"
                color="#cb5521"
                rotate="-rotate-2"
                fontSize={21}
              />
            </div>

            {/* 5 Interactive Stars */}
            <div
              className="p-4 rounded-xl border border-[var(--color-forest-ink)] flex flex-col items-center gap-2"
              style={{ backgroundColor: 'white' }}
            >
              <div
                className="flex items-center justify-center gap-2.5 sm:gap-3 py-1"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const isHighlighted = starIndex <= (hoverRating || rating);

                  return (
                    <button
                      key={starIndex}
                      type="button"
                      onClick={() => {
                        setRating(starIndex);
                        setError('');
                      }}
                      onMouseEnter={() => setHoverRating(starIndex)}
                      className={`cursor-pointer transition-all duration-150 transform hover:scale-120 focus:outline-none ${
                        isHighlighted
                          ? 'scale-110 opacity-100 drop-shadow-sm'
                          : 'scale-95 opacity-30 grayscale hover:opacity-75 hover:grayscale-0'
                      }`}
                      aria-label={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
                    >
                      <StickerIcon name="star" size={38} />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Rating Label */}
              <div className="h-5 flex items-center justify-center">
                {activeRatingInfo ? (
                  <span
                    className="text-xs sm:text-sm font-bold font-inter animate-fadeIn"
                    style={{ color: activeRatingInfo.color }}
                  >
                    {activeRatingInfo.text}
                  </span>
                ) : (
                  <span
                    className="text-xs font-mono text-[var(--color-pencil-gray)]"
                  >
                    Tap a star to rate today's session
                  </span>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label
                htmlFor="feedback-message"
                className="block text-xs font-bold font-inter mb-1.5"
                style={{ color: 'var(--color-forest-ink)' }}
              >
                Comments or Suggestions (optional)
              </label>
              <textarea
                id="feedback-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What went well or what should we improve in our next session?"
                className="w-full p-3 text-sm rounded-xl border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none transition-colors resize-none"
                style={{
                  fontFamily: 'var(--font-inter)',
                  backgroundColor: 'white',
                  color: 'var(--color-forest-ink)',
                }}
              />
            </div>

            {error && (
              <p
                className="text-xs font-semibold text-[var(--color-terracotta)] font-inter -mt-1"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={dismissModal}
                className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-[var(--color-pencil-gray)] bg-white text-[var(--color-forest-ink)] hover:bg-gray-100 transition-colors cursor-pointer btn-spring"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Later
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-lg border border-[var(--color-forest-ink)] cursor-pointer btn-spring transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
                style={{
                  fontFamily: 'var(--font-inter)',
                  backgroundColor: 'var(--color-sticky-note-mint)',
                  color: 'var(--color-forest-ink)',
                }}
              >
                {submitting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <span>Send Feedback</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
