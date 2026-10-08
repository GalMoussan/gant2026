import ExcelJS from 'exceljs';
import type { SheetGrid } from '../src/types.ts';

export function cellValue(cell: ExcelJS.Cell): string | number | null {
  if (cell.isMerged && cell.master.address !== cell.address) return null;
  const value = cell.value;
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value.trim() ? value : null;
  if (value instanceof Date) {
    const utc = Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
    return Math.round((utc - Date.UTC(1899, 11, 30)) / 86_400_000);
  }
  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray(value.richText)) {
      const text = value.richText.map((part) => part.text ?? '').join('');
      return text.trim() ? text : null;
    }
    if ('result' in value && (typeof value.result === 'number' || typeof value.result === 'string')) {
      return value.result;
    }
    if ('text' in value && typeof value.text === 'string' && value.text.trim()) return value.text;
  }
  return null;
}

export async function loadScheduleGrid(filePath: string): Promise<SheetGrid> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error(`Workbook has no sheet: ${filePath}`);
  return {
    maxRow: sheet.rowCount,
    get(col, row) {
      return cellValue(sheet.getRow(row).getCell(col));
    },
  };
}
