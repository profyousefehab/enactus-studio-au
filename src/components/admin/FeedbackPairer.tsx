import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import SketchCallout from '../ui/SketchCallout';

interface Member {
  id: string;
  name: string;
  avatarId: string;
  customAvatarUrl?: string | null;
  track: 'Design' | 'Content';
  role: string;
  feedbackPartnerId: string | null;
}

export default function FeedbackPairer() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairing, setPairing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [memberA, setMemberA] = useState('');
  const [memberB, setMemberB] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Member))
        // Exclude admin coordinator
        .filter((m) => m.role !== 'admin' && m.name?.trim().toLowerCase() !== 'yousef ehab')
        .sort((a, b) => a.name.localeCompare(b.name));
      setMembers(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Derive current pairs
  const pairs: Array<[Member, Member]> = [];
  const paired = new Set<string>();
  for (const m of members) {
    if (m.feedbackPartnerId && !paired.has(m.id)) {
      const partner = members.find((p) => p.id === m.feedbackPartnerId);
      if (partner) {
        pairs.push([m, partner]);
        paired.add(m.id);
        paired.add(partner.id);
      }
    }
  }
  const unpaired = members.filter((m) => !paired.has(m.id));

  async function handleManualPair() {
    if (!memberA || !memberB || memberA === memberB) {
      alert('Select two different members.');
      return;
    }
    setPairing(true);
    try {
      await updateDoc(doc(db, 'users', memberA), { feedbackPartnerId: memberB });
      await updateDoc(doc(db, 'users', memberB), { feedbackPartnerId: memberA });
      setMemberA('');
      setMemberB('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Pairing error:', err);
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPairing(false);
    }
  }

  async function handleClearAllPairs() {
    if (!confirm('Are you sure you want to clear all feedback pairings?')) return;
    setPairing(true);
    try {
      for (const m of members) {
        if (m.feedbackPartnerId) {
          await updateDoc(doc(db, 'users', m.id), { feedbackPartnerId: null });
        }
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Clear pairs error:', err);
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPairing(false);
    }
  }

  async function handleAutoPair() {
    if (members.length < 2) { alert('Need at least 2 members.'); return; }
    setPairing(true);
    try {
      const design = members.filter((m) => m.track === 'Design');
      const content = members.filter((m) => m.track === 'Content');

      const shuffle = <T,>(arr: T[]) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };
      shuffle(design);
      shuffle(content);

      const newPairs: Array<[string, string]> = [];
      const remaining: Member[] = [];
      const minLen = Math.min(design.length, content.length);

      for (let i = 0; i < minLen; i++) {
        newPairs.push([design[i].id, content[i].id]);
      }

      if (design.length > content.length) remaining.push(...design.slice(minLen));
      else remaining.push(...content.slice(minLen));

      for (let i = 0; i < remaining.length - 1; i += 2) {
        newPairs.push([remaining[i].id, remaining[i + 1].id]);
      }

      const oddOne = remaining.length % 2 === 1 ? remaining[remaining.length - 1] : null;

      // Clear existing
      for (const m of members) {
        if (m.feedbackPartnerId) {
          await updateDoc(doc(db, 'users', m.id), { feedbackPartnerId: null });
        }
      }

      // Write pairs
      for (const [a, b] of newPairs) {
        await updateDoc(doc(db, 'users', a), { feedbackPartnerId: b });
        await updateDoc(doc(db, 'users', b), { feedbackPartnerId: a });
      }

      if (oddOne && newPairs.length > 0) {
        await updateDoc(doc(db, 'users', oddOne.id), { feedbackPartnerId: newPairs[newPairs.length - 1][0] });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Auto-pair error:', err);
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPairing(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-xs font-mono animate-pulse text-[var(--color-pencil-gray)]">
          Loading committee members...
        </p>
      </div>
    );
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
              Feedback Partner Pairing
            </h2>
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--color-forest-ink)]"
              style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
            >
              PEER REVIEW
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-pencil-gray)]" style={{ fontFamily: 'var(--font-inter)' }}>
            Pair Design and Content members together for bi-weekly peer reviews ("2 Stars & 1 Wish").
          </p>
        </div>

        <SketchCallout
          text="cross-track pairings ⤵"
          arrow="down-right"
          color="#cb5521"
          rotate="-rotate-2"
          fontSize={18}
        />
      </div>

      {/* ───── Shared 2-Column Section Template (Desktop lg+) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (~2/3): Member Lists (Active Pairs + Unpaired) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          {/* Active Pairs List */}
          <div
            className="p-4 sm:p-5 rounded-2xl border border-[var(--color-forest-ink)] shadow-xs"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-pencil-gray)]/30">
              <div className="flex items-center gap-2">
                <Icon icon="doodle:users" width={18} height={18} className="text-[var(--color-forest-ink)]" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                  Active Pairs ({pairs.length})
                </span>
              </div>
              <span className="text-xs font-mono text-[var(--color-pencil-gray)]">
                Design ⇄ Content
              </span>
            </div>

            {pairs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {pairs.map(([a, b]) => (
                  <div
                    key={`${a.id}-${b.id}`}
                    className="flex items-center justify-between gap-2 p-2.5 card-spring"
                    style={{
                      backgroundColor: 'var(--color-sticky-note-teal)',
                      border: '1.5px solid var(--color-forest-ink)',
                      borderRadius: 'var(--radius-cards)',
                    }}
                  >
                    {/* Member A */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <StudioAvatar avatarId={a.avatarId} customAvatarUrl={a.customAvatarUrl} size={28} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-[var(--color-forest-ink)]" style={{ fontFamily: 'var(--font-inter)' }}>
                          {a.name}
                        </p>
                        <TrackBadge track={a.track} size="sm" />
                      </div>
                    </div>

                    <div className="px-1 text-xs font-bold text-[var(--color-forest-ink)] opacity-60">
                      ⇄
                    </div>

                    {/* Member B */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-[var(--color-forest-ink)]" style={{ fontFamily: 'var(--font-inter)' }}>
                          {b.name}
                        </p>
                        <TrackBadge track={b.track} size="sm" />
                      </div>
                      <StudioAvatar avatarId={b.avatarId} customAvatarUrl={b.customAvatarUrl} size={28} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-[var(--color-pencil-gray)] rounded-xl bg-white/50">
                <p className="text-xs font-inter text-[var(--color-pencil-gray)]">
                  No active pairings. Click "Auto-pair all" on the right or manually select two members.
                </p>
              </div>
            )}
          </div>

          {/* Unpaired Members List */}
          <div
            className="p-4 sm:p-5 rounded-2xl border border-[var(--color-forest-ink)] shadow-xs"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-pencil-gray)]/30">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                Unpaired Members ({unpaired.length})
              </span>
              {unpaired.length === 0 ? (
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  ✓ All Paired
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-[var(--color-terracotta)]">
                  Requires partner
                </span>
              )}
            </div>

            {unpaired.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                {unpaired.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-[var(--color-pencil-gray)] bg-white"
                  >
                    <StudioAvatar avatarId={m.avatarId} customAvatarUrl={m.customAvatarUrl} size={24} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate text-[var(--color-forest-ink)]" style={{ fontFamily: 'var(--font-inter)' }}>
                        {m.name}
                      </p>
                      <TrackBadge track={m.track} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-inter text-[var(--color-pencil-gray)]">
                Every active committee member currently has an assigned feedback partner.
              </p>
            )}
          </div>
        </div>

        {/* Right Column (~1/3): Sticky Pairing Controls Rail */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20 z-10 flex flex-col gap-4">
          <div
            className="p-4 sm:p-5 rounded-2xl border-2 border-[var(--color-forest-ink)] shadow-sm flex flex-col gap-4"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="pb-2 border-b border-[var(--color-pencil-gray)]/30">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                Pairing Controls
              </span>
              <p className="text-[11px] text-[var(--color-pencil-gray)] font-inter mt-0.5">
                Automatically match Design & Content members.
              </p>
            </div>

            {success && (
              <div className="text-xs font-mono font-bold px-3 py-2 rounded-lg border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)] animate-fadeIn">
                ✓ Pairings updated successfully.
              </div>
            )}

            {/* Exactly ONE dark-green primary CTA */}
            <button
              type="button"
              onClick={handleAutoPair}
              disabled={pairing || members.length < 2}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-[var(--color-forest-ink)] cursor-pointer btn-spring transition-opacity disabled:opacity-40 text-center"
              style={{
                fontFamily: 'var(--font-inter)',
                backgroundColor: 'var(--color-forest-ink)',
                color: 'var(--color-cream-paper)',
              }}
            >
              {pairing ? 'Pairing...' : 'Auto-pair all (cross-track) →'}
            </button>

            {/* Quieter Secondary/Destructive Action */}
            {pairs.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllPairs}
                disabled={pairing}
                className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-[var(--color-terracotta)] hover:bg-[#ffebe6] cursor-pointer btn-spring transition-colors"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Clear all pairings
              </button>
            )}

            {/* Manual Pair Bar */}
            <div className="pt-3 border-t border-[var(--color-pencil-gray)]/30 flex flex-col gap-2.5">
              <span className="text-xs font-bold font-inter text-[var(--color-forest-ink)]">
                Manual Pair or Re-pair
              </span>

              <div>
                <label className="text-[11px] font-medium mb-1 block text-[var(--color-forest-ink)] font-inter">
                  First Member
                </label>
                <select
                  value={memberA}
                  onChange={(e) => setMemberA(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white text-[var(--color-forest-ink)]"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  <option value="">Select member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.track})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium mb-1 block text-[var(--color-forest-ink)] font-inter">
                  Second Member
                </label>
                <select
                  value={memberB}
                  onChange={(e) => setMemberB(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white text-[var(--color-forest-ink)]"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  <option value="">Select member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.track})</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleManualPair}
                disabled={pairing || !memberA || !memberB}
                className="w-full py-2 text-xs font-semibold rounded-lg border border-[var(--color-forest-ink)] bg-[var(--color-cream-paper)] hover:bg-gray-100 text-[var(--color-forest-ink)] cursor-pointer btn-spring disabled:opacity-40"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Pair Selected Members
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
