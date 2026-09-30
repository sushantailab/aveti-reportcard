/**
 * Build the deployable `dist/` folder for GitHub Pages.
 *
 * What it does:
 *   1. Copies index.html + assets/ (the only things the site serves) into dist/.
 *   2. Minifies every .js and .css file in place (whitespace + syntax only).
 *   3. Concatenates the local <script> files (already minified by step 2) into
 *      one assets/js/bundle.js and rewrites dist/index.html to load that one
 *      file instead of 14 separate ones — same code, one request instead of
 *      many, cutting the number of round trips a first-time visitor pays for.
 *
 * Deliberately NOT done:
 *   - No esbuild "bundle" mode. That does static module analysis (import
 *     graphs, scope hoisting) which assumes ES modules — these are plain
 *     global scripts, so esbuild's bundler would be the wrong tool and could
 *     silently break the cross-file globals the app relies on. Step 3 instead
 *     does a plain ordered text concatenation, which preserves the exact same
 *     global-scope semantics the app already depends on today (loading many
 *     classic <script> tags already shares one global scope across files;
 *     pasting the same code in the same order into one file changes nothing
 *     about how it runs, only how many HTTP requests it costs).
 *   - No identifier renaming across files (`minifyIdentifiers` still only
 *     touches function-local names — see step 2's options below). Renaming
 *     top-level names would break those cross-file globals.
 *   - charset: 'utf8' so the Hindi / Odia strings are kept as real characters
 *     instead of being expanded to \uXXXX escapes (which would bloat the output).
 *
 * Source files are never touched — everything happens inside dist/. Keep
 * editing the 14 separate files under assets/js/; the bundle is regenerated
 * fresh on every deploy, so it can never go stale relative to the sources.
 */
import * as esbuild from 'esbuild';
import { cpSync, rmSync, mkdirSync, writeFileSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createHash } from 'node:crypto';

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

// Step 3: combine the local <script> tags into as few files as possible.
// Only dist/index.html is rewritten — the source index.html keeps its
// per-file list, which is what contributors actually edit.
//
// One file breaks this rule: core/database.js calls
// `window.supabase.createClient(...)` at its own top level, so if the
// Supabase CDN script is slow or blocked, that line throws synchronously.
// Today, with each file as its own <script>, that throw only loses
// database.js's own definitions — every other file is a separate script
// execution and still runs. If database.js were concatenated together with
// the rest, the same throw would abort everything textually after it in
// that one file, including things as basic as page navigation. So it's kept
// in its own small bundle, split right after it; everything else (which
// only declares functions/constants at their top level, never calls
// anything that can fail over the network) is safe to fully combine.
const htmlPath = join(OUT, 'index.html');
let html = readFileSync(htmlPath, 'utf8');
const scriptTagRe = /<script defer src="(assets\/js\/[^"?]+)(?:\?[^"]*)?">\s*<\/script>\n?/g;
const localTags = [...html.matchAll(scriptTagRe)];
const SPLIT_AFTER = 'assets/js/core/database.js';

if (localTags.length) {
  const splitIndex = localTags.findIndex(m => m[1] === SPLIT_AFTER);
  const groups = splitIndex === -1
    ? [localTags]
    : [localTags.slice(0, splitIndex + 1), localTags.slice(splitIndex + 1)];

  let replacement = '';
  for (const [i, group] of groups.entries()) {
    if (!group.length) continue;
    // Semicolon-joined so a statement missing its own trailing semicolon in
    // one file can never merge with a leading `(` or `[` at the start of the next.
    const bundleSrc = group.map(m => readFileSync(join(OUT, m[1]), 'utf8')).join(';\n');
    const hash = createHash('sha1').update(bundleSrc).digest('hex').slice(0, 10);
    const name = `bundle${i + 1}.js`;
    writeFileSync(join(OUT, 'assets', 'js', name), bundleSrc);
    replacement += `<script defer src="assets/js/${name}?v=${hash}"></script>\n`;
    console.log(`Combined ${group.length} local scripts -> assets/js/${name}?v=${hash} (${(bundleSrc.length / 1024).toFixed(1)} KB)`);
  }

  const first = localTags[0].index;
  const last = localTags.at(-1);
  const end = last.index + last[0].length;
  html = html.slice(0, first) + replacement + html.slice(end);
  writeFileSync(htmlPath, html);
}
