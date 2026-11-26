import { useSession } from '../../context/SessionContext';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';

interface Partner {
  name: string;
  avatarId: string;
  customAvatarUrl?: string | null;
  track: 'Design' | 'Content';
}

/**
 * Row 3 Right — Tall Teal Card (Feedback Partner)
 * Tactile SayBriefly sketchbook aesthetic with translucent Washi Tape accent.
 */
export default function FeedbackPartnerCard() {
  const { user } = useSession();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.feedbackPartnerId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'users', user.feedbackPartnerId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPartner({
            name: data.name,
            avatarId: data.avatarId,
            customAvatarUrl: data.customAvatarUrl ?? null,
            track: data.track,
          });
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Feedback partner listener error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.feedbackPartnerId]);

  if (!user) return null;

  return (
    <div
      className="p-5 min-h-[140px] flex flex-col justify-between card-spring rounded-xl border border-[var(--color-forest-ink)] relative"
      style={{
        backgroundColor: 'var(--color-sticky-note-teal)',
        fontFamily: 'var(--font-inter)',
      }}
    >
      {/* Subtle Sketchbook Accent: Translucent Yellow Washi Tape Strip */}
      <div
        className="absolute -top-1.5 right-4 w-10 h-3 pointer-events-none -rotate-6 z-10"
        style={{
          backgroundColor: 'rgba(255, 233, 92, 0.85)',
          border: '1px dashed rgba(26, 51, 0, 0.25)',
        }}
        aria-hidden="true"
      />

      {/* Small Eyebrow */}
      <span
        className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-forest-ink)]/75"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        FEEDBACK PARTNER
      </span>

      {loading ? (
        <div className="h-10 my-auto animate-pulse bg-black/10 rounded-lg" />
      ) : partner ? (
        <div className="flex items-center gap-3 my-auto">
          <StudioAvatar
            avatarId={partner.avatarId}
            customAvatarUrl={partner.customAvatarUrl}
            alt={partner.name}
            size={44}
          />
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-bold truncate leading-tight text-[var(--color-forest-ink)]"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {partner.name}
            </p>
            <div className="mt-1">
              <TrackBadge track={partner.track} size="sm" />
            </div>
          </div>
        </div>
      ) : (
        <div className="my-auto">
          <p
            className="text-xs font-medium italic text-[var(--color-forest-ink)]/80"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Pairing coming soon!
          </p>
        </div>
      )}
    </div>
  );
}
