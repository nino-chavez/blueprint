/**
 * Executable reader-encounter gate. The implementation lives in tools/lib so
 * the same contract can be run directly, through `blueprint review`, or by
 * `blueprint doctor`.
 */
import { auditReaderContract } from '../../../../tools/lib/encounter-audit.mjs';

export default async function review({ targetDir }) {
  return auditReaderContract({ targetDir });
}
