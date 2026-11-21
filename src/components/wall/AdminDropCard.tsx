import { doc, deleteDoc, type Timestamp } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import StickerIcon from '../ui/StickerIcon';
import StudioAvatar from '../ui/StudioAvatar';
import TrackBadge from '../ui/TrackBadge';
import { db } from '../../lib/firebase';
import { useSession } from '../../context/SessionContext';
import { formatRelativeTime } from '../../utils/time';

export interface AdminDrop {
  id: string;
  postType: 'announcement' | 'task' | 'resource' | 'golden_win';
  title: string | null;
  content: string;
  linkUrl: string | null;
  isPinned: boolean;
  createdAt: Timestamp;
  authorName: string;
  authorId?: string;
  // Golden win specific fields
  winnerId?: string;
  winnerName?: string;
  winnerAvatarId?: string;
  winnerCustomAvatarUrl?: string | null;
  winnerTrack?: 'Design' | 'Content';
  questionText?: string;
  correctAnswer?: string;
  points?: number;
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; bg: string }> = {
  announcement: { icon: 'fluent-emoji-flat:pushpin', label: 'ANNOUNCEMENT', bg: 'var(--color-sticky-note-mint)' },
  task:         { icon: 'fluent-emoji-flat:high-voltage', label: 'TASK',         bg: 'var(--color-sticky-note-mint)' },
  resource:     { icon: 'fluent-emoji-flat:link', label: 'RESOURCE',     bg: 'var(--color-highlighter-yellow)' },
  golden_win:   { icon: 'fluent-emoji-flat:trophy', label: '⚡ GOLDEN QUESTION SOLVED', bg: 'var(--color-highlighter-yellow)' },
};

export default function AdminDropCard({ post }: { post: AdminDrop }) {
  const { user } = useSession();
  const config = TYPE_CONFIG[post.postType] ?? TYPE_CONFIG.announcement;
  const isGoldenWin = post.postType === 'golden_win';
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
      className="p-4 sm:p-5 card-spring relative overflow-hidden"
      style={{
        backgroundColor: config.bg,
        border: '1.5px solid var(--color-forest-ink)',
        borderRadius: 'var(--radius-cards)',
      }}
    >
      {/* Decorative Washi Tape for Golden Win */}
      {isGoldenWin && (
        <div
          className="absolute -top-3.5 right-6 w-24 h-6 pointer-events-none shadow-xs -rotate-3 z-10"
          style={{
            backgroundColor: 'rgba(213, 245, 194, 0.95)',
            border: '1px dashed rgba(26, 51, 0, 0.3)',
          }}
        />
      )}

      {/* Top Header Row: Badge & Delete Action */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-forest-ink)',
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: 'var(--radius-buttons)',
              border: '1px solid rgba(26, 51, 0, 0.2)',
            }}
          >
            <StickerIcon name={config.icon} size={16} />
            {config.label}
          </span>

          {isGoldenWin && post.points && (
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-forest-ink)] text-white shadow-xs"
            >
              +{post.points} PTS
            </span>
          )}
        </div>

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

      {/* ── SPECIAL GOLDEN WIN CELEBRATORY CARD BODY ── */}
      {isGoldenWin ? (
        <div className="space-y-3">
          {/* Winner Profile Banner */}
          <div
            className="p-3 rounded-xl border border-[var(--color-forest-ink)] flex items-center justify-between gap-3 shadow-xs"
            style={{ backgroundColor: 'var(--color-cream-paper)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <StudioAvatar
                avatarId={post.winnerAvatarId || 'av-07'}
                customAvatarUrl={post.winnerCustomAvatarUrl}
                size={38}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-sm font-bold truncate text-[var(--color-forest-ink)]"
                    style={{ fontFamily: 'var(--font-bricolage)' }}
                  >
                    🏆 {post.winnerName || post.authorName}
                  </span>
                  {post.winnerTrack && <TrackBadge track={post.winnerTrack} size="sm" />}
                </div>
                <span
                  className="text-xs font-mono text-[var(--color-pencil-gray)]"
                >
                  Sole Winner · First to crack it!
                </span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 text-sm font-extrabold font-mono text-[var(--color-forest-ink)] bg-[#d5f5c2] px-2.5 py-1 rounded-lg border border-[var(--color-forest-ink)]">
              +{post.points || 30} PTS
            </div>
          </div>

          {/* Question & Answer Box */}
          <div
            className="p-3 rounded-xl border border-[var(--color-forest-ink)]/20 space-y-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
          >
            {post.questionText && (
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-pencil-gray)] block">
                  Question Prompt:
                </span>
                <p
                  className="text-xs sm:text-sm font-semibold text-[var(--color-forest-ink)]"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  "{post.questionText}"
                </p>
              </div>
            )}

            {post.correctAnswer && (
              <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-forest-ink)]/10">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-pencil-gray)]">
                  Correct Answer:
                </span>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#d5f5c2] text-[var(--color-forest-ink)] border border-[var(--color-forest-ink)]"
                >
                  ✓ {post.correctAnswer}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Standard Admin Drop Body */
        <>
          {post.title && (
            <h3
              className="text-base font-bold mb-1"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
            >
              {post.title}
            </h3>
          )}

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
        </>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--color-forest-ink)]/15">
        <span
          className="text-xs"
          style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)', opacity: 0.7 }}
        >
          {post.authorName} · {formatRelativeTime(post.createdAt)}
        </span>
      </div>
    </div>
  );
}
