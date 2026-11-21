import { addCollection } from '@iconify/react';
import { icons as doodleIcons } from '@iconify-json/doodle-icons';
import fluentData from './fluent-subset.json';

// All icons used across the app (pre-extracted into fluent-subset.json for minimal bundle)
export const USED_FLUENT_ICONS = [
  'artist-palette',
  'pencil',
  'warning',
  'fire',
  'bar-chart',
  'seedling',
  'pushpin',
  'high-voltage',
  'link',
  'light-bulb',
  'sparkling-heart',
  'potato',
  'hatching-chick',
  'rocket',
  'gem-stone',
  'star',
  'handshake',
  'scroll',
  'down-arrow',
  'speech-balloon',
] as const;

export type FluentIconName = typeof USED_FLUENT_ICONS[number];

// Custom hand-drawn doodle icons
const paletteIcon = {
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.4"><path d="M33 37c4.5-3.5 6.5-8 6.5-14.5c0-8-6.5-14-16-14C13.5 8.5 8.5 15 8.5 24c0 8.5 6 14.5 15 14.5c3.8 0 6.2-2.2 7.8-4.5c1.2-1.8 3-2.6 4.8-1.5c1.8 1.1 1.2 3.5-.8 5.2"/><path d="M31 25.5c-.8-1.5.3-3.5 2.2-3.5c1.8 0 2.7 1.8 2 3.5c-.6 1.6-3.2 1.8-4.2 0z"/><circle cx="16" cy="17" r="2.2" fill="currentColor" stroke="none"/><circle cx="23.5" cy="14" r="2.2" fill="currentColor" stroke="none"/><circle cx="31" cy="16.5" r="2.2" fill="currentColor" stroke="none"/><circle cx="14" cy="24.5" r="2.2" fill="currentColor" stroke="none"/><circle cx="18" cy="32" r="2.2" fill="currentColor" stroke="none"/></g>',
};

const fullDoodleIcons = {
  ...doodleIcons.icons,
  palette: paletteIcon,
  trophy: doodleIcons.icons['star-medal'] || doodleIcons.icons.star,
  logout: doodleIcons.icons['log-out'],
};

// Register doodle icons offline
addCollection({
  prefix: 'doodle',
  width: 48,
  height: 48,
  icons: fullDoodleIcons,
});

addCollection({
  prefix: 'doodle-icons',
  width: 48,
  height: 48,
  icons: fullDoodleIcons,
});

// Register fluent-emoji-flat collection locally for offline rendering
// fluent-subset.json already contains only the 20 used icons — no runtime filtering needed
addCollection({
  prefix: 'fluent-emoji-flat',
  width: fluentData.width || 32,
  height: fluentData.height || 32,
  icons: fluentData.icons as Record<string, { body: string }>,
});
