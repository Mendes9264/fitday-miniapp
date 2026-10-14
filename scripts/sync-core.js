const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const name of ['core.js']) {
  const target = path.join(root, 'miniprogram', 'utils', name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, 'shared', name), target);
  console.log(`Shared logic copied to miniprogram/utils/${name}`);
}
