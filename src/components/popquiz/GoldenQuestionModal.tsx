import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import StickerIcon from '../ui/StickerIcon';
import SketchCallout from '../ui/SketchCallout';
import { useGoldenQuestion } from '../../context/GoldenQuestionContext';
import { useSession } from '../../context/SessionContext';

export default function GoldenQuestionModal() {
  const { user } = useSession();
  const {
    activeQuestion,
    isModalOpen,
    dismissModal,
    submitAnswer,
    hasAttempted,
    isWinner,
  } = useGoldenQuestion();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isWrongAnswer, setIsWrongAnswer] = useState(false);
  const [solvedByOther, setSolvedByOther] = useState<string | null>(null);

  // Reset local state when active questionId changes
  useEffect(() => {
    setSelectedIndex(null);
    setFeedbackMessage(null);
    setIsWrongAnswer(false);
    setSolvedByOther(null);
  }, [activeQuestion?.questionId]);

  // If active question was solved by someone else while open
  useEffect(() => {
    if (activeQuestion && !activeQuestion.isActive && activeQuestion.winnerId && activeQuestion.winnerId !== user?.id) {
      setSolvedByOther(activeQuestion.winnerName || 'Another member');
      const timer = setTimeout(() => {
        dismissModal();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [activeQuestion?.isActive, activeQuestion?.winnerId, user?.id, dismissModal]);

  // If not open or no active question, render nothing
  if (!isModalOpen || !activeQuestion) {
    return null;
  }

  // Only show to members (coordinator sees the launcher in admin panel)
  if (user?.role !== 'member') {
    return null;
  }

  async function handleLockIn() {
    if (selectedIndex === null) return;
    if (submitting || hasAttempted) return;

    setSubmitting(true);
    setFeedbackMessage(null);

    try {
      const result = await submitAnswer(selectedIndex);
      if (result.isWinner) {
        setIsWrongAnswer(false);
        setFeedbackMessage(result.message || 'You solved the Golden Question!');
      } else {
        setIsWrongAnswer(true);
        setFeedbackMessage(
          result.message ||
            'Wrong answer! Your 1 attempt is used — waiting for someone else to crack it.'
        );
      }
    } catch (err: any) {
      console.error('Error submitting Golden Question answer:', err);
      setIsWrongAnswer(true);
      setFeedbackMessage('An error occurred submitting your answer.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{
        backgroundColor: 'rgba(26, 51, 0, 0.55)',
        backdropFilter: 'blur(4px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="golden-question-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl border-2 border-[var(--color-forest-ink)] overflow-hidden shadow-2xl relative transition-all transform animate-fadeIn card-spring"
        style={{ backgroundColor: 'var(--color-cream-paper)' }}
      >
        {/* Washi Tape Accent on Top-Right Corner */}
        <div
          className="absolute -top-3.5 right-6 z-20 w-24 h-6 pointer-events-none shadow-xs -rotate-3"
          style={{
            backgroundColor: 'rgba(255, 233, 92, 0.95)',
            border: '1px dashed rgba(26, 51, 0, 0.3)',
          }}
        />

        {/* ── 1. Highlighter Yellow Header Band ── */}
        <div
          className="p-4 sm:p-5 border-b-2 border-[var(--color-forest-ink)] flex items-center justify-between gap-3 relative"
          style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full border-2 border-[var(--color-forest-ink)] flex items-center justify-center shadow-xs shrink-0 animate-bounce"
              style={{ backgroundColor: 'var(--color-cream-paper)' }}
            >
              <StickerIcon name="fluent-emoji-flat:high-voltage" size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  id="golden-question-title"
                  className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[var(--color-forest-ink)]"
                  style={{ fontFamily: 'var(--font-bricolage)' }}
                >
                  ⚡ Golden Question
                </span>
                <span
                  className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] text-[var(--color-forest-ink)] shadow-xs"
                >
                  +{activeQuestion.points} PTS
                </span>
              </div>
              <p
                className="text-xs sm:text-sm text-[var(--color-forest-ink)] font-semibold mt-0.5"
                style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '18px',
                  lineHeight: '1.2',
                }}
              >
                first one to answer wins — 1 attempt only!
              </p>
            </div>
          </div>

          {/* Dismiss button (only if wrong, or won, or solved by other) */}
          {(hasAttempted || isWrongAnswer || isWinner || solvedByOther) && (
            <button
              onClick={dismissModal}
              className="w-8 h-8 rounded-full border border-[var(--color-forest-ink)] flex items-center justify-center text-[var(--color-forest-ink)] hover:bg-[var(--color-cream-paper)] cursor-pointer transition-colors"
              aria-label="Close"
            >
              <Icon icon="doodle:x" width={16} height={16} />
            </button>
          )}
        </div>

        {/* ── 2. Modal Body ── */}
        <div className="p-5 sm:p-6">
          {/* A. SOLVED BY SOMEONE ELSE */}
          {solvedByOther && !isWinner && (
            <div className="py-6 px-4 text-center flex flex-col items-center gap-3">
              <div
                className="w-14 h-14 rounded-full border-2 border-[var(--color-forest-ink)] flex items-center justify-center shadow-xs"
                style={{ backgroundColor: '#ffe95c' }}
              >
                <StickerIcon name="fluent-emoji-flat:alarm-clock" size={30} />
              </div>
              <h3
                className="text-xl font-extrabold text-[var(--color-forest-ink)]"
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                Already Solved!
              </h3>
              <p
                className="text-sm text-[var(--color-forest-ink)] font-medium max-w-sm"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <span className="font-bold underline">{solvedByOther}</span> cracked the Golden Question first! Keep an eye on the Wall for the next drop.
              </p>
              <button
                onClick={dismissModal}
                className="mt-2 px-5 py-2 rounded-xl border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] text-xs font-bold text-[var(--color-forest-ink)] cursor-pointer btn-spring"
              >
                Close (Auto-closing...)
              </button>
            </div>
          )}

          {/* B. CELEBRATION WIN STATE */}
          {isWinner && (
            <div className="py-6 px-4 text-center flex flex-col items-center gap-3 animate-fadeIn">
              <div
                className="w-16 h-16 rounded-full border-2 border-[var(--color-forest-ink)] flex items-center justify-center shadow-md animate-bounce"
                style={{ backgroundColor: '#d5f5c2' }}
              >
                <StickerIcon name="fluent-emoji-flat:trophy" size={36} />
              </div>
              <h3
                className="text-2xl font-extrabold text-[var(--color-forest-ink)] tracking-tight"
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                🎉 YOU CRACKED IT!
              </h3>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-forest-ink)] bg-[var(--color-highlighter-yellow)] text-sm font-mono font-bold text-[var(--color-forest-ink)]">
                ⚡ +{activeQuestion.points} PTS EARNED!
              </div>
              <p
                className="text-sm text-[var(--color-forest-ink)] font-medium max-w-sm mt-1"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                You were the first member to lock in the right answer! Your points have been added and announced live on the Team Wall.
              </p>
              <div className="mt-1">
                <SketchCallout
                  text="first-place lock recorded ⚡"
                  arrow="none"
                  color="var(--color-forest-ink)"
                  fontSize={18}
                />
              </div>
              <button
                onClick={dismissModal}
                className="mt-4 px-6 py-2.5 rounded-xl border-2 border-[var(--color-forest-ink)] bg-[var(--color-forest-ink)] text-white text-sm font-bold cursor-pointer btn-spring shadow-sm"
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                Claim Victory & Close 🚀
              </button>
            </div>
          )}

          {/* C. WRONG ANSWER STATE (1 ATTEMPT USED) */}
          {(isWrongAnswer || (hasAttempted && !isWinner)) && !solvedByOther && (
            <div className="py-6 px-4 text-center flex flex-col items-center gap-3 animate-fadeIn">
              <div
                className="w-14 h-14 rounded-full border-2 border-[var(--color-forest-ink)] flex items-center justify-center shadow-xs"
                style={{ backgroundColor: '#ffebe6' }}
              >
                <StickerIcon name="fluent-emoji-flat:cross-mark" size={28} />
              </div>
              <h3
                className="text-xl font-bold text-[var(--color-terracotta)]"
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                Attempt Used!
              </h3>
              <p
                className="text-sm text-[var(--color-forest-ink)] font-medium max-w-sm leading-relaxed"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {feedbackMessage ||
                  'Wrong answer! Your 1 attempt is used — waiting for someone else to crack it.'}
              </p>
              <div className="mt-1">
                <SketchCallout
                  text="better luck on the next pop quiz! ↩"
                  arrow="none"
                  color="var(--color-terracotta)"
                  fontSize={17}
                />
              </div>
              <button
                onClick={dismissModal}
                className="mt-4 px-6 py-2 rounded-xl border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] hover:bg-black/5 text-xs font-bold text-[var(--color-forest-ink)] cursor-pointer btn-spring"
              >
                Close & Return to Studio
              </button>
            </div>
          )}

          {/* D. ACTIVE QUIZ (UNATTEMPTED) */}
          {!isWinner && !isWrongAnswer && !hasAttempted && !solvedByOther && (
            <div>
              {/* Question text */}
              <div className="mb-5">
                <span
                  className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-pencil-gray)] mb-1 block"
                >
                  Question:
                </span>
                <h3
                  className="text-lg sm:text-xl font-bold text-[var(--color-forest-ink)] leading-snug"
                  style={{ fontFamily: 'var(--font-bricolage)' }}
                >
                  "{activeQuestion.question}"
                </h3>
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-2.5 mb-6">
                {activeQuestion.options.map((option, idx) => {
                  const isSelected = selectedIndex === idx;
                  const letter = String.fromCharCode(65 + idx);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedIndex(idx)}
                      className={`w-full p-3.5 rounded-xl border-2 text-left flex items-center justify-between gap-3 cursor-pointer transition-all btn-spring ${
                        isSelected
                          ? 'border-[var(--color-forest-ink)] bg-[var(--color-highlighter-yellow)] shadow-sm scale-[1.01]'
                          : 'border-[var(--color-forest-ink)]/30 bg-white hover:border-[var(--color-forest-ink)] hover:bg-[var(--color-cream-paper)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-full border border-[var(--color-forest-ink)] flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                            isSelected
                              ? 'bg-[var(--color-forest-ink)] text-white'
                              : 'bg-[var(--color-cream-paper)] text-[var(--color-forest-ink)]'
                          }`}
                        >
                          {letter}
                        </span>
                        <span
                          className="text-sm font-semibold text-[var(--color-forest-ink)] truncate"
                          style={{ fontFamily: 'var(--font-inter)' }}
                        >
                          {option}
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border border-[var(--color-forest-ink)] flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[var(--color-forest-ink)] text-white' : 'bg-transparent'
                        }`}
                      >
                        {isSelected && <Icon icon="doodle:check" width={12} height={12} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--color-forest-ink)]/15">
                <button
                  type="button"
                  onClick={dismissModal}
                  className="px-4 py-2.5 rounded-xl border border-[var(--color-pencil-gray)] text-xs font-bold text-[var(--color-pencil-gray)] hover:text-[var(--color-forest-ink)] hover:border-[var(--color-forest-ink)] transition-colors cursor-pointer"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Pass / Dismiss
                </button>

                <button
                  type="button"
                  disabled={selectedIndex === null || submitting}
                  onClick={handleLockIn}
                  className={`px-6 py-2.5 rounded-xl border-2 border-[var(--color-forest-ink)] text-sm font-extrabold cursor-pointer transition-all shadow-sm btn-spring flex items-center gap-2 ${
                    selectedIndex !== null && !submitting
                      ? 'bg-[var(--color-highlighter-yellow)] text-[var(--color-forest-ink)] hover:scale-105'
                      : 'bg-[var(--color-whisper-gray)] text-[var(--color-pencil-gray)] opacity-60 cursor-not-allowed'
                  }`}
                  style={{ fontFamily: 'var(--font-bricolage)' }}
                >
                  <StickerIcon name="fluent-emoji-flat:high-voltage" size={16} />
                  <span>{submitting ? 'Locking in...' : 'Lock In Answer →'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
