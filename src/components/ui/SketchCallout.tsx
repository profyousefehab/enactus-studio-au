export type ArrowType =
  | 'down-right'
  | 'down-left'
  | 'up-left'
  | 'up-right'
  | 'up'
  | 'down'
  | 'curved-left'
  | 'none';

interface Props {
  text: string;
  arrow?: ArrowType;
  color?: string;
  rotate?: string;
  fontSize?: number | string;
  className?: string;
  arrowPosition?: 'left' | 'right' | 'bottom';
}

function RenderArrow({ type, color }: { type: ArrowType; color: string }) {
  if (type === 'none') return null;

  switch (type) {
    case 'down-right':
      return (
        <svg
          width="24"
          height="22"
          viewBox="0 0 28 26"
          fill="none"
          className="shrink-0 overflow-visible inline-block select-none pointer-events-none"
          style={{ color }}
          aria-hidden="true"
        >
          <path d="M 3,4 C 10,8 18,14 22,22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 16,19 L 22,22 L 23,15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'down-left':
      return (
        <svg
          width="24"
          height="22"
          viewBox="0 0 28 26"
          fill="none"
          className="shrink-0 overflow-visible inline-block select-none pointer-events-none"
          style={{ color }}
          aria-hidden="true"
        >
          <path d="M 25,4 C 18,8 10,14 6,22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 12,19 L 6,22 L 5,15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'up':
      return (
        <svg
          width="18"
          height="22"
          viewBox="0 0 20 26"
          fill="none"
          className="shrink-0 overflow-visible inline-block select-none pointer-events-none"
          style={{ color }}
          aria-hidden="true"
        >
          <path d="M 10,22 C 11,15 9,10 10,4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 5,9 L 10,4 L 15,9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'up-left':
    case 'curved-left':
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 26 26"
          fill="none"
          className="shrink-0 overflow-visible inline-block select-none pointer-events-none"
          style={{ color }}
          aria-hidden="true"
        >
          <path d="M 20,22 C 18,14 12,8 8,4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 8,12 L 8,4 L 15,6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'up-right':
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 26 26"
          fill="none"
          className="shrink-0 overflow-visible inline-block select-none pointer-events-none"
          style={{ color }}
          aria-hidden="true"
        >
          <path d="M 6,22 C 8,14 14,8 18,4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 11,6 L 18,4 L 18,12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'down':
      return (
        <svg
          width="18"
          height="22"
          viewBox="0 0 20 26"
          fill="none"
          className="shrink-0 overflow-visible inline-block select-none pointer-events-none"
          style={{ color }}
          aria-hidden="true"
        >
          <path d="M 10,4 C 9,11 11,16 10,22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 5,17 L 10,22 L 15,17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Reusable handwritten sketchbook callout component.
 * Uses Nanum Pen Script font at ~24px with leading-none and an authentic hand-drawn curved SVG arrow.
 */
export default function SketchCallout({
  text,
  arrow = 'down-right',
  color = 'var(--color-forest-ink)',
  rotate = '-rotate-2',
  fontSize = 24,
  className = '',
  arrowPosition = 'right',
}: Props) {
  const fontDimension = typeof fontSize === 'number' ? `${fontSize}px` : fontSize;

  return (
    <span
      className={`font-hand inline-flex items-center gap-1.5 select-none leading-none ${rotate} ${className}`}
      style={{
        color,
        fontSize: fontDimension,
        fontFamily: 'var(--font-hand)',
      }}
    >
      {arrowPosition === 'left' && <RenderArrow type={arrow} color={color} />}
      <span className="tracking-wide whitespace-nowrap">{text}</span>
      {arrowPosition === 'right' && <RenderArrow type={arrow} color={color} />}
      {arrowPosition === 'bottom' && (
        <span className="block mt-0.5">
          <RenderArrow type={arrow} color={color} />
        </span>
      )}
    </span>
  );
}
