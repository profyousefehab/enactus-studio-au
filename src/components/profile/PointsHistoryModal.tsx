import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot, type Timestamp } from 'firebase/firestore';
import { Icon } from '@iconify/react';
import { db } from '../../lib/firebase';
import { useSession } from '../../context/SessionContext';

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

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none profile-bricolage"
      style={{
        backgroundColor: 'rgba(26, 51, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        fontFamily: 'var(--font-bricolage)',
        letterSpacing: '-0.03em',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="points-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[380px] rounded-2xl bg-[#fcfaf5] border-2 border-[#1a3300] p-5 z-50 relative flex flex-col gap-4 shadow-xl animate-fadeIn profile-bricolage"
        style={{
          fontFamily: 'var(--font-bricolage)',
          letterSpacing: '-0.03em',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row with Title, Points Pill & Close ✕ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3
              id="points-modal-title"
              className="text-base font-bold text-[#1a3300] tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              Points History
            </h3>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded bg-[#ffe95c] border border-[#1a3300]/30 text-[#1a3300] tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              {points} pts
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#1a3300]/10 text-[#1a3300] cursor-pointer transition-colors btn-spring"
            aria-label="Close modal"
          >
            <Icon icon="doodle:close" width={14} height={14} />
          </button>
        </div>

        {/* Chronological List of Point Events or 1-Line Empty State */}
        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
          {loading ? (
            <p
              className="text-xs font-semibold text-center text-[#1a3300]/50 py-4 animate-pulse tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              Loading points...
            </p>
          ) : events.length === 0 ? (
            <p
              className="text-xs text-center text-[#1a3300]/60 py-6 font-semibold tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              No points logged yet
            </p>
          ) : (
            events.map((evt) => {
              const isPositive = evt.amount >= 0;
              return (
                <div
                  key={evt.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-[#1a3300]/10 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-bold text-[#1a3300] truncate tracking-[-0.03em]"
                      style={{ fontFamily: 'var(--font-bricolage)' }}
                    >
                      {evt.reason || 'Point Event'}
                    </p>
                    <p
                      className="text-[10px] font-semibold text-[#1a3300]/50 mt-0.5 tracking-[-0.03em]"
                      style={{ fontFamily: 'var(--font-bricolage)' }}
                    >
                      {formatDate(evt.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded border shrink-0 tracking-[-0.03em] ${
                      isPositive
                        ? 'bg-[#d5f5c2] text-[#1a3300] border-[#1a3300]/20'
                        : 'bg-[#ffd5d5] text-[#cb5521] border-[#cb5521]/30'
                    }`}
                    style={{ fontFamily: 'var(--font-bricolage)' }}
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
          className="text-xs font-bold text-[#1a3300] underline text-center cursor-pointer hover:text-[#cb5521] transition-colors mt-1 tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-bricolage)' }}
        >
          Full rules in Guidelines →
        </button>
      </div>
    </div>
  );
}
