// This script bumps the CACHE_VERSION in sw.js automatically on every build.
// Usage: Add to your build process (e.g., npm run build) as a prebuild or postbuild step.

const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, 'public', 'sw.js');

let swContent = fs.readFileSync(swPath, 'utf8');

const versionRegex = /const CACHE_VERSION = '(.*?)'/;
const match = swContent.match(versionRegex);

if (match) {
  const oldVersion = match[1];
  // Use current timestamp for unique version
  const newVersion = 'v' + Date.now();
  swContent = swContent.replace(versionRegex, `const CACHE_VERSION = '${newVersion}'`);
  fs.writeFileSync(swPath, swContent);
  console.log(`CACHE_VERSION bumped: ${oldVersion} -> ${newVersion}`);
} else {
  console.error('CACHE_VERSION not found in sw.js');
}
