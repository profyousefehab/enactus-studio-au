import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';

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
        <p className="text-sm animate-pulse" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}>
          Loading committee members...
        </p>
      </div>
    );
  }

  return (
    <div
      className="p-4 sm:p-5"
      style={{
        backgroundColor: 'var(--color-cream-paper)',
        border: '1px solid var(--color-forest-ink)',
        borderRadius: 'var(--radius-cards)',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--color-pencil-gray)]">
        <div>
          <h4
            className="text-base font-bold flex items-center gap-2"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
          >
            <Icon icon="doodle:users" width={18} height={18} className="shrink-0" />
            Feedback Partner Pairing
          </h4>
          <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}>
            Pair Design and Content members together for bi-weekly peer reviews ("2 Stars & 1 Wish").
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoPair}
            disabled={pairing || members.length < 2}
            className="px-3 py-1.5 text-xs font-semibold cursor-pointer btn-spring"
            style={{
              fontFamily: 'var(--font-inter)',
              backgroundColor: 'var(--color-sticky-note-teal)',
              color: 'var(--color-forest-ink)',
              border: '1.5px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-buttons)',
              opacity: pairing || members.length < 2 ? 0.4 : 1,
            }}
          >
            {pairing ? 'Pairing...' : 'Auto-pair all (cross-track)'}
          </button>
          {pairs.length > 0 && (
            <button
              onClick={handleClearAllPairs}
              disabled={pairing}
              className="px-3 py-1.5 text-xs font-semibold cursor-pointer btn-spring"
              style={{
                fontFamily: 'var(--font-inter)',
                backgroundColor: 'transparent',
                color: 'var(--color-terracotta)',
                border: '1px solid var(--color-terracotta)',
                borderRadius: 'var(--radius-buttons)',
              }}
            >
              Clear pairs
            </button>
          )}
        </div>
      </div>

      {success && (
        <div
          className="text-xs font-medium px-3 py-2 mb-4"
          style={{
            fontFamily: 'var(--font-mono)',
            backgroundColor: 'var(--color-sticky-note-mint)',
            border: '1px solid var(--color-forest-ink)',
            borderRadius: 'var(--radius-buttons)',
            color: 'var(--color-forest-ink)',
          }}
        >
          Pairings updated successfully.
        </div>
      )}

      {/* Current pairs responsive grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-forest-ink)' }}>
            Active Pairs ({pairs.length})
          </span>
          {unpaired.length > 0 && (
            <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-terracotta)' }}>
              {unpaired.length} unpaired member{unpaired.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {pairs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
                    <p className="text-xs font-semibold truncate" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
                      {a.name}
                    </p>
                    <TrackBadge track={a.track} size="sm" />
                  </div>
                </div>

                <div className="px-1 text-[11px] font-bold" style={{ color: 'var(--color-forest-ink)', opacity: 0.5 }}>
                  ⇄
                </div>

                {/* Member B */}
                <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
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
          <div
            className="p-4 text-center border border-dashed border-[var(--color-pencil-gray)] rounded-xl"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}
          >
            <p className="text-xs">No active pairings. Click "Auto-pair all" or select two members below.</p>
          </div>
        )}
      </div>

      {/* Manual pairing bar */}
      <div className="p-3.5 rounded-xl border border-[var(--color-pencil-gray)] bg-[var(--color-cream-paper)]">
        <p className="text-xs font-semibold mb-2" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
          Manual Pair or Re-pair
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
          <div className="sm:col-span-5">
            <label className="text-[11px] font-medium mb-1 block" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
              First Member
            </label>
            <select
              value={memberA}
              onChange={(e) => setMemberA(e.target.value)}
              className="w-full text-xs px-2.5 py-2 focus:outline-none cursor-pointer"
              style={{
                fontFamily: 'var(--font-inter)',
                color: 'var(--color-forest-ink)',
                backgroundColor: 'var(--color-cream-paper)',
                border: '1px solid var(--color-pencil-gray)',
                borderRadius: 'var(--radius-buttons)',
              }}
            >
              <option value="">Select member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.track})</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5">
            <label className="text-[11px] font-medium mb-1 block" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
              Second Member
            </label>
            <select
              value={memberB}
              onChange={(e) => setMemberB(e.target.value)}
              className="w-full text-xs px-2.5 py-2 focus:outline-none cursor-pointer"
              style={{
                fontFamily: 'var(--font-inter)',
                color: 'var(--color-forest-ink)',
                backgroundColor: 'var(--color-cream-paper)',
                border: '1px solid var(--color-pencil-gray)',
                borderRadius: 'var(--radius-buttons)',
              }}
            >
              <option value="">Select member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.track})</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={handleManualPair}
              disabled={pairing || !memberA || !memberB}
              className="w-full text-xs font-semibold py-2 cursor-pointer btn-spring"
              style={{
                fontFamily: 'var(--font-inter)',
                backgroundColor: 'var(--color-forest-ink)',
                color: 'var(--color-cream-paper)',
                border: 'none',
                borderRadius: 'var(--radius-buttons)',
                opacity: pairing || !memberA || !memberB ? 0.4 : 1,
              }}
            >
              Pair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
