// Run with: node tools/import-handhelds.cjs <source-directory>
// Requires sharp for small, aspect-preserving selection thumbnails.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const source = process.argv[2];
if (!source) throw new Error('Pass the source games directory. Originals are read only.');
const destination = path.resolve(__dirname, '../assets/handhelds');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? (['node_modules', '.git', 'template', 'tools'].includes(entry.name) ? [] : walk(file)) : [file];
  });
}
(async () => {
  const games = [];
  const audit = [];
  for (const folder of fs.readdirSync(source, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
    const portable = walk(path.join(source, folder.name)).filter(file => /portable\.html$/i.test(file));
    if (portable.length !== 1) throw new Error(`${folder.name}: expected one finished portable build; found ${portable.length}`);
    const file = portable[0], bytes = fs.readFileSync(file), html = bytes.toString('utf8');
    const title = html.match(/<title>(.*?)<\/title>/is)?.[1];
    if (!title) throw new Error(`${folder.name}: missing title`);
    // Match the console asset against the bytes embedded in the portable build,
    // avoiding unused reference art and alternate console designs.
    const images = walk(path.join(path.dirname(file), 'assets')).filter(candidate => /handheld[^/\\]*\.png$/i.test(candidate));
    const image = images.find(candidate => html.includes(fs.readFileSync(candidate).toString('base64')));
    if (!image) throw new Error(`${title}: no matching embedded console image`);
    const id = folder.name.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const dir = path.join(destination, id);
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(file, path.join(dir, 'index.html'));
    await sharp(image).resize({ width: 480, height: 360, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toFile(path.join(dir, 'thumbnail.webp'));
    const dimensions = await sharp(path.join(dir, 'thumbnail.webp')).metadata();
    games.push({ id, title, image: `./assets/handhelds/${id}/thumbnail.webp`, width: dimensions.width, height: dimensions.height, url: `./assets/handhelds/${id}/index.html` });
    audit.push(`| ${folder.name} | ${title} | ${id}/index.html | ${hash(bytes)} |`);
  }
  fs.writeFileSync(path.join(destination, 'catalog.json'), JSON.stringify(games, null, 2) + '\n');
  fs.writeFileSync(path.resolve(__dirname, '../HANDHELD-IMPORT.md'), '# Retro Handheld import\n\nPortable HTML files are copied byte-for-byte. Thumbnails use the exact console image embedded in each build, reduced without cropping. Pink Rampage retains its original Three.js CDN imports; those load only when that game opens.\n\n| Source folder | Game title | Published file (under assets/handhelds) | Portable SHA-256 |\n| --- | --- | --- | --- |\n' + audit.join('\n') + '\n');
  console.log(`Imported ${games.length} portable games and thumbnails.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
