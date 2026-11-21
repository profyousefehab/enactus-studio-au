import type { Timestamp } from 'firebase/firestore';
import { doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import { useSession } from '../../context/SessionContext';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import ReactionPill from './ReactionPill';
import CommentThread from './CommentThread';
import { formatRelativeTime } from '../../utils/time';

export interface MemberPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarId: string;
  authorCustomAvatarUrl?: string | null;
  authorTrack: 'Design' | 'Content';
  postType: 'member_post' | 'announcement' | 'task' | 'resource';
  title: string | null;
  content: string;
  linkUrl: string | null;
  isPinned: boolean;
  reactions: Record<string, string[]>;
  commentCount: number;
  createdAt: Timestamp;
}

export type WallPost = MemberPost;

const REACTION_EMOJIS = ['🔥', '💡', '❤️'];

interface Props {
  post: MemberPost;
  userId?: string;
}

export default function MemberPostCard({ post, userId: propUserId }: Props) {
  const { user } = useSession();
  const userId = propUserId || user?.id || '';
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

  async function toggleReaction(emoji: string) {
    if (!userId) return;
    const postRef = doc(db, 'wallPosts', post.id);
    const reactors = post.reactions?.[emoji] ?? [];
    const hasReacted = reactors.includes(userId);

    try {
      await updateDoc(postRef, {
        [`reactions.${emoji}`]: hasReacted ? arrayRemove(userId) : arrayUnion(userId),
      });
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  }

  return (
    <div
      className="p-4 card-spring"
      style={{
        backgroundColor: 'var(--color-cream-paper)',
        border: '1px solid var(--color-pencil-gray)',
        borderRadius: 'var(--radius-cards)',
      }}
    >
      {/* Author row */}
      <div className="flex items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <StudioAvatar
            avatarId={post.authorAvatarId}
            customAvatarUrl={post.authorCustomAvatarUrl}
            size={36}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-sm font-semibold truncate"
                style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
              >
                {post.authorName}
              </span>
              <TrackBadge track={post.authorTrack} size="sm" />
            </div>
            <span
              className="text-xs"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}
            >
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>

        {canDelete && (
          <button
            onClick={handleDelete}
            className="p-1 rounded cursor-pointer transition-colors text-[var(--color-pencil-gray)] hover:text-[#cb5521] hover:bg-black/5 shrink-0"
            title="Delete post"
            aria-label="Delete post"
          >
            <Icon icon="doodle:trash" width={16} height={16} />
          </button>
        )}
      </div>

      {/* Body */}
      <p
        className="text-sm mb-3"
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
          className="inline-flex items-center text-sm font-medium underline mb-3"
          style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
        >
          {post.linkUrl.length > 40 ? post.linkUrl.substring(0, 40) + '…' : post.linkUrl}
        </a>
      )}

      {/* Reactions */}
      <div className="flex items-center gap-2 flex-wrap">
        {REACTION_EMOJIS.map((emoji) => {
          const reactors = post.reactions?.[emoji] ?? [];
          return (
            <ReactionPill
              key={emoji}
              emoji={emoji}
              count={reactors.length}
              active={reactors.includes(userId)}
              onToggle={() => toggleReaction(emoji)}
            />
          );
        })}

      </div>

      {/* Comment thread */}
      <CommentThread postId={post.id} commentCount={post.commentCount} />
    </div>
  );
}
