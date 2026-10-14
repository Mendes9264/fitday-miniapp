const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
fs.mkdirSync(path.join(dist, 'web'), { recursive: true });
fs.mkdirSync(path.join(dist, 'shared'), { recursive: true });
for (const relative of ['web/styles.css', 'web/logo.png', 'web/app.js', 'web/dish-catalog.js', 'web/model-gateway.js', 'shared/core.js', 'shared/local-backup.js', 'shared/exercise-energy.js']) {
  fs.copyFileSync(path.join(root, relative), path.join(dist, relative));
}
const html = fs.readFileSync(path.join(root, 'web/index.html'), 'utf8')
  .replaceAll('src="/', 'src="./')
  .replaceAll('href="/', 'href="./');
for (const relative of ['shared/gateway.js', 'bridge.js', 'web/ai-estimator.js']) {
  fs.rmSync(path.join(dist, relative), { force: true });
}
fs.writeFileSync(path.join(dist, 'index.html'), html);
process.stdout.write(`Android web assets ready: ${dist}\n`);
