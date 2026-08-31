/**
 * Build the deployable `dist/` folder for GitHub Pages.
 *
 * What it does:
 *   1. Copies index.html + assets/ (the only things the site serves) into dist/.
 *   2. Minifies every .js and .css file in place (whitespace + syntax only).
 *
 * Deliberately NOT done:
 *   - No bundling. Each script stays its own file, loaded in the same order by
 *     index.html. The app relies on cross-file globals, so bundling is unsafe.
 *   - No identifier renaming (`minifyIdentifiers: false`). Renaming top-level
 *     names would break those cross-file globals.
 *   - charset: 'utf8' so the Hindi / Odia strings are kept as real characters
 *     instead of being expanded to \uXXXX escapes (which would bloat the output).
 *
 * Source files are never touched — everything happens inside dist/.
 */
import * as esbuild from 'esbuild';
import { cpSync, rmSync, mkdirSync, writeFileSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const OUT = 'dist';
const COPY = ['index.html', 'assets'];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const entry of COPY) cpSync(entry, join(OUT, entry), { recursive: true });
writeFileSync(join(OUT, '.nojekyll'), '');

const JS_OPTS = {
  minifyWhitespace: true,
  minifySyntax: true,
  // Safe in non-bundle mode: esbuild renames only function-local names,
  // never top-level identifiers, so cross-file globals stay intact.
  minifyIdentifiers: true,
  legalComments: 'none',
  charset: 'utf8',
  sourcemap: true,
  logLevel: 'silent',
  allowOverwrite: true,
};
const CSS_OPTS = {
  minify: true,
  charset: 'utf8',
  sourcemap: true,
  logLevel: 'silent',
  allowOverwrite: true,
  loader: { '.css': 'css' },
};

let rawTotal = 0;
let minTotal = 0;

async function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { await walk(p); continue; }
    const ext = extname(p).toLowerCase();
    if (ext !== '.js' && ext !== '.css') continue;

    const before = statSync(p).size;
    await esbuild.build({ entryPoints: [p], outfile: p, ...(ext === '.js' ? JS_OPTS : CSS_OPTS) });
    const after = statSync(p).size;

    rawTotal += before;
    minTotal += after;
    const pct = before ? Math.round((1 - after / before) * 100) : 0;
    console.log(`${p.padEnd(48)} ${(before / 1024).toFixed(1).padStart(7)} KB -> ${(after / 1024).toFixed(1).padStart(7)} KB  (-${pct}%)`);
  }
}

await walk(join(OUT, 'assets'));

const pct = rawTotal ? Math.round((1 - minTotal / rawTotal) * 100) : 0;
console.log('-'.repeat(80));
console.log(`total  ${(rawTotal / 1024).toFixed(1)} KB -> ${(minTotal / 1024).toFixed(1)} KB  (-${pct}% before gzip)`);
