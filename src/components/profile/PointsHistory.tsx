// ═══════════════════════════════════════════
// Points History Card — Profile sub-component
// Queries pointEvents for the current user, ordered by createdAt desc, limit 15
// With robust index fallback and instant empty-state resolution
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, type Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useSession } from '../../context/SessionContext';
import StickerIcon from '../ui/StickerIcon';

interface PointEvent {
  id: string;
  amount: number;
  reason: string;
  createdAt: Timestamp;
}

export default function PointsHistory() {
  const { user } = useSession();
  const [events, setEvents] = useState<PointEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let fallbackUnsub: (() => void) | null = null;

    // Primary query ordered by createdAt desc
    const q = query(
      collection(db, 'pointEvents'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc'),
      limit(15),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setEvents(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as PointEvent[],
        );
        setLoading(false);
      },
      (error) => {
        console.warn('pointEvents orderBy query failed (falling back without index requirement):', error);
        // Fallback query without orderBy to bypass missing composite index in Firestore
        try {
          const fallbackQ = query(
            collection(db, 'pointEvents'),
            where('userId', '==', user.id),
            limit(15),
          );
          fallbackUnsub = onSnapshot(
            fallbackQ,
            (fallbackSnap) => {
              const list = fallbackSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as PointEvent[];
              // In-memory sort by createdAt desc
              list.sort((a, b) => {
                const timeA = a.createdAt?.toMillis?.() ?? 0;
                const timeB = b.createdAt?.toMillis?.() ?? 0;
                return timeB - timeA;
              });
              setEvents(list);
              setLoading(false);
            },
            (err2) => {
              console.error('Fallback pointEvents query failed:', err2);
              setEvents([]);
              setLoading(false);
            }
          );
        } catch (e) {
          console.error('Error starting fallback query:', e);
          setEvents([]);
          setLoading(false);
        }
      }
    );

    return () => {
      unsub();
      if (fallbackUnsub) fallbackUnsub();
    };
  }, [user]);

  if (!user) return null;

  function formatDate(ts: Timestamp): string {
    if (!ts?.toDate) return 'Recent';
    const d = ts.toDate();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div
      className="overflow-hidden card-spring"
      style={{
        backgroundColor: 'var(--color-cream-paper)',
        border: '1px solid var(--color-forest-ink)',
        borderRadius: 'var(--radius-cards)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--color-pencil-gray)' }}>
        <StickerIcon name="bar-chart" size={16} />
        <p
          className="text-[11px] font-medium tracking-wider"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-forest-ink)',
          }}
        >
          POINTS HISTORY
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-3.5 space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-8 animate-pulse"
              style={{ backgroundColor: 'var(--color-whisper-gray)', borderRadius: 'var(--radius-buttons)' }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && events.length === 0 && (
        <div className="px-3.5 py-5 text-center">
          <StickerIcon name="seedling" size={26} className="mx-auto mb-1.5" />
          <p
            className="text-xs sm:text-sm"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'var(--color-pencil-gray)',
              fontStyle: 'italic',
              lineHeight: 1.4,
            }}
          >
            No point events logged yet—join a session or drop an idea on the wall!
          </p>
        </div>
      )}

      {/* Event rows */}
      {!loading && events.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'var(--color-whisper-gray)' }}>
          {events.map((evt) => (
            <div key={evt.id} className="flex items-center justify-between px-3.5 py-2.5">
              <div className="min-w-0 flex-1 pr-3">
                <p
                  className="text-xs sm:text-sm font-medium truncate"
                  style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-forest-ink)' }}
                >
                  {evt.reason}
                </p>
                <p
                  className="text-[11px]"
                  style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-pencil-gray)' }}
                >
                  {formatDate(evt.createdAt)}
                </p>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 shrink-0"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-forest-ink)',
                  backgroundColor: evt.amount > 0 ? 'var(--color-sticky-note-mint)' : 'var(--color-sticky-note-blush)',
                  borderRadius: 'var(--radius-buttons)',
                }}
              >
                {evt.amount > 0 ? `+${evt.amount}` : evt.amount} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
