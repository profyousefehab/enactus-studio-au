import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../lib/firebase';
import { useSession } from '../context/SessionContext';
import BricolageHeadline from '../components/ui/BricolageHeadline';
import StudioAvatar from '../components/ui/StudioAvatar';
import TrackBadge from '../components/ui/TrackBadge';
import StickerIcon from '../components/ui/StickerIcon';
import IdentityCard from '../components/profile/IdentityCard';
import AvatarPickerModal from '../components/profile/AvatarPickerModal';
import StreakCard from '../components/profile/StreakCard';
import TierCard from '../components/profile/TierCard';
import RankingsCard from '../components/profile/RankingsCard';
import FeedbackPartnerCard from '../components/profile/FeedbackPartnerCard';
import TiersRoadmapModal from '../components/profile/TiersRoadmapModal';
import StreakGuideModal from '../components/profile/StreakGuideModal';
import PointsHistoryModal from '../components/profile/PointsHistoryModal';

/**
 * Coordinator Profile View (Admin only)
 * Pure Bricolage Grotesque typography with decreased letter spacing.
 */
function CoordinatorProfileView({ user }: { user: ReturnType<typeof useSession>['user'] }) {
  const navigate = useNavigate();
  const { setUser } = useSession();
  const [memberStats, setMemberStats] = useState({ total: 0, design: 0, content: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const members = snap.docs
        .map((d) => d.data())
        .filter((u: any) => u.role !== 'admin' && u.name?.trim().toLowerCase() !== 'yousef ehab');

      setMemberStats({
        total: members.length,
        design: members.filter((m: any) => m.track === 'Design').length,
        content: members.filter((m: any) => m.track === 'Content').length,
      });
      setLoading(false);
    });
    return unsub;
  }, []);

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
    <div
      className="flex flex-col gap-3 profile-bricolage"
      style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}
    >
      {/* Coordinator Identity Card */}
      <div
        className="p-4 flex items-center gap-4 card-spring"
        style={{
          backgroundColor: 'var(--color-cream-paper)',
          border: '1px solid var(--color-forest-ink)',
          borderRadius: 'var(--radius-cards)',
        }}
      >
        {/* Tappable Avatar with camera icon */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="relative group cursor-pointer rounded-full shrink-0 btn-spring"
          title="Tap to change avatar photo"
          aria-label="Change coordinator photo"
        >
          <StudioAvatar
            avatarId={user.avatarId}
            customAvatarUrl={user.customAvatarUrl}
            size={68}
          />
          <div
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: 'var(--color-highlighter-yellow)',
              border: '1.5px solid var(--color-forest-ink)',
            }}
          >
            <Icon icon="doodle:camera" width={13} height={13} style={{ color: 'var(--color-forest-ink)' }} />
          </div>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 tracking-[-0.03em] uppercase"
                style={{
                  fontFamily: 'var(--font-bricolage)',
                  color: 'var(--color-cream-paper)',
                  backgroundColor: 'var(--color-forest-ink)',
                  borderRadius: 'var(--radius-buttons)',
                }}
              >
                Coordinator
              </span>
              <TrackBadge track={user.track} size="sm" />
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="text-[11px] font-bold underline cursor-pointer tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-pencil-gray)' }}
            >
              Edit photo
            </button>
          </div>

          <h2
            className="text-xl font-extrabold truncate leading-tight tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-forest-ink)' }}
          >
            {user.name}
          </h2>

          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="text-xs font-bold px-2 py-0.5 tracking-[-0.03em]"
              style={{
                fontFamily: 'var(--font-bricolage)',
                color: 'var(--color-forest-ink)',
                backgroundColor: 'var(--color-highlighter-yellow)',
                borderRadius: 'var(--radius-buttons)',
              }}
            >
              Member ID #{user.pinCode}
            </span>
            <span
              className="text-xs font-semibold tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-pencil-gray)' }}
            >
              Track Lead
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

      {/* Studio Oversight Card */}
      <div
        className="p-4 sm:p-5 card-spring flex flex-col gap-4"
        style={{
          backgroundColor: 'var(--color-cream-paper)',
          border: '1.5px solid var(--color-forest-ink)',
          borderRadius: 'var(--radius-cards)',
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-pencil-gray)]">
          <div>
            <span
              className="text-[11px] font-bold uppercase tracking-[-0.03em] block"
              style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-forest-ink)' }}
            >
              Team Oversight
            </span>
            <h3
              className="text-base font-extrabold mt-0.5 tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-forest-ink)' }}
            >
              Committee Track Roster
            </h3>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'var(--color-sticky-note-mint)',
              border: '1px solid var(--color-forest-ink)',
            }}
          >
            <Icon icon="doodle:users" width={20} height={20} style={{ color: 'var(--color-forest-ink)' }} />
          </div>
        </div>

        {/* Live Active Members Summary */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div
            className="p-3"
            style={{
              backgroundColor: 'var(--color-cream-paper)',
              border: '1px solid var(--color-pencil-gray)',
              borderRadius: 'var(--radius-cards)',
            }}
          >
            <p
              className="text-2xl font-extrabold leading-tight tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-forest-ink)' }}
            >
              {loading ? '...' : memberStats.total}
            </p>
            <p
              className="text-xs font-bold mt-0.5 tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-pencil-gray)' }}
            >
              Total Members
            </p>
          </div>

          <div
            className="p-3"
            style={{
              backgroundColor: 'var(--color-sticky-note-mint)',
              border: '1px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-cards)',
            }}
          >
            <p
              className="text-2xl font-extrabold leading-tight tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-forest-ink)' }}
            >
              {loading ? '...' : memberStats.design}
            </p>
            <p
              className="text-xs font-bold mt-0.5 tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-forest-ink)' }}
            >
              Design Track
            </p>
          </div>

          <div
            className="p-3"
            style={{
              backgroundColor: 'var(--color-sticky-note-teal)',
              border: '1px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-cards)',
            }}
          >
            <p
              className="text-2xl font-extrabold leading-tight tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-forest-ink)' }}
            >
              {loading ? '...' : memberStats.content}
            </p>
            <p
              className="text-xs font-bold mt-0.5 tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-forest-ink)' }}
            >
              Content Track
            </p>
          </div>
        </div>

        <p
          className="text-xs font-semibold leading-relaxed tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-pencil-gray)' }}
        >
          Track members are active on the team. Log attendance, publish announcements, assign peer review pairs, and award points from the admin dashboard.
        </p>

        {/* Primary CTA Button */}
        <button
          onClick={() => navigate('/admin')}
          className="w-full py-3.5 px-4 flex items-center justify-center gap-2.5 text-sm font-extrabold cursor-pointer btn-spring tracking-[-0.03em]"
          style={{
            fontFamily: 'var(--font-bricolage)',
            backgroundColor: 'var(--color-forest-ink)',
            color: 'var(--color-cream-paper)',
            borderRadius: 'var(--radius-buttons)',
            border: 'none',
          }}
        >
          <span>Open Coordinator Dashboard</span>
          <span className="text-base font-extrabold">→</span>
        </button>

        {/* Secondary Navigation Links */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => navigate('/guidelines')}
            className="flex-1 py-2 text-xs font-bold cursor-pointer btn-spring text-center tracking-[-0.03em]"
            style={{
              fontFamily: 'var(--font-bricolage)',
              color: 'var(--color-forest-ink)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-pencil-gray)',
              borderRadius: 'var(--radius-buttons)',
            }}
          >
            Edit Guidelines →
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex-1 py-2 text-xs font-bold cursor-pointer btn-spring text-center tracking-[-0.03em]"
            style={{
              fontFamily: 'var(--font-bricolage)',
              color: 'var(--color-forest-ink)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-pencil-gray)',
              borderRadius: 'var(--radius-buttons)',
            }}
          >
            View Leaderboard →
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Member Profile View (Standard members only)
 * Clean, breathable Asymmetric Bento Grid layout (grid-cols-2 gap-3.5).
 * Pure Bricolage Grotesque typography with decreased letter spacing.
 */
function MemberProfileView() {
  const { user } = useSession();
  const [tiersModalOpen, setTiersModalOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [pointsModalOpen, setPointsModalOpen] = useState(false);

  if (!user) return null;

  return (
    <div
      className="flex flex-col gap-3.5 profile-bricolage"
      style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}
    >
      {/* Row 1 — Full Width Identity Card (Clean & Airy) */}
      <IdentityCard />

      {/* Row 2 — Tall Split Bento (grid-cols-2 gap-3.5, min-h-[164px]) */}
      <div className="grid grid-cols-2 gap-3.5">
        <StreakCard onClick={() => setStreakModalOpen(true)} />
        <TierCard onClick={() => setTiersModalOpen(true)} />
      </div>

      {/* Row 3 — Asymmetric Split (grid-cols-2 gap-3.5, min-h-[140px]) */}
      <div className="grid grid-cols-2 gap-3.5">
        <RankingsCard />
        <FeedbackPartnerCard />
      </div>

      {/* Row 4 — Minimal Points History Row */}
      <button
        type="button"
        onClick={() => setPointsModalOpen(true)}
        className="w-full py-3.5 px-5 flex items-center justify-between rounded-xl border border-[var(--color-forest-ink)] cursor-pointer btn-spring shadow-xs group transition-all hover:bg-[var(--color-sticky-note-mint)] profile-bricolage"
        style={{
          backgroundColor: 'var(--color-cream-paper)',
          fontFamily: 'var(--font-bricolage)',
          letterSpacing: '-0.03em',
        }}
        title="View Points History"
      >
        <div className="flex items-center gap-2.5">
          <StickerIcon name="bar-chart" size={18} />
          <span
            className="text-sm font-bold text-[var(--color-forest-ink)] tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            Points History
          </span>
        </div>

        <span className="text-base font-extrabold text-[var(--color-forest-ink)] group-hover:translate-x-1 transition-transform">
          →
        </span>
      </button>

      {/* Interactive Modals */}
      <TiersRoadmapModal
        open={tiersModalOpen}
        onClose={() => setTiersModalOpen(false)}
        points={user.points}
      />

      <StreakGuideModal
        open={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        streak={user.sessionStreak}
        bestStreak={user.bestStreak}
      />

      <PointsHistoryModal
        open={pointsModalOpen}
        onClose={() => setPointsModalOpen(false)}
        points={user.points}
      />
    </div>
  );
}

/**
 * My Profile — Clean separation between Member and Coordinator experiences.
 * Styled exclusively with Bricolage Grotesque and decreased letter spacing.
 */
export default function Profile() {
  const { user } = useSession();
  const isAdmin = user?.role === 'admin';

  return (
    <div
      className="p-4 sm:p-5 max-w-lg mx-auto flex flex-col gap-3.5 profile-bricolage"
      style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}
    >
      <BricolageHeadline
        highlight={isAdmin ? ['Coordinator'] : ['Profile']}
        className="text-3xl mb-0.5 tracking-[-0.03em]"
      >
        {isAdmin ? 'Coordinator Profile' : 'My Profile'}
      </BricolageHeadline>

      {isAdmin ? <CoordinatorProfileView user={user} /> : <MemberProfileView />}
    </div>
  );
}
