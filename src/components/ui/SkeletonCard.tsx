interface Props {
  className?: string;
  /** Height in pixels */
  height?: number;
  /** Whether to show as a circle (for avatars) */
  circle?: boolean;
}

export default function SkeletonCard({ className = '', height = 80, circle = false }: Props) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        backgroundColor: 'var(--color-whisper-gray)',
        borderRadius: circle ? 'var(--radius-full)' : 'var(--radius-cards)',
        height: circle ? height : undefined,
        width: circle ? height : undefined,
        minHeight: circle ? undefined : height,
      }}
    />
  );
}
