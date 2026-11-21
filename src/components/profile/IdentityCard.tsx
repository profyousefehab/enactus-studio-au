import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import { useSession } from '../../context/SessionContext';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import AvatarPickerModal from './AvatarPickerModal';

/**
 * Row 1 — Identity Card (Full Width, Clean & Airy)
 * 72px Avatar with subtle camera badge, 22px Name, Track Pill, and yellow Member ID pill
 * Using Bricolage Grotesque with decreased letter spacing.
 */
export default function IdentityCard() {
  const { user, setUser } = useSession();
  const [modalOpen, setModalOpen] = useState(false);

  if (!user) return null;

  async function handleSaveAvatar(newAvatarId: string, newCustomUrl: string | null) {
    if (!user) return;
    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, {
      avatarId: newAvatarId,
      customAvatarUrl: newCustomUrl,
    });
    setUser({
      ...user,
      avatarId: newAvatarId,
      customAvatarUrl: newCustomUrl,
    });
  }

  return (
    <>
      <div
        className="p-5 flex items-center gap-4 card-spring rounded-2xl border border-[var(--color-forest-ink)] shadow-xs profile-bricolage"
        style={{
          backgroundColor: 'var(--color-cream-paper)',
          fontFamily: 'var(--font-bricolage)',
          letterSpacing: '-0.03em',
        }}
      >
        {/* Tappable Avatar (72px) with subtle camera badge */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="relative group cursor-pointer rounded-full shrink-0 btn-spring"
          title="Tap to change avatar photo"
          aria-label="Change avatar photo"
        >
          <StudioAvatar
            avatarId={user.avatarId}
            customAvatarUrl={user.customAvatarUrl}
            size={72}
          />
          <div
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-110"
            style={{
              backgroundColor: 'var(--color-highlighter-yellow)',
              border: '1.5px solid var(--color-forest-ink)',
            }}
          >
            <Icon icon="doodle:camera" width={13} height={13} style={{ color: 'var(--color-forest-ink)' }} />
          </div>
        </button>

        {/* Member Info: Name (22px) and balanced horizontal badges row */}
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <h2
            className="text-[22px] font-bold truncate leading-tight tracking-[-0.03em] mb-2 text-[var(--color-forest-ink)]"
            style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}
          >
            {user.name}
          </h2>

          <div className="flex items-center gap-2 flex-wrap">
            <TrackBadge track={user.track} size="sm" />

            {user.role === 'admin' && (
              <span
                className="text-xs font-semibold px-2 py-0.5 tracking-[-0.03em]"
                style={{
                  fontFamily: 'var(--font-bricolage)',
                  letterSpacing: '-0.03em',
                  color: 'var(--color-cream-paper)',
                  backgroundColor: 'var(--color-forest-ink)',
                  borderRadius: 'var(--radius-buttons)',
                }}
              >
                Coordinator
              </span>
            )}

            {/* Member ID Pill */}
            <span
              className="text-xs font-bold px-2 py-0.5 rounded border border-[var(--color-forest-ink)] tracking-[-0.03em]"
              style={{
                fontFamily: 'var(--font-bricolage)',
                letterSpacing: '-0.03em',
                color: 'var(--color-forest-ink)',
                backgroundColor: 'var(--color-highlighter-yellow)',
              }}
            >
              #{user.pinCode}
            </span>
          </div>
        </div>
      </div>

      <AvatarPickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        currentAvatarId={user.avatarId}
        currentCustomAvatarUrl={user.customAvatarUrl}
        onSave={handleSaveAvatar}
      />
    </>
  );
}
