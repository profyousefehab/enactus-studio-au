import StickerIcon from './StickerIcon';

interface Props {
  track: 'Design' | 'Content';
  size?: 'sm' | 'md';
}

export default function TrackBadge({ track, size = 'sm' }: Props) {
  const bg = track === 'Design' ? 'var(--color-sticky-note-mint)' : 'var(--color-sticky-note-teal)';
  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3.5 py-1'}`}
      style={{
        fontFamily: 'inherit',
        backgroundColor: bg,
        color: 'var(--color-forest-ink)',
        borderRadius: 'var(--radius-tags)',
      }}
    >
      <StickerIcon
        name={track === 'Design' ? 'artist-palette' : 'pencil'}
        size={iconSize}
      />
      {track}
    </span>
  );
}
