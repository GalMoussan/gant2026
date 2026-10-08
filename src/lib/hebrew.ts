import { HDate, Locale } from '@hebcal/core';

const HEBREW_MONTHS: Record<string, string> = {
  Nisan: 'ניסן',
  Iyyar: 'אייר',
  Sivan: 'סיון',
  Tamuz: 'תמוז',
  Av: 'אב',
  Elul: 'אלול',
  Tishrei: 'תשרי',
  Cheshvan: 'חשון',
  Kislev: 'כסלו',
  Tevet: 'טבת',
  Shvat: 'שבט',
  "Sh'vat": 'שבט',
  'Adar I': 'אדר א',
  'Adar II': 'אדר ב',
  Adar: 'אדר',
};

/** Arabic day number plus the month spelling used in the Excel file. */
export function formatHebrew(iso: string): string {
  const [yearText, monthText, dayText] = iso.split('-');
  const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
  const hebrew = new HDate(date);
  const key = hebrew.getMonthName();
  const fromTable = HEBREW_MONTHS[key];
  const name =
    fromTable ??
    Locale.hebrewStripNikkud(Locale.gettext(key, 'he'))
      .replace(/׳/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  return `${hebrew.getDate()} ${name}`;
}
