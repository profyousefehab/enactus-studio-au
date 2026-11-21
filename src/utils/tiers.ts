// ═══════════════════════════════════════════
// Tier Progression System
// Potato 🥔 (0–49) → Rookie 🐣 (50–149) → Pro ⚡ (150–299) → Legend 🚀 (300–499) → Mythic 💎 (500+)
// ═══════════════════════════════════════════

export interface Tier {
  name: string;
  emoji: string;
  icon: string;
  minPoints: number;
  maxPoints: number | null; // null = no cap (Mythic)
  color: string; // accent color for progress bar
}

export const TIERS: Tier[] = [
  { name: 'Potato', emoji: '🥔', icon: 'fluent-emoji-flat:potato', minPoints: 0, maxPoints: 49, color: '#d5f5c2' },
  { name: 'Rookie', emoji: '🐣', icon: 'fluent-emoji-flat:hatching-chick', minPoints: 50, maxPoints: 149, color: '#d5f5c2' },
  { name: 'Pro', emoji: '⚡', icon: 'fluent-emoji-flat:high-voltage', minPoints: 150, maxPoints: 299, color: '#ffe95c' },
  { name: 'Legend', emoji: '🚀', icon: 'fluent-emoji-flat:rocket', minPoints: 300, maxPoints: 499, color: '#a8e5e5' },
  { name: 'Mythic', emoji: '💎', icon: 'fluent-emoji-flat:gem-stone', minPoints: 500, maxPoints: null, color: '#f6d0ff' },
];

/** Get the current tier for a given point total */
export function getTier(points: number): Tier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) return TIERS[i];
  }
  return TIERS[0];
}

/** Get the next tier (or null if already Mythic) */
export function getNextTier(points: number): Tier | null {
  const current = getTier(points);
  const idx = TIERS.indexOf(current);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

/** Get progress percentage toward next tier (0–100). Returns 100 at Mythic. */
export function getTierProgress(points: number): number {
  const current = getTier(points);
  const next = getNextTier(points);

  if (!next) return 100; // Mythic — full bar

  const rangeSize = next.minPoints - current.minPoints;
  const progress = points - current.minPoints;
  return Math.min(100, Math.round((progress / rangeSize) * 100));
}

/** Format tier display: "🥔 Potato" */
export function formatTier(points: number): string {
  const tier = getTier(points);
  return `${tier.emoji} ${tier.name}`;
}
