#!/usr/bin/env node
/**
 * Kivora Learning Build Script
 *
 * Commands:
 *   npm run dev    — Extract inline assets from index.html, rewrite HTML
 *   npm run build  — Minify assets/ + HTML → dist/
 *
 * Workflow:
 *   1. First run: `npm run dev`  — extracts CSS/JS from index.html into assets/
 *   2. Every deploy: `npm run build` — reads assets/, minifies, outputs dist/
 */

const fs = require('fs');
const path = require('path');

const isDev = process.argv.includes('--dev');
const mode = isDev ? 'dev' : 'production';
console.log(`\n\x1b[36m Kivora Build (%s mode)\x1b[0m`, mode);

const ROOT = __dirname;
const ASSETS_DIR = path.join(ROOT, 'assets');
const DIST_DIR = path.join(ROOT, 'dist');

function read(f) { return fs.readFileSync(path.resolve(ROOT, f), 'utf8'); }
function write(f, c) { fs.writeFileSync(path.resolve(ROOT, f), c, 'utf8'); }
function findBlocks(content, openTag) {
  const blocks = [];
  let pos = 0;
  while (true) {
    const s = content.indexOf(`<${openTag}`, pos);
    if (s === -1) break;
    const e = content.indexOf(`</${openTag}>`, s + 1);
    if (e === -1) break;
    const tagEnd = content.indexOf('>', s + openTag.length + 1);
    if (tagEnd === -1 || tagEnd > e) break;
    blocks.push({ start: s, end: e + openTag.length + 3, contentStart: tagEnd + 1, contentEnd: e, tagContent: content.slice(s, tagEnd + 1) });
    pos = e + openTag.length + 3;
  }
  return blocks;
}

/* ═══════════════════════════════════════════
   DEV MODE: Extract inline assets from all HTML files
   ═══════════════════════════════════════════ */
if (isDev) {
  // Step 1: Extract all CSS from ALL HTML files into style.css
  console.log('\n\x1b[33m1/4\x1b[0m Extracting inline CSS from all HTML files...');
  const allHtmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !f.startsWith('_'));
  let allCss = '';

  for (const file of allHtmlFiles) {
    const content = read(file);
    const styleBlocks = findBlocks(content, 'style');
    for (const block of styleBlocks) {
      const css = content.slice(block.contentStart, block.contentEnd).trim();
      if (css) {
        allCss += (allCss ? '\n\n' : '') + css;
        console.log('  \x1b[32m\xe2\x9c\x85\x1b[0m %s \u2192 style.css (%d bytes)', file, css.length);
      }
    }
  }

  write('assets/style.css', allCss);
  console.log('  \x1b[32m\xe2\x9c\x93\x1b[0m Combined CSS \u2192 assets/style.css (%d bytes total)', allCss.length);

  // Step 2: Extract scripts from index.html
  console.log('\n\x1b[33m2/4\x1b[0m Extracting inline scripts from index.html...');
  const idxHtml = read('index.html');
  const scriptBlocks = findBlocks(idxHtml, 'script');
  const styleBlocks = findBlocks(idxHtml, 'style');
  const lastStyleEnd = styleBlocks.length > 0 ? styleBlocks[styleBlocks.length - 1].end : 0;
  const postStyleScripts = scriptBlocks.filter(b => b.start > lastStyleEnd);
  if (postStyleScripts.length === 0) { console.error('No <script> blocks found!'); process.exit(1); }

  const script1 = postStyleScripts[0];
  const script1Content = idxHtml.slice(script1.contentStart, script1.contentEnd);
  write('assets/app.js', `// Kivora SPA \u2014 Data + Application Logic\n${script1Content}`);
  console.log('  \x1b[32m\xe2\x9c\x85\x1b[0m Extracted SPA JS  \u2192 assets/app.js (%d bytes)', script1Content.length);

  if (postStyleScripts.length > 1) {
    const script2 = postStyleScripts[1];
    const script2Content = idxHtml.slice(script2.contentStart, script2.contentEnd);
    write('assets/activities.js', `// Kivora Activity Player \u2014 Data + Engine\n${script2Content}`);
    console.log('  \x1b[32m\xe2\x9c\x85\x1b[0m Extracted Activity JS \u2192 assets/activities.js (%d bytes)', script2Content.length);
  }

  // Step 3: Rewrite index.html
  console.log('\n\x1b[33m3/4\x1b[0m Rewriting index.html...');
  const firstStyle = styleBlocks[0];
  const parts = [
    idxHtml.slice(0, firstStyle.start),
    `<link rel="stylesheet" href="assets/style.css" />\n`,
    idxHtml.slice(firstStyle.end, script1.start),
    '<script src="assets/app.js"></script>\n',
  ];
  if (postStyleScripts.length > 1) {
    const script2 = postStyleScripts[1];
    parts.push(idxHtml.slice(script1.end, script2.start));
    parts.push('<script src="assets/activities.js"></script>\n');
    parts.push(idxHtml.slice(script2.end));
  } else {
    parts.push(idxHtml.slice(script1.end));
  }
  write('index.html', parts.join(''));
  console.log('  \x1b[32m\xe2\x9c\x85\x1b[0m index.html uses external assets');

  // Step 4: Process other HTML files — remove inline <style> and <script>, add CSS link
  console.log('\n\x1b[33m4/4\x1b[0m Processing other HTML files...');
  const otherHtml = allHtmlFiles.filter(f => f !== 'index.html');
  for (const file of otherHtml) {
    let content = read(file);
    const origLen = content.length;

    // Remove inline <style> blocks (CSS already extracted to style.css)
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');

    // Remove inline <script> blocks (without src=)
    content = content.replace(/<script>[\s\S]*?<\/script>/g, '');

    // Collapse excessive blank lines
    content = content.replace(/\n{3,}/g, '\n\n');

    // Add external CSS link if missing
    if (!content.includes('assets/style.css') && content.includes('</head>')) {
      content = content.replace('</head>', '  <link rel="stylesheet" href="assets/style.css" />\n</head>');
    }

    // Add activities.js for activity player
    if (file === 'kivora-activity-player.html' && !content.includes('assets/activities.js')) {
      content = content.replace('</body>', '  <script src="assets/activities.js"></script>\n</body>');
    }

    write(file, content);
    console.log('  \x1b[32m\xe2\x9c\x85\x1b[0m %s \u2014 cleaned (%d bytes saved)', file, origLen - content.length);
  }

  console.log('\n\x1b[36m Dev mode complete. Source files now use external assets.\x1b[0m');
  console.log('   Open index.html in a browser to verify.');

