// ═══════════════════════════════════════════
// Guidelines Page — Creative Studio Playbook
// Tactile, open-card moodboard layout matching the SayBriefly aesthetic.
// Features visual point ledger, horizontal tiers mini-ladder,
// 2 Stars & 1 Wish framework diagram, and Firestore-backed admin editing.
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import StickerIcon from '../components/ui/StickerIcon';
import { db } from '../lib/firebase';
import { useSession } from '../context/SessionContext';
import BricolageHeadline from '../components/ui/BricolageHeadline';
import SkeletonCard from '../components/ui/SkeletonCard';
import SketchCallout from '../components/ui/SketchCallout';

export interface GuidelineSection {
  id: string;
  title: string;
  icon: string;
  accentColor: string;
  content: string;
}

const DEFAULT_SECTIONS: GuidelineSection[] = [
  {
    id: 'points',
    title: 'How Points Work',
    icon: 'fluent-emoji-flat:star',
    accentColor: 'var(--color-highlighter-yellow)',
    content:
      '• +10 PTS — Attending a session on time\n• +20 PTS — Submitting a task before the deadline\n• +15 PTS — Giving thoughtful feedback to your partner\n• +15 PTS — Showing initiative (volunteering, helping peers, sharing resources)\n• −10 PTS — Missing a deadline without notice\n\nPoints accumulate throughout the season and determine your Tier and Leaderboard rank.',
  },
  {
    id: 'streaks',
    title: 'Attendance Streaks',
    icon: 'fluent-emoji-flat:fire',
    accentColor: 'var(--color-sticky-note-mint)',
    content:
      'Your streak counts how many consecutive sessions you\'ve attended.\n\n• Each session you attend adds +1 to your streak.\n• Missing a session resets your streak to 0.\n• If you have a valid excuse (approved by the coordinator), your streak is protected.\n• Your best-ever streak is tracked on your Profile card.\n\nKeep the fire going — consistency is what separates Pros from Potatoes!',
  },
  {
    id: 'tiers',
    title: 'Tiers Ladder',
    icon: 'fluent-emoji-flat:gem-stone',
    accentColor: 'var(--color-sticky-note-blush)',
    content:
      '🥔 Potato — 0 to 49 pts — Just getting started\n🐣 Rookie — 50 to 149 pts — Moving & earning points\n⚡ Pro — 150 to 299 pts — Steady & crushing it\n🚀 Legend — 300 to 499 pts — Major impact on the team\n💎 Mythic — 500+ pts — Overpowered / Top of the team\n\nYour tier updates automatically as you earn points. Check the progress bar on your Profile to see how close you are to the next level!',
  },
  {
    id: 'feedback',
    title: 'Feedback Partners',
    icon: 'fluent-emoji-flat:handshake',
    accentColor: 'var(--color-sticky-note-teal)',
    content:
      'Every two weeks, you\'ll be paired with a Feedback Partner from the other track (Design ↔ Content) for peer reviews.\n\nUse the "2 Stars & 1 Wish" framework:\n⭐ Star 1 — Something specific they did really well\n⭐ Star 2 — Another strength or improvement you noticed\n🌟 Wish — One actionable suggestion for next time\n\nGive genuine, constructive feedback — it helps everyone grow. You earn +15 PTS for each review you give.',
  },
  {
    id: 'rules',
    title: 'Team Rules & Etiquette',
    icon: 'fluent-emoji-flat:scroll',
    accentColor: 'var(--color-cream-paper)',
    content:
      '1. Respect deadlines — submit tasks on time or communicate early if you need an extension.\n2. Be kind and constructive — this is a learning environment, not a competition against each other.\n3. Attend sessions — your streak and your team count on you.\n4. English only for all submissions and wall posts (we\'re practicing professional communication).\n5. No plagiarism — always credit your sources and inspirations.\n6. Keep the Wall clean — post ideas, questions, and resources. No spam or off-topic content.\n7. Help each other — if you know something, share it. Team members lift each other up.',
  },
];

