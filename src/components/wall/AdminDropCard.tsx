import { doc, deleteDoc, type Timestamp } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import StickerIcon from '../ui/StickerIcon';
import { db } from '../../lib/firebase';
import { useSession } from '../../context/SessionContext';
import { formatRelativeTime } from '../../utils/time';

export interface AdminDrop {
  id: string;
  postType: 'announcement' | 'task' | 'resource';
  title: string | null;
  content: string;
  linkUrl: string | null;
  isPinned: boolean;
  createdAt: Timestamp;
  authorName: string;
  authorId?: string;
}

const TYPE_CONFIG = {
  announcement: { icon: 'fluent-emoji-flat:pushpin', label: 'ANNOUNCEMENT', bg: 'var(--color-sticky-note-mint)' },
  task:         { icon: 'fluent-emoji-flat:high-voltage', label: 'TASK',         bg: 'var(--color-sticky-note-mint)' },
  resource:     { icon: 'fluent-emoji-flat:link', label: 'RESOURCE',     bg: 'var(--color-highlighter-yellow)' },
};

export default function AdminDropCard({ post }: { post: AdminDrop }) {
  const { user } = useSession();
  const config = TYPE_CONFIG[post.postType] ?? TYPE_CONFIG.announcement;
  const canDelete = user?.role === 'admin' || (user?.id && post.authorId === user.id);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm("Delete this post from the wall?")) return;
    try {
      await deleteDoc(doc(db, 'wallPosts', post.id));
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Failed to delete post.');
    }
  }

  return (
    <div
      className="p-4 card-spring relative"
      style={{
        backgroundColor: config.bg,
        border: '1px solid var(--color-forest-ink)',
        borderRadius: 'var(--radius-cards)',
      }}
    >
      {/* Top Header Row: Badge & Delete Action */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-forest-ink)',
            backgroundColor: 'rgba(255,255,255,0.5)',
            borderRadius: 'var(--radius-buttons)',
          }}
        >
          <StickerIcon name={config.icon} size={16} />
          {config.label}
        </span>

        {canDelete && (
          <button
            onClick={handleDelete}
            className="p-1 rounded cursor-pointer transition-colors text-[var(--color-pencil-gray)] hover:text-[#cb5521] hover:bg-black/5"
            title="Delete post"
            aria-label="Delete post"
          >
            <Icon icon="doodle:trash" width={16} height={16} />
          </button>
        )}
      </div>

      {/* Title */}
      {post.title && (
        <h3
          className="text-base font-bold mb-1"
          style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
        >
          {post.title}
        </h3>
      )}

      {/* Body */}
      <p
        className="text-sm mb-2"
        style={{
          fontFamily: 'var(--font-inter)',
          color: 'var(--color-forest-ink)',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
        }}
      >
        {post.content}
      </p>

      {/* Link */}
      {post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium underline mb-2"
          style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
        >
          Open Link →
        </a>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 mt-1">
        <span
          className="text-xs"
          style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)', opacity: 0.6 }}
        >
          {post.authorName} · {formatRelativeTime(post.createdAt)}
        </span>
      </div>
    </div>
  );
}
