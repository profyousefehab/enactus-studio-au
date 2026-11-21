import type { ReactNode } from 'react';
import MarkerHighlight from './MarkerHighlight';

interface Props {
  children: ReactNode;
  /** Words or phrases to wrap in the marker brush stroke */
  highlight?: string[];
  highlightColor?: 'yellow' | 'terracotta' | 'mint' | 'teal' | 'blush';
  className?: string;
}

/**
 * Display headline using Bricolage Grotesque 800 with optional
 * organic chisel-tip marker brush stroke highlights on specific words.
 * Letter-spacing tuned to 0.015em for crisp, punchy studio headlines.
 */
export default function BricolageHeadline({
  children,
  highlight = [],
  highlightColor = 'yellow',
  className = '',
}: Props) {
  if (typeof children !== 'string' || highlight.length === 0) {
    return (
      <h1
        className={`leading-none ${className}`}
        style={{
          fontFamily: 'var(--font-bricolage)',
          fontWeight: 800,
          color: 'var(--color-forest-ink)',
          letterSpacing: '0.015em',
        }}
      >
        {children}
      </h1>
    );
  }

  // Build a regex that matches any of the highlight words
  const pattern = new RegExp(`(${highlight.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = (children as string).split(pattern);

  return (
    <h1
      className={`leading-none ${className}`}
      style={{
        fontFamily: 'var(--font-bricolage)',
        fontWeight: 800,
        color: 'var(--color-forest-ink)',
        letterSpacing: '0.015em',
      }}
    >
      {parts.map((part, i) =>
        highlight.some(h => h.toLowerCase() === part.toLowerCase()) ? (
          <MarkerHighlight key={i} color={highlightColor}>
            {part}
          </MarkerHighlight>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </h1>
  );
}
