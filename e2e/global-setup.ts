import MCR from 'monocart-coverage-reports';
import { coverageOptions } from './coverage-options';

export default function globalSetup(): void {
  MCR(coverageOptions).cleanCache();
}
