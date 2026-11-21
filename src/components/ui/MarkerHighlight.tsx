import { useState, useEffect, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  color?: 'yellow' | 'terracotta' | 'mint' | 'teal' | 'blush';
  className?: string;
}

const COLOR_MAP = {
  yellow: {
    bg: '#ffe95c',
    text: 'var(--color-forest-ink)',
    accent: '#ffd93b',
  },
  terracotta: {
    bg: '#cb5521',
    text: '#fcfaf5',
    accent: '#b84617',
  },
  mint: {
    bg: 'var(--color-sticky-note-mint)',
    text: 'var(--color-forest-ink)',
    accent: '#c0ebb0',
  },
  teal: {
    bg: 'var(--color-sticky-note-teal)',
    text: 'var(--color-forest-ink)',
    accent: '#8ddada',
  },
  blush: {
    bg: 'var(--color-sticky-note-blush)',
    text: 'var(--color-forest-ink)',
    accent: '#eec0f9',
  },
};

export default function MarkerHighlight({ children, color = 'yellow', className = '' }: Props) {
  const [mounted, setMounted] = useState(false);
  const palette = COLOR_MAP[color] ?? COLOR_MAP.yellow;

  useEffect(() => {
    // Trigger swipe animation on mount
    const timer = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(timer);
  }, []);

  return (
    <span
      className={`relative inline-block isolate px-1.5 py-0.5 mx-0.5 select-none ${className}`}
      style={{
        color: palette.text,
        transition: 'color 0.2s ease',
      }}
    >
      {/* Organic chisel-tip marker brush stroke SVG */}
      <svg
        viewBox="0 0 120 34"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-0 -inset-x-1.5 -inset-y-0.5 w-[calc(100%+12px)] h-[calc(100%+4px)] -z-10 pointer-events-none transition-all duration-400 ease-out"
        style={{
          transformOrigin: 'left center',
          clipPath: mounted ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
          transition: 'clip-path 450ms cubic-bezier(0.25, 1, 0.5, 1), transform 450ms ease-out',
          transform: mounted ? 'scaleX(1)' : 'scaleX(0.85)',
        }}
      >
        {/* Soft secondary stroke layer (bleeds slightly outside) */}
        <path
          d="M 3,6 Q 30,3.5 60,5.5 T 118,4 C 119.5,10 117.5,18 119,23 C 117.5,28 119,30 117,32 Q 90,30.5 60,31.5 T 2,29 C 4,23 2,14 3,6 Z"
          fill={palette.accent}
          opacity="0.45"
        />
        {/* Main chisel swipe path with rough jagged edges */}
        <path
          d="M 4,4.5 C 18,2.8 35,4.2 55,3.6 C 75,3.0 95,4.8 116,3 C 118,8 116.5,14 117.5,19 C 116,24.5 118,27.5 115.5,31 C 96,29.5 75,30.8 54,30.2 C 34,29.6 15,31.2 3.5,29 C 5,23.5 3,15 4.5,9 Z"
          fill={palette.bg}
        />
      </svg>
      <span className="relative z-10">{children}</span>
    </span>
  );
}
