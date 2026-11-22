import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface Props {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Animated number counter with smooth ease-out deceleration.
 * Respects prefers-reduced-motion and gracefully updates when the target value changes.
 */
export default function AnimatedCounter({
  value,
  duration = 850,
  prefix = '',
  suffix = '',
  className = '',
  style,
}: Props) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const prevValueRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || duration <= 0) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const startValue = prevValueRef.current;
    const endValue = value;
    const change = endValue - startValue;

    if (change === 0) {
      setDisplayValue(value);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out expo deceleration for a snappy arcade/scoreboard feel
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(startValue + change * ease);

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span
      className={`inline-block tabular-nums font-mono select-none ${className}`}
      style={style}
      aria-label={`${prefix}${value}${suffix}`}
    >
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}
