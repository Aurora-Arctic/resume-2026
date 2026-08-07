import fs from 'node:fs';
import path from 'node:path';
import MCR from 'monocart-coverage-reports';
import { coverageOptions } from './coverage-options';

const THRESHOLDS: Record<'lines' | 'branches' | 'functions' | 'statements', number> = {
  lines: 80,
  branches: 80,
  functions: 80,
  statements: 80,
};

// Rejecting here fails the overall `playwright test` process/exit code, the
// same way a failing test does.
export default async function globalTeardown(): Promise<void> {
  await MCR(coverageOptions).generate();

  const summaryPath = path.join(coverageOptions.outputDir ?? '.', 'coverage-summary.json');
  if (!fs.existsSync(summaryPath)) {
    throw new Error(
      `No e2e coverage summary at ${summaryPath} — instrumentation likely did not run.`,
    );
  }

  // Read the report just written above rather than trusting mcr.generate()'s
  // return value — see coverage-options.ts for why that value reflects the
  // wrong (unscoped) data.
  const { total } = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const failures = (Object.entries(THRESHOLDS) as [keyof typeof THRESHOLDS, number][])
    .map(
      ([key, min]) => [key, min, typeof total[key].pct === 'number' ? total[key].pct : 0] as const,
    )
    .filter(([, min, pct]) => pct < min)
    .map(([key, min, pct]) => `${key} coverage ${pct}% is below the ${min}% threshold`);

  if (failures.length > 0) {
    throw new Error(failures.join('\n'));
  }
}
