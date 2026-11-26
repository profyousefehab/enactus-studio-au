import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import { useSession } from '../../context/SessionContext';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import ConfirmDialog from '../ui/ConfirmDialog';
import { formatRelativeTime } from '../../utils/time';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatarId: string;
  userCustomAvatarUrl?: string | null;
  userTrack: 'Design' | 'Content';
  content: string;
  createdAt: Timestamp;
}

interface Props {
  postId: string;
  commentCount: number;
}

export default function CommentThread({ postId, commentCount }: Props) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Real-time listener on comments subcollection
  useEffect(() => {
    if (!open) return;

    const q = query(
      collection(db, 'wallPosts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setComments(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment))
      );
    });

    return unsub;
  }, [open, postId]);

  async function handleSubmit() {
    if (!input.trim() || !user || posting) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'wallPosts', postId, 'comments'), {
        userId: user.id,
        userName: user.name,
        userAvatarId: user.avatarId,
        userCustomAvatarUrl: user.customAvatarUrl || null,
        userTrack: user.track,
        content: input.trim(),
        createdAt: Timestamp.now(),
      });
      // Increment comment count on parent post
      await updateDoc(doc(db, 'wallPosts', postId), {
        commentCount: increment(1),
      });
      setInput('');
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setPosting(false);
    }
  }

  async function confirmDeleteComment() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteDoc(doc(db, 'wallPosts', postId, 'comments', pendingDeleteId));
      await updateDoc(doc(db, 'wallPosts', postId), {
        commentCount: increment(-1),
      });
      setPendingDeleteId(null);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setDeleteError('Failed to delete comment. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ borderTop: '1px solid var(--color-pencil-gray)' }} className="mt-3 pt-2">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        style={{
          fontFamily: 'var(--font-inter)',
          color: 'var(--color-forest-ink)',
          opacity: 0.75,
          background: 'none',
          border: 'none',
          padding: 0,
        }}
      >
        <Icon icon="doodle:chat-bubble" width={14} height={14} className="shrink-0" />
        {commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : 'Comment'}
        <Icon
          icon="doodle:chevron-down"
          width={14}
          height={14}
          className="shrink-0"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease-out',
          }}
        />
      </button>

      {/* Expandable thread */}
      <div
        style={{
          maxHeight: open ? '600px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 200ms ease-out',
        }}
        className="comment-expand"
      >
        {/* Comment list */}
        {comments.length > 0 && (
          <div className="flex flex-col gap-2.5 mt-3">
            {comments.map((c) => {
              const canDeleteComment =
                user?.role === 'admin' ||
                (user?.id && (c.userId === user.id || (c as any).authorId === user.id));

              return (
                <div key={c.id} className="flex items-start justify-between gap-2 group">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <StudioAvatar
                      avatarId={c.userAvatarId}
                      customAvatarUrl={c.userCustomAvatarUrl}
                      size={28}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-xs font-semibold"
                          style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
                        >
                          {c.userName}
                        </span>
                        <TrackBadge track={c.userTrack} size="sm" />
                        <span
                          className="text-xs"
                          style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}
                        >
                          {formatRelativeTime(c.createdAt)}
                        </span>
                      </div>
                      <p
                        className="text-xs mt-0.5"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          color: 'var(--color-forest-ink)',
                          lineHeight: 1.5,
                        }}
                      >
                        {c.content}
                      </p>
                    </div>
                  </div>

                  {canDeleteComment && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDeleteId(c.id);
                      }}
                      className="p-1.5 rounded cursor-pointer transition-colors text-[var(--color-pencil-gray)] hover:text-[var(--color-terracotta)] hover:bg-black/5 shrink-0"
                      title="Delete comment"
                      aria-label="Delete comment"
                    >
                      <Icon icon="doodle:trash" width={13} height={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Comment input */}
        {user && (
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="Write a comment..."
              aria-label="Write a comment"
              className="flex-1 text-xs px-3 py-1.5 focus:outline-none"
              style={{
                fontFamily: 'var(--font-inter)',
                color: 'var(--color-forest-ink)',
                backgroundColor: 'var(--color-cream-paper)',
                border: '1px solid var(--color-pencil-gray)',
                borderRadius: 'var(--radius-buttons)',
              }}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() || posting}
              className="text-xs font-semibold px-3 py-1.5 cursor-pointer"
              style={{
                fontFamily: 'var(--font-inter)',
                backgroundColor: 'var(--color-forest-ink)',
                color: 'var(--color-cream-paper)',
                border: 'none',
                borderRadius: 'var(--radius-buttons)',
                opacity: input.trim() && !posting ? 1 : 0.4,
              }}
            >
              {posting ? '...' : 'Reply'}
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete comment?"
        message="This comment will be permanently removed."
        confirmLabel="Delete"
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDeleteComment}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
