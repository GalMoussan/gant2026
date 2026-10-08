export const LEGEND_RE = /\((\d+)×(\d+)\s*ש'\)\s*$/;

const TIME_RE = /בין\s+(\d{1,2}:\d{2})\s+עד\s+(\d{1,2}:\d{2})/;

export interface ParsedLegend {
  name: string;
  groups: number;
  weeklyHoursPerGroup: number;
}

export function parseLegend(raw: string): ParsedLegend | null {
  const match = raw.match(LEGEND_RE);
  if (!match || match.index === undefined || !match[1] || !match[2]) return null;
  const name = raw.slice(0, match.index).trim();
  if (!name) return null;
  return {
    name,
    groups: Number(match[1]),
    weeklyHoursPerGroup: Number(match[2]),
  };
}

export interface ParsedSpecial {
  title: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
}

function padTime(value: string): string {
  const [hour, minute] = value.split(':');
  return `${(hour ?? '0').padStart(2, '0')}:${minute ?? '00'}`;
}

export function parseSpecial(raw: string): ParsedSpecial {
  const time = raw.match(TIME_RE);
  const title = raw
    .replace(TIME_RE, ' ')
    .replace(/^★\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!time || !time[1] || !time[2]) return { title, allDay: true };
  return {
    title,
    allDay: false,
    startTime: padTime(time[1]),
    endTime: padTime(time[2]),
  };
}
