const PALETTE = [
  { bg: '#FEE2E2', text: '#DC2626' },
  { bg: '#DBEAFE', text: '#2563EB' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#F3E8FF', text: '#9333EA' },
  { bg: '#FFEDD5', text: '#EA580C' },
  { bg: '#FCE7F3', text: '#DB2777' },
  { bg: '#E0F2FE', text: '#0284C7' },
  { bg: '#D1FAE5', text: '#059669' },
];

export function getColor(index) {
  return PALETTE[index % PALETTE.length];
}

export function getColorByName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
