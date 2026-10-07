const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const sharp = require('sharp');
const source = process.argv[2];
if (!source) throw new Error('Pass the original Retro Arcade source directory.');
const root = path.resolve(__dirname, '../assets/retro-arcade');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
(async () => {
  const catalog = [], inventory = [];
  fs.mkdirSync(path.join(root, 'art'), { recursive: true });
  for (const [from, to] of [['Futuristic Retro Arcade Frame.png', 'frame.png'], ['Neon Back to Arcade Button.png', 'back.png']]) {
    fs.copyFileSync(path.join(source, from), path.join(root, 'art', to));
    inventory.push({ source: from, file: `art/${to}`, sha256: hash(fs.readFileSync(path.join(source, from))) });
  }
  for (const entry of fs.readdirSync(source, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
    const dir = path.join(source, entry.name), id = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const playable = fs.existsSync(path.join(dir, 'index.html'));
    const titleFile = playable ? path.join(dir, 'assets/title.png') : path.join(dir, 'Grand Theft Sloth - title screen.png');
    const thumbnail = `art/${id}.webp`;
    await sharp(titleFile).resize({ width: 640, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toFile(path.join(root, thumbnail));
    const metadata = await sharp(path.join(root, thumbnail)).metadata();
    catalog.push({ id, title: entry.name, image: `./assets/retro-arcade/${thumbnail}`, width: metadata.width, height: metadata.height, url: playable ? `./assets/retro-arcade/games/${id}/index.html` : null });
    if (!playable) continue;
    const queue = ['index.html'], visited = new Set();
    while (queue.length) {
      const relative = queue.shift();
      if (visited.has(relative)) continue;
      visited.add(relative);
      const original = path.resolve(dir, relative);
      if (!original.startsWith(path.resolve(dir) + path.sep)) throw new Error('Path outside source game');
      const bytes = fs.readFileSync(original), dest = `games/${id}/${relative}`;
      fs.mkdirSync(path.dirname(path.join(root, dest)), { recursive: true });
      fs.copyFileSync(original, path.join(root, dest));
      inventory.push({ source: `${entry.name}/${relative}`, file: dest, sha256: hash(bytes) });
      if (relative === 'index.html') {
        for (const match of bytes.toString().matchAll(/(?:src|href)=["']([^"']+)["']/g)) queue.push(match[1]);
      }
      if (/\.(js|css)$/.test(relative)) {
        for (const match of bytes.toString().matchAll(/["'](assets\/[^"']+)["']/g)) queue.push(match[1]);
      }
    }
  }
  // Playable games first, with Coming Soon last.
  catalog.sort((a, b) => Number(!!b.url) - Number(!!a.url));
  fs.writeFileSync(path.join(root, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  fs.writeFileSync(path.resolve(__dirname, '../verification/retro-arcade-source.json'), JSON.stringify(inventory, null, 2) + '\n');
  console.log(`${catalog.filter(game => game.url).length} playable games, ${catalog.filter(game => !game.url).length} Coming Soon; ${inventory.length} unchanged source files copied.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
