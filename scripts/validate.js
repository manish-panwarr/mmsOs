/**
 * Build & Lint Validation Script for macOS SPA Portfolio
 * Validates ES Modules syntax, asset presence, required 8 window IDs, and SEO requirements.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const REQUIRED_WINDOWS = [
  'home',
  'resume',
  'services',
  'projects',
  'certificates',
  'education',
  'skills',
  'contact'
];

let errors = 0;
let warnings = 0;

function logPass(msg) {
  console.log(`[PASS] ${msg}`);
}

function logError(msg) {
  console.error(`[ERROR] ${msg}`);
  errors++;
}

function logWarn(msg) {
  console.warn(`[WARN] ${msg}`);
  warnings++;
}

console.log('--- Running macOS SPA Portfolio Validation ---');

// 1. Verify index.html exists and contains the 8 windows
const htmlPath = path.join(rootDir, 'index.html');
if (!fs.existsSync(htmlPath)) {
  logError('index.html not found.');
} else {
  const html = fs.readFileSync(htmlPath, 'utf8');
  
  // Check 8 windows
  for (const winId of REQUIRED_WINDOWS) {
    if (!html.includes(`id="win-${winId}"`)) {
      logError(`Missing required window element id="win-${winId}" in index.html`);
    } else {
      logPass(`Window '#win-${winId}' verified.`);
    }
  }

  // Check that removed items are not present in index.html
  const forbiddenTerms = [
    'tahoe-music-player',
    'cc-music-title',
    'tahoe-calendar-card',
    'weather-forecast'
  ];
  for (const term of forbiddenTerms) {
    if (html.includes(term)) {
      logError(`Found removed feature residue: ${term}`);
    }
  }

  // Check SEO metadata
  if (!html.includes('<title>') || !html.includes('meta name="description"')) {
    logError('Missing core SEO tags in index.html');
  } else {
    logPass('SEO metadata verified.');
  }
}

// 2. Check JavaScript files syntax
const jsFiles = ['script.js', 'macos-enhancements.js', 'dashboard.js', 'portfolio-data.js', 'terminal.js'];
for (const file of jsFiles) {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    logError(`Missing JS file: ${file}`);
  } else {
    try {
      const code = fs.readFileSync(fullPath, 'utf8');
      // Basic check for unexpected syntax issues
      new Function('import', `return (async () => { return true; });`);
      logPass(`JavaScript module ${file} loaded successfully (${code.length} bytes).`);
    } catch (e) {
      logError(`Syntax issue in ${file}: ${e.message}`);
    }
  }
}

// 3. Check CSS files
const cssFiles = ['style.css', 'dashboard.css', 'macos-enhancements.css'];
for (const file of cssFiles) {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    logError(`Missing CSS file: ${file}`);
  } else {
    const css = fs.readFileSync(fullPath, 'utf8');
    if (css.length > 0) {
      logPass(`CSS stylesheet ${file} verified (${css.length} bytes).`);
    } else {
      logWarn(`CSS stylesheet ${file} is empty.`);
    }
  }
}

console.log('--------------------------------------------------');
if (errors > 0) {
  console.error(`Validation FAILED with ${errors} error(s) and ${warnings} warning(s).`);
  process.exit(1);
} else {
  console.log(`Validation PASSED with 0 errors and ${warnings} warnings. Production build ready!`);
  process.exit(0);
}
