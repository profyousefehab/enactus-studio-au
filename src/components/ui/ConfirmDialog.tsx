import { useId, useRef } from 'react';
import { useFocusTrap } from '../../utils/useFocusTrap';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * SayBriefly-styled confirmation dialog replacing native window.confirm/alert.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useFocusTrap(open, dialogRef, () => {
    if (!loading) onCancel();
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26, 51, 0, 0.35)' }}
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-sm p-5 flex flex-col gap-3"
        style={{
          backgroundColor: 'var(--color-cream-paper)',
          border: '2px solid var(--color-forest-ink)',
          borderRadius: 'var(--radius-nav)',
          fontFamily: 'var(--font-inter)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id={titleId}
          className="text-base font-bold"
          style={{ color: 'var(--color-forest-ink)' }}
        >
          {title}
        </h3>

        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-forest-ink)' }}
        >
          {message}
        </p>

        {error && (
          <p
            role="alert"
            className="text-xs font-medium px-3 py-2"
            style={{
              color: 'var(--color-terracotta)',
              backgroundColor: 'rgba(203, 85, 33, 0.1)',
              border: '1px solid var(--color-terracotta)',
              borderRadius: 'var(--radius-buttons)',
            }}
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 mt-1">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2 text-sm font-medium cursor-pointer btn-spring"
            style={{
              color: 'var(--color-forest-ink)',
              backgroundColor: 'var(--color-cream-paper)',
              border: '1px solid var(--color-pencil-gray)',
              borderRadius: 'var(--radius-buttons)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold cursor-pointer btn-spring"
            style={{
              backgroundColor: destructive ? 'var(--color-terracotta)' : 'var(--color-forest-ink)',
              color: 'var(--color-cream-paper)',
              border: '1px solid var(--color-forest-ink)',
              borderRadius: 'var(--radius-buttons)',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