const FIRESTORE_DOC = 'settings/guidelines';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'fluent-emoji-flat:sparkles' },
  { id: 'points', label: 'Points', icon: 'fluent-emoji-flat:star' },
  { id: 'streaks', label: 'Streaks', icon: 'fluent-emoji-flat:fire' },
  { id: 'tiers', label: 'Tiers', icon: 'fluent-emoji-flat:gem-stone' },
  { id: 'feedback', label: 'Feedback', icon: 'fluent-emoji-flat:handshake' },
  { id: 'rules', label: 'Rules', icon: 'fluent-emoji-flat:scroll' },
];

const TIERS_DATA = [
  {
    name: 'Potato',
    icon: 'fluent-emoji-flat:potato',
    threshold: '0+',
    range: '0 to 49 pts',
    desc: 'Just getting started',
    bg: '#fcfaf5',
  },
  {
    name: 'Rookie',
    icon: 'fluent-emoji-flat:hatching-chick',
    threshold: '50+',
    range: '50 to 149 pts',
    desc: 'Moving & earning points',
    bg: '#d5f5c2',
  },
  {
    name: 'Pro',
    icon: 'fluent-emoji-flat:high-voltage',
    threshold: '150+',
    range: '150 to 299 pts',
    desc: 'Steady & crushing it',
    bg: '#ffe95c',
  },
  {
    name: 'Legend',
    icon: 'fluent-emoji-flat:rocket',
    threshold: '300+',
    range: '300 to 499 pts',
    desc: 'Major impact on the team',
    bg: '#a8e5e5',
  },
  {
    name: 'Mythic',
    icon: 'fluent-emoji-flat:gem-stone',
    threshold: '500+',
    range: '500+ pts',
    desc: 'Overpowered / Top of the team',
    bg: '#f6d0ff',
  },
];

const ACCENT_PRESETS = [
  { label: 'Yellow', val: 'var(--color-highlighter-yellow)' },
  { label: 'Mint', val: 'var(--color-sticky-note-mint)' },
  { label: 'Teal', val: 'var(--color-sticky-note-teal)' },
  { label: 'Blush', val: 'var(--color-sticky-note-blush)' },
  { label: 'Cream', val: 'var(--color-cream-paper)' },
];

/** Remove raw Unicode emojis from titles so sticker icons shine cleanly */
function cleanTitle(title: string): string {
  return title
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();
}

/** Get small studio badge for card header */
function getSectionBadge(id: string): string {
  switch (id) {
    case 'points':
      return 'Ledger';
    case 'streaks':
      return 'Momentum';
    case 'tiers':
      return '5 Levels';
    case 'feedback':
      return 'Peer Review';
    case 'rules':
      return 'Standards';
    default:
      return 'Playbook';
  }
}

/** Point pill styling helper matching SayBriefly requirements */
function getPointPillStyle(pts: string): { bg: string; text: string; border: string } {
  const clean = pts.replace('−', '-');
  const num = parseInt(clean.replace(/[^\d-]/g, ''), 10);

  if (clean.includes('-') || num < 0) {
    // Terracotta #cb5521 with #fcfaf5 text
    return { bg: '#cb5521', text: '#fcfaf5', border: '#1a3300' };
  }
  if (num >= 20) {
    // Mint #d5f5c2
    return { bg: '#d5f5c2', text: '#1a3300', border: '#1a3300' };
  }
  if (num >= 15) {
    // Teal #a8e5e5
    return { bg: '#a8e5e5', text: '#1a3300', border: '#1a3300' };
  }
  if (num >= 10) {
    // Highlighter Yellow #ffe95c
    return { bg: '#ffe95c', text: '#1a3300', border: '#1a3300' };
  }
  return { bg: '#d5f5c2', text: '#1a3300', border: '#1a3300' };
}

interface ParsedPointRule {
  points: string;
  label: string;
}

function parsePointsContent(content: string): { rules: ParsedPointRule[]; footerNotes: string[] } {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const rules: ParsedPointRule[] = [];
  const footerNotes: string[] = [];

  for (const line of lines) {
    // Match bullet or line with "+10 PTS — Description"
    const match = line.match(/^[•\-\*]?\s*([+\-−]?\d+\s*PTS?)\s*(?:[—–\-:]\s*)(.+)$/i);
    if (match) {
      rules.push({
        points: match[1].replace('−', '-').toUpperCase(),
        label: match[2].trim(),
      });
    } else {
      footerNotes.push(line);
    }
  }

  return { rules, footerNotes };
}

