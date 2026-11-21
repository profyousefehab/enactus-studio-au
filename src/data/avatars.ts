// ═══════════════════════════════════════════
// 16 Studio Avatars — DiceBear Notionists style
// Pre-generated SVG strings for instant offline rendering
// Seeds: studio_01 through studio_16
// Backgrounds: rotating through our pastel palette
// ═══════════════════════════════════════════

import { createAvatar } from '@dicebear/core';
import { notionists } from '@dicebear/collection';

const PASTEL_BACKGROUNDS = ['#d5f5c2', '#a8e5e5', '#f6d0ff', '#ffe95c'];

export interface Avatar {
  id: string;
  seed: string;
  svg: string;
  dataUri: string;
  backgroundColor: string;
}

/** Generate all 16 avatars at module load (instant, no network) */
function generateAvatars(): Avatar[] {
  const avatars: Avatar[] = [];

  for (let i = 1; i <= 16; i++) {
    const seed = `studio_${String(i).padStart(2, '0')}`;
    const bg = PASTEL_BACKGROUNDS[(i - 1) % PASTEL_BACKGROUNDS.length];

    const avatar = createAvatar(notionists, {
      seed,
      backgroundColor: [bg.replace('#', '')],
      backgroundType: ['solid'],
    });

    const svgString = avatar.toString();
    const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

    avatars.push({
      id: `av-${String(i).padStart(2, '0')}`,
      seed,
      svg: svgString,
      dataUri,
      backgroundColor: bg,
    });
  }

  return avatars;
}

export const AVATARS: Avatar[] = generateAvatars();

/** Find an avatar by ID */
export function getAvatar(id: string): Avatar | undefined {
  if (!id) return AVATARS[0];
  const found = AVATARS.find((a) => a.id === id || a.seed === id);
  if (found) return found;

  const num = parseInt(id.replace(/\D/g, ''), 10);
  if (!isNaN(num) && num >= 1 && num <= AVATARS.length) {
    return AVATARS[num - 1];
  }

  return AVATARS[0];
}
