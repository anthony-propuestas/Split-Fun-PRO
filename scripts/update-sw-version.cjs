const fs = require('fs');

const swPath = 'dist/sw.js';
if (!fs.existsSync(swPath)) {
  console.warn('[update-sw-version] dist/sw.js not found, skipping.');
  process.exit(0);
}

const version = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const content = fs.readFileSync(swPath, 'utf8');
const updated = content.replace(/splitfun-[\w-]+/, `splitfun-${version}`);
fs.writeFileSync(swPath, updated);
console.log(`[update-sw-version] Cache name updated to splitfun-${version}`);
