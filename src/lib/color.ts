export function tint(hex: string, ratio = 0.34): string {
  const raw = hex.replace('#', '');
  const channels = [0, 2, 4].map((start) => Number.parseInt(raw.slice(start, start + 2), 16));
  const mixed = channels.map((channel) => Math.round(channel * ratio + 255 * (1 - ratio)));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function linear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const raw = hex.replace('#', '');
  const rgb = [0, 2, 4].map((start) => linear(Number.parseInt(raw.slice(start, start + 2), 16)));
  return 0.2126 * (rgb[0] ?? 0) + 0.7152 * (rgb[1] ?? 0) + 0.0722 * (rgb[2] ?? 0);
}

export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}
