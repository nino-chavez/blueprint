#!/usr/bin/env node

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateReviewLoop } from '../../../template/tools/lib/review-loop.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const expected = {
  atelier: { verdict: 'PENDING', submissions: 0, open: 0 },
  'film-room': { verdict: 'PASS', submissions: 1, open: 0 },
  adaptive: { verdict: 'PENDING', submissions: 0, open: 0 },
};

let assertions = 0;
const ok = (condition, label) => {
  assertions += 1;
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  }
};

for (const [fixture, want] of Object.entries(expected)) {
  const result = evaluateReviewLoop({ root: join(here, 'fixtures', fixture) });
  ok(result.errors.length === 0, `${fixture}: structurally valid`);
  ok(result.verdict === want.verdict, `${fixture}: verdict ${want.verdict}`);
  ok(result.counts.submissions === want.submissions, `${fixture}: submission count`);
  ok(result.counts.open === want.open, `${fixture}: open count`);
  console.log(`${fixture}: ${result.verdict}; submissions=${result.counts.submissions}; dispositions=${result.counts.dispositions}; open=${result.counts.open}`);
}

if (!process.exitCode) console.log(`review-loop replay: PASS (${assertions} assertions)`);
