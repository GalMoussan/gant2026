export const CHIP_COMFORT = 22;
export const CHIP_COMPACT = 16;
export const CHIP_GAP = 2;

export interface Density {
  mode: 'comfortable' | 'compact' | 'overflow';
  visible: number;
}

function stackHeight(size: number, count: number): number {
  if (count <= 0) return 0;
  return count * size + (count - 1) * CHIP_GAP;
}

/** Pick a chip density that never slices a chip and never grows the cell. */
export function chooseDensity(availablePx: number, count: number): Density {
  if (count <= 0 || availablePx <= 0) return { mode: 'comfortable', visible: 0 };
  if (stackHeight(CHIP_COMFORT, count) <= availablePx) {
    return { mode: 'comfortable', visible: count };
  }
  if (stackHeight(CHIP_COMPACT, count) <= availablePx) {
    return { mode: 'compact', visible: count };
  }
  let visible = 0;
  while (
    visible < count &&
    stackHeight(CHIP_COMPACT, visible + 1) + CHIP_GAP + CHIP_COMPACT <= availablePx
  ) {
    visible += 1;
  }
  return { mode: 'overflow', visible };
}
