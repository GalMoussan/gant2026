import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeed } from '../src/import/buildSeed.ts';
import { formatReport, validateSeed } from '../src/lib/validateSeed.ts';
import { loadScheduleGrid } from './excelGrid.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'schedule.xlsx');
const targetPath = path.join(root, 'src', 'data', 'seed.json');

const seed = buildSeed(await loadScheduleGrid(sourcePath));
const issues = validateSeed(seed);
console.log(formatReport(seed, issues));
if (issues.length > 0) process.exit(1);
await writeFile(targetPath, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
console.log(`wrote ${path.relative(root, targetPath)}`);
