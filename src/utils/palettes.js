export const PALETTES = {
  fintech: {
    id: 'fintech',
    name: 'Social Fintech',
    emoji: '🎯',
    description: 'Versátil — qualquer evento',
    headerBg: '#FF6B6B',
    headerText: '#fff',
    primary: '#FF6B6B',
    accent: '#06D6A0',
    highlightBg: '#FFF0F0',
    highlightText: '#D94F4F',
    highlightBorder: '#FFCDD2',
    badgeBg: '#F0FFF8',
    badgeText: '#059669',
    preview: ['#FF6B6B', '#06D6A0'],
  },
  brasa: {
    id: 'brasa',
    name: 'Brasa & Ouro',
    emoji: '🔥',
    description: 'Churrascos e gastronomia',
    headerBg: '#7C2D12',
    headerText: '#fff',
    primary: '#C2410C',
    accent: '#D97706',
    highlightBg: '#FFFBEB',
    highlightText: '#92400E',
    highlightBorder: '#FDE68A',
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
    preview: ['#C2410C', '#D97706'],
  },
  nightlife: {
    id: 'nightlife',
    name: 'Nightlife Neon',
    emoji: '🌙',
    description: 'Baladas, bares e noite',
    headerBg: '#1A0030',
    headerText: '#C084FC',
    primary: '#7C3AED',
    accent: '#A855F7',
    highlightBg: '#F5F3FF',
    highlightText: '#6D28D9',
    highlightBorder: '#DDD6FE',
    badgeBg: '#EDE9FE',
    badgeText: '#7C3AED',
    preview: ['#1A0030', '#A855F7'],
  },
};

export const DEFAULT_PALETTE_ID = 'fintech';

export function getPalette(id) {
  return PALETTES[id] || PALETTES[DEFAULT_PALETTE_ID];
}
