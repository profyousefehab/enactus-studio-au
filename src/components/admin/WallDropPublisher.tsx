import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import { useSession } from '../../context/SessionContext';

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
    <div
      className="p-4 sm:p-5"
      style={{
        backgroundColor: 'var(--color-cream-paper)',
        border: '1px solid var(--color-forest-ink)',
        borderRadius: 'var(--radius-cards)',
      }}
    >
      <div className="mb-4 pb-3 border-b border-[var(--color-pencil-gray)]">
        <h4
          className="text-base font-bold flex items-center gap-2"
          style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
        >
          <Icon icon="doodle:megaphone" width={18} height={18} className="shrink-0" />
          Broadcast Team Wall Drop
        </h4>
        <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}>
          Publish official announcements, task deliverables, or shared resources directly to the community feed.
        </p>
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
          Wall drop published successfully to Team Wall.
        </div>
      )}

      {/* Post Type Selector */}
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1.5" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
          Drop Category
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {POST_TYPES.map((pt) => {
            const isSelected = postType === pt.type;
            return (
              <button
                key={pt.type}
                onClick={() => setPostType(pt.type)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold cursor-pointer btn-spring"
                style={{
                  fontFamily: 'var(--font-inter)',
                  backgroundColor: isSelected ? pt.bg : 'transparent',
                  border: isSelected ? '2px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
                  borderRadius: 'var(--radius-buttons)',
                  color: 'var(--color-forest-ink)',
                }}
              >
                <Icon icon={pt.icon} width={16} height={16} className="shrink-0" />
                <span>{pt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title & Link URL inputs (2 cols on tablet+) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
            Header Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Session #04 Slide Deck & Homework"
            className="w-full text-sm px-3 py-2 focus:outline-none"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'var(--color-forest-ink)',
              backgroundColor: 'var(--color-cream-paper)',
              border: '1px solid var(--color-pencil-gray)',
              borderRadius: 'var(--radius-buttons)',
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
            Resource / Meeting Link (optional)
          </label>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://figma.com/..."
            className="w-full text-sm px-3 py-2 focus:outline-none"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'var(--color-forest-ink)',
              backgroundColor: 'var(--color-cream-paper)',
              border: '1px solid var(--color-pencil-gray)',
              borderRadius: 'var(--radius-buttons)',
            }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}>
          Detailed Message
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write the full briefing, instructions, or agenda..."
          rows={4}
          className="w-full text-sm px-3 py-2.5 resize-none focus:outline-none"
          style={{
            fontFamily: 'var(--font-inter)',
            color: 'var(--color-forest-ink)',
            backgroundColor: 'var(--color-cream-paper)',
            border: '1px solid var(--color-pencil-gray)',
            borderRadius: 'var(--radius-buttons)',
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Pin toggle + Publish Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--color-pencil-gray)]">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
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
              className="absolute top-0.5 w-3.5 h-3.5 rounded-full"
              style={{
                backgroundColor: 'var(--color-forest-ink)',
                left: isPinned ? '20px' : '2px',
                transition: 'left 150ms ease-out',
              }}
            />
          </button>
          <span
            className="text-xs font-semibold"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
          >
            Pin to top of feed
          </span>
        </label>

        <button
          onClick={handlePublish}
          disabled={!content.trim() || publishing}
          className="px-6 py-2.5 text-sm font-semibold cursor-pointer btn-spring"
          style={{
            fontFamily: 'var(--font-inter)',
            backgroundColor: 'var(--color-forest-ink)',
            color: 'var(--color-cream-paper)',
            border: 'none',
            borderRadius: 'var(--radius-buttons)',
            opacity: content.trim() && !publishing ? 1 : 0.4,
          }}
        >
          {publishing ? 'Publishing...' : 'Publish Wall Drop \u2192'}
        </button>
      </div>
    </div>
  );
}
