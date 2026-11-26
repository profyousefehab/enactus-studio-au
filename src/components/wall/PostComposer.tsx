import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import StickerIcon from '../ui/StickerIcon';
import { db } from '../../lib/firebase';
import { useSession } from '../../context/SessionContext';

export default function PostComposer() {
  const { user } = useSession();
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [posting, setPosting] = useState(false);

  if (!user) return null;

  async function handlePost() {
    if (!content.trim() || !user) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'wallPosts'), {
        authorId: user.id,
        authorName: user.name,
        authorAvatarId: user.avatarId,
        authorCustomAvatarUrl: user.customAvatarUrl || null,
        authorTrack: user.track,
        postType: 'member_post',
        title: null,
        content: content.trim(),
        linkUrl: linkUrl.trim() || null,
        isPinned: false,
        reactions: { '🔥': [], '💡': [], '❤️': [] },
        commentCount: 0,
        createdAt: Timestamp.now(),
      });
      setContent('');
      setLinkUrl('');
      setShowLink(false);
    } catch (err) {
      console.error('Post error:', err);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div
      className="p-4"
      style={{
        backgroundColor: 'var(--color-cream-paper)',
        border: '1px solid var(--color-forest-ink)',
        borderRadius: 'var(--radius-cards)',
      }}
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share an idea, question, resource, or thought with the team..."
        aria-label="Write a post for the team wall"
        rows={2}
        className="w-full resize-none text-sm focus:outline-none"
        style={{
          fontFamily: 'var(--font-inter)',
          color: 'var(--color-forest-ink)',
          backgroundColor: 'transparent',
          border: 'none',
        }}
      />

      {showLink && (
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="Add a link..."
          aria-label="Link URL"
          className="w-full text-sm mt-2 px-0 py-1 focus:outline-none"
          style={{
            fontFamily: 'var(--font-inter)',
            color: 'var(--color-forest-ink)',
            backgroundColor: 'transparent',
            borderTop: '1px solid var(--color-pencil-gray)',
            borderBottom: 'none',
            borderLeft: 'none',
            borderRight: 'none',
          }}
        />
      )}

      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={() => setShowLink(!showLink)}
          aria-expanded={showLink}
          aria-label={showLink ? 'Remove link' : 'Add a link'}
          className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer min-h-[36px] px-1"
          style={{
            fontFamily: 'var(--font-inter)',
            color: 'var(--color-forest-ink)',
            opacity: 0.75,
          }}
        >
          <StickerIcon name="link" size={16} />
          {showLink ? 'Remove link' : 'Add a link'}
        </button>

        <button
          type="button"
          onClick={handlePost}
          disabled={!content.trim() || posting}
          className="px-4 py-1.5 min-h-[36px] text-xs font-semibold cursor-pointer btn-spring"
          style={{
            fontFamily: 'var(--font-inter)',
            backgroundColor: 'var(--color-forest-ink)',
            color: 'var(--color-cream-paper)',
            borderRadius: 'var(--radius-buttons)',
            border: 'none',
            opacity: content.trim() && !posting ? 1 : 0.4,
          }}
        >
          {posting ? 'Posting...' : 'Post →'}
        </button>
      </div>
    </div>
  );
}
