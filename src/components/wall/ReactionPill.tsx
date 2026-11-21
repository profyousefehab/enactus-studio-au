import StickerIcon from '../ui/StickerIcon';

interface Props {
  emoji: string;
  count: number;
  active: boolean;
  onToggle: () => void;
}

const REACTION_ICONS: Record<string, string> = {
  '🔥': 'fire',
  '💡': 'light-bulb',
  '❤️': 'sparkling-heart',
};

/**
 * Toggleable reaction pill with live count.
 * Uses crisp fluent-emoji-flat vector sticker icons at 20px via StickerIcon wrapper.
 * Active: yellow fill. Inactive: cream + pencil border.
 */
export default function ReactionPill({ emoji, count, active, onToggle }: Props) {
  const iconName = REACTION_ICONS[emoji];

  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium cursor-pointer pill-spring"
      style={{
        fontFamily: 'var(--font-inter)',
        borderRadius: 'var(--radius-full)',
        backgroundColor: active ? 'var(--color-highlighter-yellow)' : 'var(--color-cream-paper)',
        border: active ? '1px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
        color: 'var(--color-forest-ink)',
        transform: active ? 'scale(1.05)' : 'scale(1)',
      }}
      aria-pressed={active}
      aria-label={`${emoji} reaction, ${count} ${count === 1 ? 'person' : 'people'}`}
    >
      {iconName ? (
        <StickerIcon name={iconName} size={20} />
      ) : (
        <span>{emoji}</span>
      )}
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