export default function Guidelines() {
  const { user } = useSession();
  const [sections, setSections] = useState<GuidelineSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editing, setEditing] = useState(false);
  const [editSections, setEditSections] = useState<GuidelineSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load from Firestore with real-time listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, ...FIRESTORE_DOC.split('/') as [string, string]), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.sections) && data.sections.length > 0) {
          setSections(data.sections as GuidelineSection[]);
        } else {
          setSections(DEFAULT_SECTIONS);
        }
      } else {
        setSections(DEFAULT_SECTIONS);
        setDoc(doc(db, ...FIRESTORE_DOC.split('/') as [string, string]), {
          sections: DEFAULT_SECTIONS,
          updatedAt: new Date().toISOString(),
        }).catch(console.error);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  function startEditing() {
    setEditSections(sections.map((s) => ({ ...s })));
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setSaveError(null);
    setEditSections([]);
  }

  async function saveEdits() {
    setSaving(true);
    setSaveError(null);
    try {
      await setDoc(doc(db, ...FIRESTORE_DOC.split('/') as [string, string]), {
        sections: editSections,
        updatedAt: new Date().toISOString(),
      });
      setEditing(false);
    } catch (err) {
      console.error('Failed to save guidelines:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  function updateEditSection(id: string, field: keyof GuidelineSection, value: string) {
    setEditSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  const isAdmin = user?.role === 'admin';

  // Filter sections when quick-jump pill is selected
  const displayedSections = (editing ? editSections : sections).filter((s) =>
    activeCategory === 'all' ? true : s.id === activeCategory
  );

  return (
    <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <BricolageHeadline highlight={['Guidelines']} className="text-3xl">
            Team Guidelines
          </BricolageHeadline>
          <p
            className="text-xs mt-1"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)', opacity: 0.75 }}
          >
            The official playbook, scoring ledger, and standards for Social Media & Design.
          </p>
        </div>

        {isAdmin && !editing && (
          <button
            onClick={startEditing}
            className="btn-spring shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold cursor-pointer"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'var(--color-cream-paper)',
              backgroundColor: 'var(--color-forest-ink)',
              borderRadius: 'var(--radius-buttons)',
              border: 'none',
            }}
          >
            <StickerIcon name="pencil" size={14} />
            Edit Playbook
          </button>
        )}
      </div>

      {/* Admin edit action bar */}
      {editing && (
        <div className="flex flex-col gap-2">
          <div
            className="p-3 flex items-center justify-between gap-2 rounded-[10px] border border-[var(--color-forest-ink)]"
            style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
          >
            <div className="flex items-center gap-2">
              <StickerIcon name="fluent-emoji-flat:wrench" size={18} />
              <span
                className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Admin Edit Mode
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="px-3 py-1.5 text-xs font-semibold cursor-pointer rounded-[6px]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  color: 'var(--color-forest-ink)',
                  backgroundColor: 'var(--color-cream-paper)',
                  border: '1px solid var(--color-forest-ink)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdits}
                disabled={saving}
                className="btn-spring px-4 py-1.5 text-xs font-semibold cursor-pointer rounded-[6px]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  backgroundColor: 'var(--color-forest-ink)',
                  color: 'var(--color-cream-paper)',
                  border: 'none',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save Changes →'}
              </button>
            </div>
          </div>

          {saveError && (
            <p
              role="alert"
              className="text-xs font-semibold px-3 py-2"
              style={{
                color: 'var(--color-terracotta)',
                backgroundColor: 'rgba(203, 85, 33, 0.1)',
                border: '1px solid var(--color-terracotta)',
                borderRadius: 'var(--radius-buttons)',
              }}
            >
              Save failed: {saveError}
            </p>
          )}
        </div>
      )}

      {/* Quick-Jump Category Pills */}
      {!editing && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 -mx-1 px-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="pill-spring shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full cursor-pointer transition-colors"
                style={{
                  fontFamily: 'var(--font-inter)',
                  backgroundColor: isActive ? 'var(--color-forest-ink)' : 'var(--color-cream-paper)',
                  color: isActive ? 'var(--color-cream-paper)' : 'var(--color-forest-ink)',
                  border: '1px solid var(--color-forest-ink)',
                }}
              >
                <StickerIcon name={cat.icon} size={15} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter reset helper if filtered */}
      {!editing && activeCategory !== 'all' && (
        <div className="flex items-center justify-between text-xs px-1 text-[var(--color-forest-ink)]">
          <span className="font-medium opacity-75">
            Showing category: <strong className="font-bold opacity-100 uppercase font-mono">{activeCategory}</strong>
          </span>
          <button
            onClick={() => setActiveCategory('all')}
            className="font-bold underline hover:opacity-80 cursor-pointer"
          >
            View All Playbook Cards →
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col gap-4">
          <SkeletonCard height={96} />
          <SkeletonCard height={96} />
          <SkeletonCard height={96} />
        </div>
      )}

      {/* Studio Playbook Cards */}
      {!loading && (
        <div className="flex flex-col gap-4">
          {displayedSections.map((section) => {
            const isEditingThis = editing;

            return (
              <div
                key={section.id}
                id={`playbook-${section.id}`}
                className="overflow-hidden card-spring"
                style={{
                  backgroundColor: 'var(--color-cream-paper)',
                  border: '1px solid var(--color-forest-ink)',
                  borderRadius: 'var(--radius-cards)',
                }}
              >
                {/* Tactile Card Header Strip */}
                <div
                  className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-forest-ink)]"
                  style={{ backgroundColor: section.accentColor }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <StickerIcon name={section.icon} size={22} />

                    {isEditingThis ? (
                      <input
                        value={section.title}
                        onChange={(e) => updateEditSection(section.id, 'title', e.target.value)}
                        placeholder="Section title"
                        className="w-full text-sm font-bold outline-none px-2 py-1 rounded-[4px]"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          color: 'var(--color-forest-ink)',
                          backgroundColor: 'rgba(255,255,255,0.8)',
                          border: '1px solid var(--color-forest-ink)',
                        }}
                      />
                    ) : (
                      <h3
                        className="text-base font-bold truncate leading-tight"
                        style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
                      >
                        {cleanTitle(section.title)}
                      </h3>
                    )}
                  </div>

                  {!isEditingThis && (
                    <span
                      className="shrink-0 ml-2 text-[10px] font-bold font-mono px-2 py-0.5 uppercase tracking-wider rounded border border-[var(--color-forest-ink)] bg-white/75 text-[var(--color-forest-ink)]"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {getSectionBadge(section.id)}
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex flex-col gap-3.5">
                  {isEditingThis ? (
                    /* Admin inline raw editor */
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--color-forest-ink)]">Accent:</span>
                          <div className="flex items-center gap-1.5">
                            {ACCENT_PRESETS.map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => updateEditSection(section.id, 'accentColor', preset.val)}
                                className="w-5 h-5 rounded-full border border-[var(--color-forest-ink)] cursor-pointer"
                                style={{
                                  backgroundColor: preset.val,
                                  outline: section.accentColor === preset.val ? '2px solid var(--color-forest-ink)' : 'none',
                                  outlineOffset: '1px',
                                }}
                                title={preset.label}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-pencil-gray)]">
                          <span className="font-mono text-[11px]">Icon:</span>
                          <input
                            value={section.icon}
                            onChange={(e) => updateEditSection(section.id, 'icon', e.target.value)}
                            className="text-xs font-mono px-2 py-0.5 rounded border border-[var(--color-pencil-gray)] bg-white/80 w-36 outline-none"
                            placeholder="icon name"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs text-[var(--color-pencil-gray)]">
                          <span className="font-mono">Content Markdown / Text</span>
                          <span className="text-[11px]">Points format: • +20 PTS — Description</span>
                        </div>
                        <textarea
                          value={section.content}
                          onChange={(e) => updateEditSection(section.id, 'content', e.target.value)}
                          rows={8}
                          className="w-full text-xs sm:text-sm resize-y outline-none p-3 font-mono rounded-[6px]"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--color-forest-ink)',
                            backgroundColor: 'rgba(255,255,255,0.7)',
                            border: '1px solid var(--color-forest-ink)',
                            lineHeight: 1.5,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Tactile Studio Visual Content */
                    <>
                      {/* Section 1: How Points Work (Visual Point Ledger) */}
                      {section.id === 'points' && (
                        <VisualPointLedger content={section.content} />
                      )}

                      {/* Section 2: Attendance Streaks */}
                      {section.id === 'streaks' && (
                        <VisualStreaksPlaybook content={section.content} />
                      )}

                      {/* Section 3: Tiers Ladder (Visual Mini-Ladder) */}
                      {section.id === 'tiers' && (
                        <VisualTiersPlaybook content={section.content} />
                      )}

                      {/* Section 4: Feedback Partners (2 Stars & 1 Wish Visual Split) */}
                      {section.id === 'feedback' && (
                        <VisualFeedbackPlaybook content={section.content} />
                      )}

                      {/* Section 5: Studio Rules & Etiquette */}
                      {section.id === 'rules' && (
                        <VisualRulesPlaybook content={section.content} />
                      )}

                      {/* Fallback for any custom sections added by coordinator */}
                      {!['points', 'streaks', 'tiers', 'feedback', 'rules'].includes(section.id) && (
                        <p
                          className="text-sm leading-relaxed"
                          style={{
                            fontFamily: 'var(--font-inter)',
                            color: 'var(--color-forest-ink)',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {section.content}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Visual Modules for Studio Playbook Cards
// ═════════════════════════════════════════════════════════════════════════════

/**
 * 1. Visual Point Ledger
 * Renders each rule as a crisp visual ledger row with a Roboto Mono point pill on left
 * (+20 PTS in Mint #d5f5c2, +15 PTS in Teal #a8e5e5, +10 PTS in #ffe95c, -10 PTS in Terracotta #cb5521 with #fcfaf5 text)
 * and action label on right. No plain bullet points.
 */
function VisualPointLedger({ content }: { content: string }) {
  const { rules, footerNotes } = parsePointsContent(content);

  return (
    <div className="flex flex-col gap-3">
      {/* Ledger list */}
      <div className="flex flex-col gap-2">
        {rules.map((rule, idx) => {
          const pillStyle = getPointPillStyle(rule.points);
          return (
            <div
              key={idx}
              className="flex items-center gap-3 p-2.5 sm:p-3 rounded-[8px] border border-[var(--color-forest-ink)] card-spring"
              style={{
                backgroundColor: 'var(--color-cream-paper)',
              }}
            >
              {/* Point Pill */}
              <span
                className="shrink-0 px-2.5 py-1 text-xs font-bold tracking-wide uppercase rounded-[6px] text-center min-w-[74px]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: pillStyle.bg,
                  color: pillStyle.text,
                  border: `1px solid ${pillStyle.border}`,
                }}
              >
                {rule.points}
              </span>

              {/* Action Label */}
              <span
                className="text-xs sm:text-sm font-semibold leading-snug"
                style={{
                  fontFamily: 'var(--font-inter)',
                  color: 'var(--color-forest-ink)',
                }}
              >
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Notes & Callout */}
      {footerNotes.length > 0 && (
        <div
          className="p-3 rounded-[8px] border border-[var(--color-forest-ink)] flex items-start gap-2.5"
          style={{ backgroundColor: 'rgba(255, 233, 92, 0.28)' }}
        >
          <StickerIcon name="fluent-emoji-flat:light-bulb" size={18} />
          <div className="font-hand text-[23px] leading-tight select-none -rotate-1 text-[var(--color-forest-ink)]">
            {footerNotes.join(' ')}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 2. Visual Streaks Playbook
 * Tactile grid of rules for session attendance, protection, and profile showcase.
 */
function VisualStreaksPlaybook({ content }: { content: string }) {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const closingQuote =
    lines.find(
      (l) =>
        !l.startsWith('•') &&
        !l.toLowerCase().includes('your streak counts') &&
        !l.toLowerCase().includes('consecutive') &&
        l.length > 15
    ) || 'Keep the fire going — consistency is what separates Pros from Potatoes!';

  const rules = [
    {
      badge: '+1 Streak',
      badgeBg: '#d5f5c2',
      badgeText: '#1a3300',
      title: 'Session Attendance',
      desc: 'Each beta session you attend adds +1 to your active streak.',
    },
    {
      badge: 'Reset to 0',
      badgeBg: '#cb5521',
      badgeText: '#fcfaf5',
      title: 'Missed Sessions',
      desc: 'Missing a session without approved notice resets your streak back to 0.',
    },
    {
      badge: 'Protected',
      badgeBg: '#a8e5e5',
      badgeText: '#1a3300',
      title: 'Valid Excuses',
      desc: 'Coordinator-approved notices protect your streak from being lost.',
    },
    {
      badge: 'Profile Card',
      badgeBg: '#ffe95c',
      badgeText: '#1a3300',
      title: 'Best-Ever Record',
      desc: 'Your highest streak milestone is tracked and celebrated on your Profile.',
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p
        className="text-xs sm:text-sm leading-relaxed"
        style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
      >
        Your streak counts how many consecutive beta sessions you have actively attended.
      </p>

      {/* 2x2 Tactical Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {rules.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-[8px] border border-[var(--color-forest-ink)] flex flex-col justify-between card-spring gap-2"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-[4px] border border-[var(--color-forest-ink)]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: item.badgeBg,
                  color: item.badgeText,
                }}
              >
                {item.badge}
              </span>
              <span className="text-[11px] font-bold text-[var(--color-forest-ink)]">
                {item.title}
              </span>
            </div>
            <p className="text-xs text-[var(--color-forest-ink)]/85 leading-snug font-medium">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Quote Banner */}
      <div
        className="p-3 rounded-[8px] border border-dashed border-[var(--color-forest-ink)] flex items-center gap-2.5"
        style={{ backgroundColor: 'rgba(213, 245, 194, 0.4)' }}
      >
        <StickerIcon name="fluent-emoji-flat:fire" size={20} />
        <span
          className="font-hand text-[24px] leading-none select-none -rotate-1 text-[var(--color-forest-ink)]"
        >
          {closingQuote}
        </span>
      </div>
    </div>
  );
}

/**
 * 3. Visual Tiers Mini-Ladder
 * Displays the 5 tiers (Potato → Rookie → Pro → Legend → Mythic) as compact horizontal badge pills
 * with their fluent-emoji-flat icons and Roboto Mono point thresholds (0+, 50+, 150+, 300+, 500+).
 */
function VisualTiersPlaybook({ content }: { content: string }) {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const footerNote =
    lines.find((l) => l.toLowerCase().includes('progress bar') || l.toLowerCase().includes('profile')) ||
    'Your tier updates automatically as you earn points. Check the progress bar on your Profile to see how close you are to the next level!';

  return (
    <div className="flex flex-col gap-3.5">
      <p
        className="text-xs sm:text-sm leading-relaxed"
        style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
      >
        Your tier updates automatically as you earn points throughout the season.
      </p>

      {/* Visual Tiers Mini-Ladder — Compact horizontal badge pills */}
      <div className="p-3 rounded-[8px] border border-[var(--color-forest-ink)] bg-white/50 flex flex-col gap-2">
        <span
          className="text-[10px] font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]/70"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Progression Mini-Ladder
        </span>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none sm:flex-wrap">
          {TIERS_DATA.map((tier, idx) => (
            <div key={tier.name} className="flex items-center gap-1.5 shrink-0">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[var(--color-forest-ink)] card-spring shadow-xs"
                style={{ backgroundColor: tier.bg }}
              >
                <StickerIcon name={tier.icon} size={18} />
                <span
                  className="text-xs font-bold text-[var(--color-forest-ink)]"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {tier.name}
                </span>
                <span
                  className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded border border-[var(--color-forest-ink)]/20"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: 'rgba(26, 51, 0, 0.08)',
                    color: 'var(--color-forest-ink)',
                  }}
                >
                  {tier.threshold}
                </span>
              </div>

              {idx < TIERS_DATA.length - 1 && (
                <span className="text-xs font-bold text-[var(--color-pencil-gray)] select-none">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Tiers Stack */}
      <div className="flex flex-col gap-2">
        {TIERS_DATA.map((tier) => (
          <div
            key={tier.name}
            className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-[var(--color-forest-ink)] card-spring"
            style={{ backgroundColor: tier.bg }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <StickerIcon name={tier.icon} size={22} />
              <div className="flex flex-col">
                <span
                  className="text-xs sm:text-sm font-bold text-[var(--color-forest-ink)] leading-tight"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {tier.name}
                </span>
                <span
                  className="text-[11px] text-[var(--color-forest-ink)]/75 leading-tight font-medium"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {tier.desc}
                </span>
              </div>
            </div>

            <span
              className="shrink-0 text-xs font-bold font-mono px-2 py-1 rounded-[4px] border border-[var(--color-forest-ink)] bg-white/80 text-[var(--color-forest-ink)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {tier.range}
            </span>
          </div>
        ))}
      </div>

      {/* Helper Note */}
      <div
        className="p-2.5 rounded-[8px] border border-[var(--color-forest-ink)] flex items-center gap-2"
        style={{ backgroundColor: 'var(--color-cream-paper)' }}
      >
        <StickerIcon name="fluent-emoji-flat:chart-increasing" size={16} />
        <span className="font-hand text-[23px] leading-tight select-none -rotate-1 text-[var(--color-forest-ink)]">
          {footerNote}
        </span>
      </div>
    </div>
  );
}

/**
 * 4. Visual Feedback Playbook
 * 2 Stars & 1 Wish Visual Split Diagram:
 * Two Mint/Yellow Star callout boxes (Strength 1, Strength 2) + one Teal Wish callout box (1 Actionable Tip).
 */
function VisualFeedbackPlaybook({ content }: { content: string }) {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const rewardLine =
    lines.find((l) => l.toLowerCase().includes('give genuine') || l.toLowerCase().includes('+15 pts')) ||
    'Give genuine, constructive feedback — it helps everyone grow. You earn +15 PTS for each review you give.';

  return (
    <div className="flex flex-col gap-3.5">
      <p
        className="text-xs sm:text-sm leading-relaxed"
        style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
      >
        Every two weeks, you'll be paired with a Feedback Partner from the other track (Design ↔ Content) for peer reviews.
      </p>

      {/* Framework Diagram Header */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]/80"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Framework: 2 Stars & 1 Wish
        </span>
        <SketchCallout
          text="two strengths + one actionable tip"
          arrow="down-right"
          color="#cb5521"
          rotate="-rotate-1"
          fontSize={21}
        />
      </div>

      {/* 2 Stars & 1 Wish Visual Split */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Star 1 Box (Mint) */}
        <div
          className="p-3.5 rounded-[8px] border border-[var(--color-forest-ink)] flex flex-col justify-between card-spring gap-2"
          style={{ backgroundColor: 'var(--color-sticky-note-mint)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-bold font-mono px-1.5 py-0.5 uppercase tracking-wider rounded border border-[var(--color-forest-ink)] bg-white/75"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)' }}
              >
                Star 01
              </span>
              <StickerIcon name="fluent-emoji-flat:star" size={20} />
            </div>
            <h4
              className="text-xs sm:text-sm font-bold text-[var(--color-forest-ink)] mb-1"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Strength 1
            </h4>
            <p className="text-xs text-[var(--color-forest-ink)]/85 leading-relaxed font-medium">
              Something specific they executed really well in their design or copy.
            </p>
          </div>
        </div>

        {/* Star 2 Box (Highlighter Yellow) */}
        <div
          className="p-3.5 rounded-[8px] border border-[var(--color-forest-ink)] flex flex-col justify-between card-spring gap-2"
          style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-bold font-mono px-1.5 py-0.5 uppercase tracking-wider rounded border border-[var(--color-forest-ink)] bg-white/75"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)' }}
              >
                Star 02
              </span>
              <StickerIcon name="fluent-emoji-flat:star" size={20} />
            </div>
            <h4
              className="text-xs sm:text-sm font-bold text-[var(--color-forest-ink)] mb-1"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Strength 2
            </h4>
            <p className="text-xs text-[var(--color-forest-ink)]/85 leading-relaxed font-medium">
              Another creative decision, technique, or strength you noticed.
            </p>
          </div>
        </div>

        {/* Wish Box (Sticky Note Teal) */}
        <div
          className="p-3.5 rounded-[8px] border border-[var(--color-forest-ink)] flex flex-col justify-between card-spring gap-2"
          style={{ backgroundColor: 'var(--color-sticky-note-teal)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-bold font-mono px-1.5 py-0.5 uppercase tracking-wider rounded border border-[var(--color-forest-ink)] bg-white/75"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)' }}
              >
                Wish 01
              </span>
              <StickerIcon name="fluent-emoji-flat:glowing-star" size={20} />
            </div>
            <h4
              className="text-xs sm:text-sm font-bold text-[var(--color-forest-ink)] mb-1"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              1 Actionable Tip
            </h4>
            <p className="text-xs text-[var(--color-forest-ink)]/85 leading-relaxed font-medium">
              One clear, actionable suggestion they can apply to their next deliverable.
            </p>
          </div>
        </div>
      </div>

      {/* Bonus reward note */}
      <div
        className="p-3 rounded-[8px] border border-[var(--color-forest-ink)] flex items-center gap-2.5"
        style={{ backgroundColor: 'var(--color-cream-paper)' }}
      >
        <StickerIcon name="fluent-emoji-flat:handshake" size={18} />
        <span className="font-hand text-[23px] leading-tight select-none -rotate-1 text-[var(--color-forest-ink)]">
          {rewardLine}
        </span>
      </div>
    </div>
  );
}

/**
 * 5. Visual Rules & Etiquette Playbook
 * Clean numbered playbook items with bold titles and studio standards.
 */
function VisualRulesPlaybook({ content }: { content: string }) {
  // Parse lines: e.g. "1. Respect deadlines — submit tasks..."
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

  const parsedRules = lines.map((line, index) => {
    const match = line.match(/^(\d+)[\.\)]\s*(.+?)\s*(?:[—–\-:]\s*)(.+)$/);
    if (match) {
      return {
        number: String(index + 1).padStart(2, '0'),
        title: match[2].trim(),
        desc: match[3].trim(),
      };
    }
    return {
      number: String(index + 1).padStart(2, '0'),
      title: line.replace(/^\d+[\.\)]\s*/, ''),
      desc: '',
    };
  });

  return (
    <div className="flex flex-col gap-2.5">
      {parsedRules.map((rule) => (
        <div
          key={rule.number}
          className="flex items-start gap-3 p-3 rounded-[8px] border border-[var(--color-forest-ink)] card-spring"
          style={{ backgroundColor: 'var(--color-cream-paper)' }}
        >
          <span
            className="shrink-0 w-6 h-6 flex items-center justify-center text-[11px] font-bold font-mono rounded-[4px] border border-[var(--color-forest-ink)]"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--color-highlighter-yellow)',
              color: 'var(--color-forest-ink)',
            }}
          >
            {rule.number}
          </span>

          <div className="flex-1 min-w-0">
            <h4
              className="text-xs sm:text-sm font-bold text-[var(--color-forest-ink)] leading-snug"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {rule.title}
            </h4>
            {rule.desc && (
              <p
                className="text-xs text-[var(--color-forest-ink)]/80 mt-0.5 leading-relaxed font-medium"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {rule.desc}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Handwritten sketchbook closing note */}
      <div className="flex justify-center pt-1.5 select-none">
        <SketchCallout
          text="lead by example — team members lift each other up!"
          arrow="none"
          color="var(--color-forest-ink)"
          rotate="-rotate-1"
          fontSize={24}
        />
      </div>
    </div>
  );
}
