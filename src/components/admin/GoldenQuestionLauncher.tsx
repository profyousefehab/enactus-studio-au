import { useState } from 'react';
import { Icon } from '@iconify/react';
import StickerIcon from '../ui/StickerIcon';
import SketchCallout from '../ui/SketchCallout';
import { useGoldenQuestion } from '../../context/GoldenQuestionContext';
import { useSession } from '../../context/SessionContext';

const QUICK_POINTS = [20, 25, 30, 50];

const SAMPLE_PRESETS = [
  {
    q: "What is the primary headline font of our SayBriefly sketchbook design?",
    opts: ["Inter", "Bricolage Grotesque", "Roboto Mono", "Comic Sans"],
    correct: 1,
    pts: 30,
  },
  {
    q: "How many points do you earn for submitting a task before the deadline?",
    opts: ["+10 PTS", "+15 PTS", "+20 PTS", "+30 PTS"],
    correct: 2,
    pts: 25,
  },
  {
    q: "Which tier comes right after Potato 🥔 in our progression ladder?",
    opts: ["Rookie 🐣", "Pro ⚡", "Legend 🚀", "Mythic 💎"],
    correct: 0,
    pts: 20,
  },
];

export default function GoldenQuestionLauncher() {
  const { user } = useSession();
  const { activeQuestion, dropQuestion, cancelQuestion } = useGoldenQuestion();

  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [points, setPoints] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [formError, setFormError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  if (user?.role !== 'admin') {
    return null;
  }

  const isLive = Boolean(activeQuestion?.isActive && !activeQuestion?.winnerId);
  const isRecentlySolved = Boolean(!activeQuestion?.isActive && activeQuestion?.winnerId);

  function handleOptionChange(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  }

  function handleLoadPreset(preset: typeof SAMPLE_PRESETS[0]) {
    setQuestionText(preset.q);
    setOptions([...preset.opts]);
    setCorrectIndex(preset.correct);
    setPoints(preset.pts);
    setFormError('');
  }

  async function handleDrop(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSuccessNotice('');

    if (!questionText.trim()) {
      setFormError('Please enter a question prompt.');
      return;
    }

    const filledOptions = options.map((o) => o.trim());
    if (filledOptions.some((o) => !o)) {
      setFormError('Please fill out all 4 options.');
      return;
    }

    if (correctIndex < 0 || correctIndex > 3) {
      setFormError('Please select the correct answer choice.');
      return;
    }

    setIsSubmitting(true);
    try {
      await dropQuestion(questionText.trim(), filledOptions, correctIndex, points);
      setSuccessNotice('⚡ Golden Question dropped live to all members!');
      setTimeout(() => {
        setSuccessNotice('');
      }, 4000);
    } catch (err: any) {
      console.error('Failed to drop golden question:', err);
      setFormError(err?.message || 'Failed to drop golden question.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Are you sure you want to pull down and cancel this active Golden Question?')) {
      return;
    }

    setCancelling(true);
    try {
      await cancelQuestion();
    } catch (err: any) {
      console.error('Failed to cancel golden question:', err);
      alert('Failed to cancel question.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ───── In-Page Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-pencil-gray)]/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-forest-ink)]"
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              Golden Question ⚡
            </h2>
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--color-forest-ink)]"
              style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
            >
              POP QUIZ
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-pencil-gray)]" style={{ fontFamily: 'var(--font-inter)' }}>
            First member to lock in the correct answer wins instant points + Wall celebration!
          </p>
        </div>

        <SketchCallout
          text="instant pop-up live ⤵"
          arrow="down-right"
          color="#cb5521"
          rotate="-rotate-2"
          fontSize={18}
        />
      </div>

      {/* ───── Shared 2-Column Section Template (Desktop lg+) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (~2/3): Questions and Results */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          {/* Active Live Question Card */}
          {isLive && activeQuestion ? (
            <div
              className="p-5 rounded-2xl border-2 border-[var(--color-forest-ink)] shadow-md"
              style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
            >
              <div className="flex items-start justify-between gap-3 mb-3 pb-2 border-b border-[var(--color-forest-ink)]/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1a3300] animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                    Live Active Question ({activeQuestion.points} PTS)
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-cream-paper)] border border-[var(--color-forest-ink)] text-[var(--color-forest-ink)]">
                  {activeQuestion.attemptedBy?.length || 0} wrong attempt(s)
                </span>
              </div>

              <h3
                className="text-lg sm:text-xl font-extrabold text-[var(--color-forest-ink)] mb-4 leading-snug"
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                "{activeQuestion.question}"
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                {activeQuestion.options.map((opt, idx) => {
                  const isCorrect = idx === activeQuestion.correctIndex;
                  return (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-between"
                      style={{
                        backgroundColor: isCorrect ? '#d5f5c2' : 'var(--color-cream-paper)',
                        borderColor: 'var(--color-forest-ink)',
                        color: 'var(--color-forest-ink)',
                        fontFamily: 'var(--font-inter)',
                      }}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="font-mono font-bold">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span className="truncate">{opt}</span>
                      </span>
                      {isCorrect && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-forest-ink)] text-white shrink-0 ml-1">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--color-forest-ink)]/20">
                <span className="text-xs text-[var(--color-forest-ink)] font-inter">
                  Active pop-up currently appearing on all connected member screens.
                </span>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-terracotta)] text-[var(--color-terracotta)] bg-white hover:bg-[#ffebe6] text-xs font-bold cursor-pointer transition-colors btn-spring flex items-center gap-1"
                >
                  <Icon icon="doodle:close" width={14} height={14} />
                  <span>{cancelling ? 'Cancelling...' : 'Cancel Question'}</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Recently Solved Winner Banner */}
          {isRecentlySolved && activeQuestion ? (
            <div
              className="p-4 rounded-2xl border border-[var(--color-forest-ink)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              style={{ backgroundColor: '#d5f5c2' }}
            >
              <div className="flex items-center gap-3">
                <StickerIcon name="fluent-emoji-flat:trophy" size={28} />
                <div>
                  <p
                    className="text-xs sm:text-sm font-bold text-[var(--color-forest-ink)]"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Solved by <span className="underline">{activeQuestion.winnerName || 'A member'}</span> for +{activeQuestion.points} PTS!
                  </p>
                  <p
                    className="text-xs text-[var(--color-forest-ink)]/70 truncate max-w-sm"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    "{activeQuestion.question}" → {activeQuestion.options[activeQuestion.correctIndex]}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-[var(--color-forest-ink)] px-2.5 py-1 rounded bg-[var(--color-cream-paper)] border border-[var(--color-forest-ink)] self-start sm:self-auto">
                Wall Announced ✓
              </span>
            </div>
          ) : null}

          {/* Quiz Mechanics & Info Card */}
          <div
            className="p-5 rounded-2xl border border-[var(--color-forest-ink)] shadow-xs flex flex-col gap-3"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-pencil-gray)]/30">
              <Icon icon="doodle:help-circle" width={18} height={18} className="text-[var(--color-forest-ink)]" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                Pop Quiz Rules & Wall Mechanics
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-inter text-[var(--color-forest-ink)]">
              <div className="p-3 rounded-xl border border-[var(--color-pencil-gray)] bg-white">
                <span className="font-bold block mb-1">1. Live Interruption</span>
                <p className="text-[var(--color-pencil-gray)] leading-relaxed">
                  Dropping a question immediately displays a pop-up modal on every connected member's device.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-[var(--color-pencil-gray)] bg-white">
                <span className="font-bold block mb-1">2. Single Winner Lock</span>
                <p className="text-[var(--color-pencil-gray)] leading-relaxed">
                  Only the first person with the correct choice claims the reward points. Wrong guesses lock that member out.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-[var(--color-pencil-gray)] bg-white">
                <span className="font-bold block mb-1">3. Team Wall Broadcast</span>
                <p className="text-[var(--color-pencil-gray)] leading-relaxed">
                  Upon winning, an official celebratory drop is posted automatically to the Team Wall with the winner's avatar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (~1/3): Sticky Publish & Reward Controls Rail */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20 z-10 flex flex-col gap-4">
          <div
            className="p-4 sm:p-5 rounded-2xl border-2 border-[var(--color-forest-ink)] shadow-sm flex flex-col gap-4"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="pb-2 border-b border-[var(--color-pencil-gray)]/30">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                Launch Pop Quiz
              </span>
              <p className="text-[11px] text-[var(--color-pencil-gray)] font-inter mt-0.5">
                Set question, options, and points.
              </p>
            </div>

            {/* Presets */}
            <div>
              <span className="block text-xs font-bold mb-1 text-[var(--color-forest-ink)] font-inter">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLoadPreset(p)}
                    className="text-[11px] px-2 py-1 rounded-md border border-[var(--color-pencil-gray)] bg-white hover:bg-[var(--color-highlighter-yellow)] hover:border-[var(--color-forest-ink)] transition-colors cursor-pointer text-[var(--color-forest-ink)] font-medium btn-spring"
                  >
                    ⚡ Preset {idx + 1} ({p.pts} pts)
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleDrop} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1 text-[var(--color-forest-ink)] font-inter">
                  Question Prompt
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. What font is used in our sketchbook?"
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white text-[var(--color-forest-ink)] resize-none"
                  style={{ fontFamily: 'var(--font-inter)' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[var(--color-forest-ink)] font-inter">
                    Options & Correct Choice:
                  </label>
                  <span className="text-[10px] text-[var(--color-pencil-gray)] font-mono">
                    Check radio = correct
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {options.map((opt, idx) => {
                    const isSelectedCorrect = correctIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all ${
                          isSelectedCorrect
                            ? 'border-[var(--color-forest-ink)] bg-[#d5f5c2]/60'
                            : 'border-[var(--color-pencil-gray)] bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="correctOption"
                          checked={isSelectedCorrect}
                          onChange={() => setCorrectIndex(idx)}
                          className="w-3.5 h-3.5 text-[var(--color-forest-ink)] accent-[var(--color-forest-ink)] cursor-pointer"
                        />
                        <span className="font-mono text-xs font-bold text-[var(--color-forest-ink)] w-4">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          className="w-full text-xs p-1 bg-transparent focus:outline-none text-[var(--color-forest-ink)]"
                          style={{ fontFamily: 'var(--font-inter)' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reward Points */}
              <div>
                <label className="block text-xs font-bold mb-1 text-[var(--color-forest-ink)] font-inter">
                  Points Reward:
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {QUICK_POINTS.map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setPoints(pt)}
                      className={`px-2 py-1 text-xs font-mono font-bold rounded border cursor-pointer transition-all btn-spring ${
                        points === pt
                          ? 'border-[var(--color-forest-ink)] bg-[var(--color-highlighter-yellow)] text-[var(--color-forest-ink)]'
                          : 'border-[var(--color-pencil-gray)] bg-white text-[var(--color-pencil-gray)]'
                      }`}
                    >
                      +{pt}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={5}
                    max={200}
                    step={5}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-16 p-1 text-center font-mono text-xs border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] rounded bg-white text-[var(--color-forest-ink)]"
                  />
                </div>
              </div>

              {/* Exactly ONE dark-green primary CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl border border-[var(--color-forest-ink)] text-xs font-bold cursor-pointer transition-all btn-spring text-center flex items-center justify-center gap-1.5 disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--color-forest-ink)',
                  color: 'var(--color-cream-paper)',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                <StickerIcon name="fluent-emoji-flat:high-voltage" size={14} />
                <span>{isSubmitting ? 'Dropping Pop Quiz...' : 'Drop Golden Question ⚡'}</span>
              </button>

              {formError && (
                <div className="p-2 rounded-lg border border-[var(--color-terracotta)] bg-[#ffebe6] text-[var(--color-terracotta)] text-xs font-semibold">
                  {formError}
                </div>
              )}

              {successNotice && (
                <div className="p-2 rounded-lg border border-[#147a4d] bg-[#d5f5c2] text-[#147a4d] text-xs font-bold animate-fadeIn">
                  {successNotice}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