/* ═══════════════════════════════════════════
   PRODUCTION MODE: Minify from assets/ → dist/
   ═══════════════════════════════════════════ */
} else {
  console.log('\n\x1b[33m1/4\x1b[0m Reading assets from assets/ directory...');
  fs.mkdirSync(path.join(DIST_DIR, 'assets'), { recursive: true });

  let htmlMinifier, CleanCSS, terser;
  try {
    htmlMinifier = require('html-minifier');
    CleanCSS = require('clean-css');
    terser = require('terser');
  } catch (e) {
    console.warn('  \x1b[33m\xe2\x9a\xa0\xef\xb8\x8f\x1b[0m Build deps not found. Run: npm install');
  }

  if (!htmlMinifier || !CleanCSS || !terser) {
    console.warn('  \x1b[33m\xe2\x9a\xa0\xef\xb8\x8f\x1b[0m Falling back to copy without minification.');
    fs.cpSync(ROOT, DIST_DIR, { recursive: true, filter: (src) => !src.includes('node_modules') && !src.includes('dist') });
    process.exit(0);
  }

  // Minify CSS
  console.log('\n\x1b[33m2/4\x1b[0m Minifying CSS & JS...');
  if (fs.existsSync(path.join(ASSETS_DIR, 'style.css'))) {
    const cssRaw = read('assets/style.css');
    const cssMin = new CleanCSS({ level: 2 }).minify(cssRaw);
    fs.writeFileSync(path.join(DIST_DIR, 'assets', 'style.css'), cssMin.styles);
    console.log('  \x1b[32m\xe2\x9c\x85\x1b[0m style.css minified (%d \u2192 %d bytes)', cssRaw.length, cssMin.styles.length);
  }

  // Minify JS
  async function minifyAsset(file, destRel) {
    if (!fs.existsSync(path.join(ASSETS_DIR, file))) return;
    const src = read(`assets/${file}`);
    const r = await terser.minify(src, { compress: { drop_console: false }, mangle: true, output: { comments: false } });
    if (r.error) throw r.error;
    fs.writeFileSync(path.join(DIST_DIR, 'assets', destRel || file), r.code);
    console.log('  \x1b[32m\xe2\x9c\x85\x1b[0m %s minified (%d \u2192 %d bytes)', file, src.length, r.code.length);
  }

  (async () => {
    await minifyAsset('app.js');
    await minifyAsset('activities.js');

    // Minify shared.js
    if (fs.existsSync(path.join(ROOT, 'shared.js'))) {
      const shared = read('shared.js');
      const r = await terser.minify(shared, { compress: true, mangle: true });
      fs.writeFileSync(path.join(DIST_DIR, 'shared.js'), r.code);
      console.log('  \x1b[32m\xe2\x9c\x85\x1b[0m shared.js minified (%d \u2192 %d bytes)', shared.length, r.code.length);
    }

    // Minify HTML
    console.log('\n\x1b[33m3/4\x1b[0m Minifying HTML...');
    const allHtml = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !f.startsWith('_'));
    for (const file of allHtml) {
      let html = read(file);
      const min = htmlMinifier.minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
      });
      fs.writeFileSync(path.join(DIST_DIR, file), min);
      console.log('  \x1b[32m\xe2\x9c\x85\x1b[0m %s minified (%d \u2192 %d bytes)', file, html.length, min.length);
    }

    console.log('\n\x1b[36m Build complete! Output in: %s\x1b[0m', DIST_DIR);
  })();
}
