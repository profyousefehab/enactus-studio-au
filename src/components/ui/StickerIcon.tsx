import { Icon } from '@iconify/react';
import type { CSSProperties } from 'react';

interface Props {
  name: string;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
  'aria-label'?: string;
}

/**
 * Clean wrapper around Fluent Emoji Flat vector sticker icons.
 * Enforces inline-block shrink-0 with explicit dimensions so icons
 * never collapse, clip, or shift layout across any browser or container.
 */
export default function StickerIcon({
  name,
  size = 20,
  className = '',
  style,
  ...rest
}: Props) {
  // Normalize icon name so callers can pass either "fire" or "fluent-emoji-flat:fire"
  const iconName = name.startsWith('fluent-emoji-flat:')
    ? name
    : name.includes(':')
    ? name
    : `fluent-emoji-flat:${name}`;

  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <span
      className={`inline-block shrink-0 leading-none select-none ${className}`}
      style={{
        width: dimension,
        height: dimension,
        verticalAlign: 'middle',
        ...style,
      }}
    >
      <Icon
        icon={iconName}
        width={size}
        height={size}
        className="w-full h-full block shrink-0"
        {...rest}
      />
    </span>
  );
}
