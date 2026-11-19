// Hands this entry in. Sunset Cover Studio is a plain set of static files
// under app/ — an index page, a stylesheet, three small ES modules and a
// vendored display font — that runs in a desktop browser with no network at
// all, plus a screenshots/ folder of four JPEGs taken from the app itself.
// This program (Node 22, standard library only) copies both folders into the
// output directory and writes dossier.json there with the vendored make.fun
// library, so the scorer can check the app and the judge can read the dossier.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader's container MAKEFUN_OUTPUT_DIR is unset and /output is used.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps below mirror the scorer's own limits, so a bad hand-in fails here
// instead of at the gate: at most four screenshots of 256 KiB each, at most
// 993 files and 48 MiB under app/, no app/ path longer than 1000 bytes, and
// the dossier's source text capped at 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
