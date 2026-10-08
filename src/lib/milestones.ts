export function parseMilestones(cell: string): string[] {
  const marker = cell.indexOf(':');
  const body = (marker >= 0 ? cell.slice(marker + 1) : cell).trim();
  if (!body) return [];
  return body
    .split('·')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
