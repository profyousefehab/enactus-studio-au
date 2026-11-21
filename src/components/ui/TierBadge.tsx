import StickerIcon from './StickerIcon';
import { getTier } from '../../utils/tiers';

interface Props {
  points: number;
  showName?: boolean;
  size?: 'sm' | 'md';
}

export default function TierBadge({ points, showName = true, size = 'sm' }: Props) {
  const tier = getTier(points);
  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
      style={{
        fontFamily: 'var(--font-inter)',
        color: 'var(--color-forest-ink)',
      }}
    >
      <StickerIcon name={tier.icon} size={iconSize} />
      {showName && <span>{tier.name}</span>}
    </span>
  );
}
