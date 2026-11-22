import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import { useSession } from '../../context/SessionContext';
import AdminDropCard, { type AdminDrop } from '../wall/AdminDropCard';
import SketchCallout from '../ui/SketchCallout';

const POST_TYPES = [
  { type: 'announcement' as const, icon: 'doodle:megaphone', label: 'Announcement', bg: 'var(--color-sticky-note-mint)' },
  { type: 'task' as const, icon: 'doodle:bolt', label: 'Task', bg: 'var(--color-sticky-note-mint)' },
  { type: 'resource' as const, icon: 'doodle:link', label: 'Resource', bg: 'var(--color-highlighter-yellow)' },
];

export default function WallDropPublisher() {
  const { user } = useSession();
  const [postType, setPostType] = useState<'announcement' | 'task' | 'resource'>('announcement');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Live stream of published admin wall drops
  const [drops, setDrops] = useState<AdminDrop[]>([]);
  const [loadingDrops, setLoadingDrops] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'wallPosts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const adminPosts = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((p) => p.postType !== 'member_post') as AdminDrop[];
        setDrops(adminPosts);
        setLoadingDrops(false);
      },
      (err) => {
        console.error('Error fetching wall drops:', err);
        setLoadingDrops(false);
      }
    );
    return () => unsub();
  }, []);

  if (!user) return null;

  async function handlePublish() {
    if (!content.trim() || !user) return;
    setPublishing(true);
    try {
      await addDoc(collection(db, 'wallPosts'), {
        authorId: user.id,
        authorName: user.name,
        authorAvatarId: user.avatarId,
        authorTrack: user.track,
        postType,
        title: title.trim() || null,
        content: content.trim(),
        linkUrl: linkUrl.trim() || null,
        isPinned,
        reactions: { '🔥': [], '💡': [], '❤️': [] },
        commentCount: 0,
        createdAt: Timestamp.now(),
      });
      setTitle('');
      setContent('');
      setLinkUrl('');
      setIsPinned(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Publish error:', err);
      alert('Failed to publish: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPublishing(false);
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
              Wall Drops
            </h2>
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--color-forest-ink)]"
              style={{ backgroundColor: 'var(--color-highlighter-yellow)' }}
            >
              BROADCASTS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-pencil-gray)]" style={{ fontFamily: 'var(--font-inter)' }}>
            Broadcast official announcements, task deliverables, and shared resources directly to the community feed.
          </p>
        </div>

        <SketchCallout
          text="compose pinned on right ⤵"
          arrow="down-right"
          color="#cb5521"
          rotate="-rotate-2"
          fontSize={18}
        />
      </div>

      {/* ───── Shared 2-Column Section Template (Desktop lg+) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (~2/3): Live List of Published Drops */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon icon="doodle:megaphone" width={18} height={18} className="text-[var(--color-forest-ink)]" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                Published Drops ({drops.length})
              </span>
            </div>
            <span className="text-xs font-mono text-[var(--color-pencil-gray)]">
              Live Team Wall Feed
            </span>
          </div>

          {loadingDrops && (
            <div className="p-8 text-center">
              <p className="text-xs font-mono text-[var(--color-pencil-gray)] animate-pulse">
                Loading broadcasts...
              </p>
            </div>
          )}

          {!loadingDrops && drops.length === 0 && (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[var(--color-pencil-gray)] bg-white/60">
              <div className="w-10 h-10 rounded-full border border-[var(--color-forest-ink)] bg-[var(--color-highlighter-yellow)] flex items-center justify-center mx-auto mb-2">
                <Icon icon="doodle:megaphone" width={20} height={20} className="text-[var(--color-forest-ink)]" />
              </div>
              <p className="text-sm font-bold text-[var(--color-forest-ink)] font-inter">
                No wall drops published yet.
              </p>
              <p className="text-xs text-[var(--color-pencil-gray)] font-inter mt-0.5">
                Use the compose rail on the right to broadcast your first announcement or task.
              </p>
            </div>
          )}

          {!loadingDrops && drops.length > 0 && (
            <div className="flex flex-col gap-3">
              {drops.map((drop) => (
                <AdminDropCard key={drop.id} post={drop} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column (~1/3): Sticky Compose Form Rail */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20 z-10 flex flex-col gap-4">
          <div
            className="p-4 sm:p-5 rounded-2xl border-2 border-[var(--color-forest-ink)] shadow-sm flex flex-col gap-4"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="pb-2 border-b border-[var(--color-pencil-gray)]/30">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-forest-ink)]">
                Compose Wall Drop
              </span>
              <p className="text-[11px] text-[var(--color-pencil-gray)] font-inter mt-0.5">
                Drop pins instantly to all member feeds.
              </p>
            </div>

            {success && (
              <div className="text-xs font-mono font-bold px-3 py-2 rounded-lg border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)] animate-fadeIn">
                ✓ Wall drop published successfully.
              </div>
            )}

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold mb-1.5 text-[var(--color-forest-ink)] font-inter">
                Category
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {POST_TYPES.map((pt) => {
                  const isSelected = postType === pt.type;
                  return (
                    <button
                      key={pt.type}
                      type="button"
                      onClick={() => setPostType(pt.type)}
                      className="flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold cursor-pointer btn-spring rounded-lg transition-colors"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        backgroundColor: isSelected ? pt.bg : 'white',
                        border: isSelected ? '2px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
                        color: 'var(--color-forest-ink)',
                      }}
                    >
                      <Icon icon={pt.icon} width={14} height={14} className="shrink-0" />
                      <span className="truncate">{pt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title & Link */}
            <div>
              <label className="block text-xs font-bold mb-1 text-[var(--color-forest-ink)] font-inter">
                Header Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Session #04 Slide Deck"
                className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white text-[var(--color-forest-ink)]"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-[var(--color-forest-ink)] font-inter">
                Meeting / Resource Link (optional)
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://figma.com/..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white text-[var(--color-forest-ink)] font-mono"
              />
            </div>

            {/* Content Textarea */}
            <div>
              <label className="block text-xs font-bold mb-1 text-[var(--color-forest-ink)] font-inter">
                Detailed Message
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the full briefing, instructions, or agenda..."
                rows={4}
                className="w-full text-xs p-3 rounded-lg border border-[var(--color-pencil-gray)] focus:border-[var(--color-forest-ink)] focus:outline-none bg-white text-[var(--color-forest-ink)] resize-none"
                style={{ fontFamily: 'var(--font-inter)', lineHeight: 1.5 }}
              />
            </div>

            {/* Pin Switch */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-bold text-[var(--color-forest-ink)] font-inter">
                Pin to top of feed
              </span>
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className="w-10 h-5 rounded-full relative cursor-pointer"
                style={{
                  backgroundColor: isPinned ? 'var(--color-sticky-note-mint)' : 'var(--color-pencil-gray)',
                  border: '1px solid var(--color-forest-ink)',
                  transition: 'background-color 150ms ease-out',
                }}
                role="switch"
                aria-checked={isPinned}
              >
                <span
                  className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-[var(--color-forest-ink)]"
                  style={{
                    left: isPinned ? '20px' : '2px',
                    transition: 'left 150ms ease-out',
                  }}
                />
              </button>
            </div>

            {/* Exactly ONE dark-green primary CTA */}
            <button
              type="button"
              onClick={handlePublish}
              disabled={!content.trim() || publishing}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-[var(--color-forest-ink)] cursor-pointer btn-spring transition-opacity disabled:opacity-40 text-center"
              style={{
                fontFamily: 'var(--font-inter)',
                backgroundColor: 'var(--color-forest-ink)',
                color: 'var(--color-cream-paper)',
              }}
            >
              {publishing ? 'Publishing...' : 'Publish Wall Drop →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
