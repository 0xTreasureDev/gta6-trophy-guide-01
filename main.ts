// Leonida Legend hand-in program for the gta6-trophy-guide-01 bounty.
//
// The entry itself is the static site in app/: plain HTML, CSS and ES modules
// plus app/data/trophies.json, with no build step and no network use at run
// time. This program's only job is delivery. It copies app/ and screenshots/
// into the output directory and writes dossier.json there with the vendored
// make.fun library, using the scorer's caps exactly as the bounty specifies.
//
// Run it with:  MAKEFUN_OUTPUT_DIR=/tmp/out node --experimental-strip-types main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const entryDir = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly rather than hand in an empty entry if the payload is missing.
if (!existsSync(join(entryDir, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing beside main.ts; there is no entry to hand in.');
}
if (!existsSync(join(entryDir, 'app', 'data', 'trophies.json'))) {
  throw new Error('app/data/trophies.json is missing beside main.ts; the guide data is required.');
}

mkdirSync(outputDir, { recursive: true });

// Copy the two payload folders beside this file into the output directory.
cpSync(join(entryDir, 'app'), join(outputDir, 'app'), { recursive: true });
const shotsSource = join(entryDir, 'screenshots');
const shotsTarget = join(outputDir, 'screenshots');
mkdirSync(shotsTarget, { recursive: true });
if (existsSync(shotsSource)) {
  cpSync(shotsSource, shotsTarget, { recursive: true });
}

// Summarise the delivered output for the judge. The limits below are the
// competition's own: dossier text budget, at most 4 screenshots of at most
// 256 KiB each, and at most 993 app entries totalling at most 48 MiB.
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierText);
console.log(`Handed in to ${outputDir}: app/ and screenshots/ copied, dossier.json written (${dossierText.length} bytes).`);
