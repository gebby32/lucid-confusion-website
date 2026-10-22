// Package tracked website files and inject the public Storefront configuration.
// Never print the token or add the generated configuration to Git.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.resolve(root, process.argv[2] || '.pages-site');
const relativeOutput = path.relative(root, output);
if (!relativeOutput || relativeOutput.startsWith('..') || path.isAbsolute(relativeOutput)) {
  throw new Error('The output must be a dedicated directory within this checkout.');
}
if (fs.existsSync(output) && fs.readdirSync(output).length) {
  throw new Error('The output directory must be empty.');
}
const token = process.env.FOURTHWALL_STOREFRONT_TOKEN?.trim();
if (!token || !/^ptkn_[A-Za-z0-9-]+$/.test(token)) {
  throw new Error('Configure the FOURTHWALL_STOREFRONT_TOKEN repository secret before publishing.');
}
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const files = tracked.filter(file => {
  if (file.startsWith('.') && file !== '.nojekyll') return false;
  if (/^(verification|tools)\//.test(file)) return false;
  if (!file.includes('/') && file.endsWith('.md')) return false;
  return file !== 'merch-config.example.json' && file !== 'merch-config.json';
});
for (const required of ['index.html', 'arcade.js', 'router.js', 'merch-shop.js', 'merch-shop.css', 'merch-api.js', 'merch-shop/view/index.html', 'assets/arcade/art/1 Merch Shop (widescreen).png']) {
  if (!files.includes(required)) throw new Error('Missing tracked site file: ' + required);
}
fs.mkdirSync(output, { recursive: true });
let bytes = 0;
for (const file of files) {
  const source = path.join(root, file), target = path.join(output, file);
  const info = fs.lstatSync(source);
  if (!info.isFile()) throw new Error('Only ordinary files can be published: ' + file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  bytes += info.size;
}
fs.writeFileSync(path.join(output, 'merch-config.json'), JSON.stringify({ storefrontToken: token }) + '\n');
console.log(`Prepared ${files.length + 1} website files (${(bytes / 1024 / 1024).toFixed(1)} MiB); storefront configuration supplied securely.`);
