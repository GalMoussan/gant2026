import { seed } from '../../data/model.ts';
import { he } from '../../i18n/he.ts';

interface YearRailProps {
  current: string;
  onJump: (key: string) => void;
}

export function YearRail({ current, onJump }: YearRailProps) {
  return (
    <nav className="year-rail" aria-label={he.yearRail}>
      {seed.months.map((month) => {
        const abbr = he.monthAbbr[month.key.slice(5)] ?? month.key;
        return (
          <button
            key={month.key}
            type="button"
            className={month.key === current ? 'is-current' : undefined}
            aria-current={month.key === current ? 'true' : undefined}
            aria-label={month.title}
            onClick={() => onJump(month.key)}
          >
            {abbr}
          </button>
        );
      })}
    </nav>
  );
}
