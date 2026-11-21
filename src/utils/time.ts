import type { Timestamp } from 'firebase/firestore';

/** Format a Firestore Timestamp as a human-readable relative time (e.g. "2h ago") */
export function formatRelativeTime(ts: Timestamp): string {
  const now = Date.now();
  const then = ts.toMillis();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}w ago`;

  // Fallback to date string
  return new Date(then).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
