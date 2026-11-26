import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot, type Timestamp } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import { useSession } from '../../context/SessionContext';
import { useFocusTrap } from '../../utils/useFocusTrap';

interface PointEvent {
  id: string;
  amount: number;
  reason: string;
  createdAt: Timestamp;
}

interface Props {
  open: boolean;
  onClose: () => void;
  points: number;
}

export default function PointsHistoryModal({ open, onClose, points }: Props) {
  const { user } = useSession();
  const navigate = useNavigate();
  const [events, setEvents] = useState<PointEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(open, modalRef, onClose);

  useEffect(() => {
    if (!open || !user) {
      setLoading(false);
      return;
    }

    let fallbackUnsub: (() => void) | null = null;
    const q = query(
      collection(db, 'pointEvents'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setEvents(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as PointEvent[]
        );
        setLoading(false);
      },
      (error) => {
        console.warn('pointEvents orderBy query failed (fallback without index):', error);
        try {
          const fallbackQ = query(
            collection(db, 'pointEvents'),
            where('userId', '==', user.id),
            limit(25)
          );
          fallbackUnsub = onSnapshot(
            fallbackQ,
            (fallbackSnap) => {
              const list = fallbackSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as PointEvent[];
              list.sort((a, b) => {
                const timeA = a.createdAt?.toMillis?.() ?? 0;
                const timeB = b.createdAt?.toMillis?.() ?? 0;
                return timeB - timeA;
              });
              setEvents(list);
              setLoading(false);
            },
            () => {
              setEvents([]);
              setLoading(false);
            }
          );
        } catch {
          setEvents([]);
          setLoading(false);
        }
      }
    );

    return () => {
      unsub();
      if (fallbackUnsub) fallbackUnsub();
    };
  }, [open, user]);

  if (!open) return null;

  function formatDate(ts: Timestamp): string {
    if (!ts?.toDate) return 'Recent';
    try {
      const d = ts.toDate();
      return (
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ' · ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return 'Recent';
    }
  }

  function handleGoToGuidelines() {
    onClose();
    navigate('/guidelines');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{
        backgroundColor: 'rgba(26, 51, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        fontFamily: 'var(--font-inter)',
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="points-modal-title"
        tabIndex={-1}
        className="w-full max-w-[380px] rounded-2xl bg-[var(--color-cream-paper)] border-2 border-[var(--color-forest-ink)] p-5 z-50 relative flex flex-col gap-4 animate-fadeIn"
        style={{
          fontFamily: 'var(--font-inter)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row with Title, Points Pill & Close ✕ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3
              id="points-modal-title"
              className="text-base font-bold text-[var(--color-forest-ink)]"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Points History
            </h3>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-highlighter-yellow)] border border-[var(--color-forest-ink)]/30 text-[var(--color-forest-ink)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {points} pts
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--color-forest-ink)]/10 text-[var(--color-forest-ink)] cursor-pointer transition-colors btn-spring"
            aria-label="Close modal"
          >
            <Icon icon="doodle:close" width={14} height={14} />
          </button>
        </div>

        {/* Chronological List of Point Events or 1-Line Empty State */}
        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
          {loading ? (
            <p
              className="text-xs font-semibold text-center text-[var(--color-forest-ink)]/50 py-4 animate-pulse"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Loading points...
            </p>
          ) : events.length === 0 ? (
            <p
              className="text-xs text-center text-[var(--color-forest-ink)]/60 py-6 font-medium"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              No points logged yet
            </p>
          ) : (
            events.map((evt) => {
              const isPositive = evt.amount >= 0;
              return (
                <div
                  key={evt.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--color-cream-paper)] border border-[var(--color-forest-ink)]/15 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-semibold text-[var(--color-forest-ink)] truncate"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      {evt.reason || 'Point Event'}
                    </p>
                    <p
                      className="text-[10px] font-medium text-[var(--color-forest-ink)]/55 mt-0.5"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {formatDate(evt.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded border shrink-0 ${
                      isPositive
                        ? 'bg-[var(--color-sticky-note-mint)] text-[var(--color-forest-ink)] border-[var(--color-forest-ink)]/20'
                        : 'bg-[rgba(203,85,33,0.12)] text-[var(--color-terracotta)] border-[var(--color-terracotta)]/30'
                    }`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {isPositive ? `+${evt.amount}` : evt.amount}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Single Read More Link */}
        <button
          type="button"
          onClick={handleGoToGuidelines}
          className="text-xs font-semibold text-[var(--color-forest-ink)] underline text-center cursor-pointer hover:text-[var(--color-terracotta)] transition-colors mt-1 min-h-[36px]"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Full rules in Guidelines →
        </button>
      </div>
    </div>
  );
}
