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
      // Reset form after short delay
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
    <div
      className="p-5 relative rounded-2xl border-2 border-[var(--color-forest-ink)] shadow-md overflow-hidden card-spring"
      style={{ backgroundColor: 'var(--color-cream-paper)' }}
    >
      {/* Tactile Washi Tape Strip on Top-Right */}
      <div
        className="absolute -top-3 right-8 w-24 h-6 pointer-events-none shadow-xs -rotate-2 z-10"
        style={{
          backgroundColor: 'rgba(255, 233, 92, 0.9)',
          border: '1px dashed rgba(26, 51, 0, 0.3)',
        }}
      />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--color-forest-ink)]/15">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-full border-2 border-[var(--color-forest-ink)] flex items-center justify-center shrink-0 shadow-xs"
            style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
          >
            <StickerIcon name="fluent-emoji-flat:high-voltage" size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                className="text-lg font-bold text-[var(--color-forest-ink)] tracking-tight"
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                Golden Question ⚡
              </h3>
              <span
                className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border border-[var(--color-forest-ink)]"
                style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
              >
                Pop Quiz
              </span>
            </div>
            <p
              className="text-xs text-[var(--color-pencil-gray)]"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              First member to lock in the correct answer wins instant points + Wall celebration!
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        {isLive && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-forest-ink)] bg-[#d5f5c2] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#1a3300]" />
            <span
              className="text-xs font-mono font-bold text-[var(--color-forest-ink)]"
            >
              LIVE NOW
            </span>
          </div>
        )}
      </div>

      {/* ── ACTIVE LIVE STATUS CARD ── */}
      {isLive && activeQuestion && (
        <div
          className="p-4 mb-5 rounded-xl border-2 border-[var(--color-forest-ink)] shadow-sm"
          style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                Active Question ({activeQuestion.points} PTS)
              </span>
            </div>
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-cream-paper)] border border-[var(--color-forest-ink)] text-[var(--color-forest-ink)]"
            >
              {activeQuestion.attemptedBy?.length || 0} wrong attempt(s)
            </span>
          </div>

          <h4
            className="text-base font-extrabold text-[var(--color-forest-ink)] mb-3 leading-snug"
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            "{activeQuestion.question}"
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {activeQuestion.options.map((opt, idx) => {
              const isCorrect = idx === activeQuestion.correctIndex;
              return (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-between"
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

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-forest-ink)]/20">
            <span
              className="text-xs text-[var(--color-forest-ink)] font-medium"
              style={{ fontFamily: 'var(--font-hand)', fontSize: '17px' }}
            >
              Pop-up is currently active across all member screens!
            </span>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="px-3 py-1.5 rounded-lg border border-[var(--color-terracotta)] text-[var(--color-terracotta)] bg-[var(--color-cream-paper)] hover:bg-[var(--color-terracotta)] hover:text-white text-xs font-bold cursor-pointer transition-colors btn-spring flex items-center gap-1"
            >
              <Icon icon="doodle:trash" width={14} height={14} />
              <span>{cancelling ? 'Cancelling...' : 'Cancel Question'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── RECENTLY SOLVED BANNER ── */}
      {isRecentlySolved && activeQuestion && (
        <div
          className="p-3.5 mb-5 rounded-xl border border-[var(--color-forest-ink)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          style={{ backgroundColor: '#d5f5c2' }}
        >
          <div className="flex items-center gap-2.5">
            <StickerIcon name="fluent-emoji-flat:trophy" size={26} />
            <div>
              <p
                className="text-xs font-bold text-[var(--color-forest-ink)]"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Solved by <span className="underline">{activeQuestion.winnerName || 'A member'}</span> for +{activeQuestion.points} PTS!
              </p>
              <p
                className="text-[11px] text-[var(--color-forest-ink)]/70 truncate max-w-sm"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                "{activeQuestion.question}" → {activeQuestion.options[activeQuestion.correctIndex]}
              </p>
            </div>
          </div>
          <span
            className="text-[11px] font-mono font-bold text-[var(--color-forest-ink)] px-2 py-1 rounded bg-[var(--color-cream-paper)] border border-[var(--color-forest-ink)] self-start sm:self-auto"
          >
            Wall Announced ✓
          </span>
        </div>
      )}

      {/* ── QUICK PRESETS ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-xs font-bold text-[var(--color-forest-ink)]"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Quick Studio Presets:
          </span>
          <SketchCallout
            text="tap to pre-fill"
            arrow="none"
            color="var(--color-forest-ink)"
            fontSize={15}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {SAMPLE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadPreset(p)}
              className="text-xs px-2.5 py-1 rounded-md border border-[var(--color-pencil-gray)] bg-[var(--color-whisper-gray)] hover:bg-[var(--color-highlighter-yellow)] hover:border-[var(--color-forest-ink)] transition-colors cursor-pointer text-[var(--color-forest-ink)] font-medium"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              ⚡ Preset {idx + 1} ({p.pts} pts)
            </button>
          ))}
        </div>
      </div>

      {/* ── DROP FORM ── */}
      <form onSubmit={handleDrop} className="space-y-4">
        {/* Question Input */}
        <div>
          <label
            className="block text-xs font-bold uppercase tracking-wider mb-1 text-[var(--color-forest-ink)] font-mono"
          >
            Question Prompt:
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="e.g. What is the deadline for this week's Design track deliverable?"
            rows={2}
            className="w-full p-3 rounded-lg border border-[var(--color-forest-ink)] text-sm text-[var(--color-forest-ink)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-highlighter-yellow)]"
            style={{ fontFamily: 'var(--font-inter)' }}
          />
        </div>

        {/* 4 Multiple-Choice Options */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-forest-ink)] font-mono">
              Options & Correct Choice:
            </label>
            <span
              className="text-[11px] text-[var(--color-pencil-gray)]"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Select the radio button on the correct answer
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {options.map((opt, idx) => {
              const isSelectedCorrect = correctIndex === idx;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    isSelectedCorrect
                      ? 'border-[var(--color-forest-ink)] bg-[#d5f5c2]/50 shadow-xs'
                      : 'border-[var(--color-pencil-gray)] bg-white'
                  }`}
                >
                  <label className="flex items-center cursor-pointer shrink-0">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={isSelectedCorrect}
                      onChange={() => setCorrectIndex(idx)}
                      className="w-4 h-4 text-[var(--color-forest-ink)] accent-[var(--color-forest-ink)] cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold ml-1.5 text-[var(--color-forest-ink)]">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                  </label>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    className="w-full text-xs p-1.5 bg-transparent focus:outline-none text-[var(--color-forest-ink)] font-medium"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  />
                  {isSelectedCorrect && (
                    <span className="text-[10px] font-mono font-bold text-[var(--color-forest-ink)] shrink-0 px-1 py-0.5 rounded bg-[#d5f5c2] border border-[var(--color-forest-ink)]">
                      Correct ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Points Reward & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[var(--color-forest-ink)]/15">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold font-mono text-[var(--color-forest-ink)]">
              Reward:
            </span>
            {QUICK_POINTS.map((pt) => (
              <button
                key={pt}
                type="button"
                onClick={() => setPoints(pt)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded border cursor-pointer transition-all btn-spring ${
                  points === pt
                    ? 'border-[var(--color-forest-ink)] bg-[var(--color-highlighter-yellow)] text-[var(--color-forest-ink)] shadow-xs scale-105'
                    : 'border-[var(--color-pencil-gray)] bg-white text-[var(--color-pencil-gray)]'
                }`}
              >
                +{pt} PTS
              </button>
            ))}
            <input
              type="number"
              min={5}
              max={200}
              step={5}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-16 p-1 text-center font-mono text-xs border border-[var(--color-forest-ink)] rounded bg-white text-[var(--color-forest-ink)]"
            />
          </div>

          {/* Primary CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border-2 border-[var(--color-forest-ink)] text-sm font-extrabold cursor-pointer transition-all shadow-sm btn-spring flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--color-highlighter-yellow)',
              color: 'var(--color-forest-ink)',
              fontFamily: 'var(--font-bricolage)',
            }}
          >
            <StickerIcon name="fluent-emoji-flat:high-voltage" size={18} />
            <span>{isSubmitting ? 'Dropping Pop Quiz...' : 'Drop Golden Question ⚡'}</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
        {formError && (
          <div className="p-2.5 rounded-lg border border-[var(--color-terracotta)] bg-[#ffebe6] text-[var(--color-terracotta)] text-xs font-semibold flex items-center gap-2">
            <Icon icon="doodle:alert-circle" width={16} height={16} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-2.5 rounded-lg border border-[#147a4d] bg-[#d5f5c2] text-[#147a4d] text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <Icon icon="doodle:check" width={16} height={16} className="shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}
      </form>
    </div>
  );
}
