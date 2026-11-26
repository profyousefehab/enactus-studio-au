import type { CSSProperties } from 'react';
import { getAvatar } from '../../data/avatars';

interface Props {
  avatarId?: string;
  customAvatarUrl?: string | null;
  /** Size in pixels (renders as a circle) */
  size?: number;
  /** Accessible alt text; when omitted, avatar is treated as decorative */
  alt?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Universal Avatar renderer for Enactus Studio.
 * Supports both custom uploaded photos (Data URL or HTTP)
 * and pre-rendered DiceBear Notionists preset avatars.
 */
export default function StudioAvatar({
  avatarId = 'av-01',
  customAvatarUrl,
  size = 48,
  alt,
  className = '',
  style,
}: Props) {
  const isDecorative = !alt;
  // If customAvatarUrl is provided OR if avatarId is a raw image/data URL, use it
  const imageSrc =
    customAvatarUrl ||
    (avatarId &&
      (avatarId.startsWith('data:image') ||
        avatarId.startsWith('http') ||
        avatarId.startsWith('blob:') ||
        avatarId.startsWith('/'))
      ? avatarId
      : null);

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={alt || ''}
        aria-hidden={isDecorative ? 'true' : undefined}
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 block select-none ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--radius-full)',
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  const avatar = getAvatar(avatarId);

  if (!avatar) {
    return (
      <div
        role={isDecorative ? undefined : 'img'}
        aria-label={isDecorative ? undefined : alt}
        aria-hidden={isDecorative ? 'true' : undefined}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-whisper-gray)',
          border: '1px solid var(--color-pencil-gray)',
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  return (
    <img
      className={`rounded-full object-cover shrink-0 block select-none ${className}`}
      src={avatar.dataUri}
      alt={alt || ''}
      aria-hidden={isDecorative ? 'true' : undefined}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-full)',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
