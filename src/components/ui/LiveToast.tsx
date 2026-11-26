import { useSession } from '../../context/SessionContext';

/**
 * Top Slide-Down Live Toast Notification (<LiveToast/>)
 * Appears dynamically when points, attendance streak, or tier level increase via real-time Firestore onSnapshot.
 * Exact specifications:
 * fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#d5f5c2] border-2 border-[#1a3300] px-4 py-2.5 rounded-full shadow-md
 */
export default function LiveToast() {
  const { toast, dismissToast } = useSession();

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={dismissToast}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-sticky-note-mint)] border-2 border-[var(--color-forest-ink)] px-4 py-2.5 rounded-full flex items-center gap-2.5 cursor-pointer btn-spring animate-fadeIn select-none max-w-[92vw]"
      style={{
        boxShadow: 'var(--shadow-subtle-2)',
      }}
      title="Tap to dismiss"
    >
      <span
        className="text-xs sm:text-sm font-bold text-[var(--color-forest-ink)] truncate"
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        {toast.message}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          dismissToast();
        }}
        className="text-[var(--color-forest-ink)]/60 hover:text-[var(--color-forest-ink)] text-xs font-bold leading-none p-1 rounded-full transition-colors"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}
