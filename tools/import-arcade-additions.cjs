// Incremental import: preserve existing catalog entries and game files.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..'), audit = [];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function walk(dir) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e => {
    const file=path.join(dir,e.name);
    return e.isDirectory() ? (['template','tools','node_modules','.git'].includes(e.name)?[]:walk(file)) : [file];
  });
}
function copy(source,destination) {
  const original=fs.readFileSync(source), target=path.join(root,destination);
  let bytes=original;
  // Approved website-copy-only repair: the numeric radar tile size shadowed
  // the text drawing helper, causing a TypeError on every gameplay frame.
  if(destination==='assets/retro-arcade/games/grand-theft-sloth/js/hud.js') {
    let text=original.toString('utf8');
    for(const [from,to] of [
      ['const p = Player.ped, T = City.T;', 'const p = Player.ped, tileSize = City.T;'],
      ['const px = p.x / T, py = p.y / T;', 'const px = p.x / tileSize, py = p.y / tileSize;'],
      ['let dx = wx / T - px, dy = wy / T - py;', 'let dx = wx / tileSize - px, dy = wy / tileSize - py;']
    ]) {if(!text.includes(from))throw Error('Unexpected radar source');text=text.replace(from,to)}
    bytes=Buffer.from(text);
  }
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  audit.push({source,file:destination,sourceSha256:hash(original),sha256:hash(bytes)});
}
async function thumbnail(source,file,width,height) {
  const dest=path.join(root,file);fs.mkdirSync(path.dirname(dest),{recursive:true});
  await sharp(source).resize({width,height,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toFile(dest);
  const info=await sharp(dest).metadata();return{image:'./'+file,width:info.width,height:info.height};
}
function merge(catalog,entry) {
  const index=catalog.findIndex(e=>e.id===entry.id);
  if(index<0)catalog.push(entry);else catalog[index]=entry;
}
(async()=>{
  const handheld=JSON.parse(fs.readFileSync(path.join(root,'assets/handhelds/catalog.json')));
  for(const [folder,id,title] of [
    ['Sloth Kart Racing','sloth-kart-racing','Sloth Kart Racing'],
    ['Star Sloth 69','star-sloth-69','Star Sloth 69'],
    ['The Legend of EmCee','the-legend-of-emcee','The Legend of Emcee']
  ]) {
    const files=walk(path.join('C:/Retro Handhelds/Fake Game Boy Hits',folder));
    const portable=files.filter(f=>/portable\.html$/i.test(f));
    if(portable.length!==1)throw Error(folder+': ambiguous portable');
    const html=fs.readFileSync(portable[0],'utf8');
    const art=files.filter(f=>/handheld[^/\\]*\.png$/i.test(f)).find(f=>html.includes(fs.readFileSync(f).toString('base64')));
    if(!art)throw Error(folder+': missing embedded handheld artwork');
    const base='assets/handhelds/'+id;
    copy(portable[0],base+'/index.html');
    merge(handheld,{id,title,...await thumbnail(art,base+'/thumbnail.webp',480,360),url:'./'+base+'/index.html'});
  }
  const arcade=JSON.parse(fs.readFileSync(path.join(root,'assets/retro-arcade/catalog.json')));
  for(const [folder,id,playable] of [['Grand Theft Sloth','grand-theft-sloth',true],['The Sloth King','the-sloth-king',true],['Sleavis and Slutthead Do America','sleavis-and-slutthead-do-america',false]]) {
    const source=path.join('C:/Retro Arcade',folder);
    const art=path.join(source,playable?'assets/title.png':'Sloth Road Trip_ Press Start.png');
    if(playable){
      const queue=['index.html'],seen=new Set();
      while(queue.length){
        const relative=queue.shift();if(seen.has(relative))continue;seen.add(relative);
        const original=path.resolve(source,relative);
        if(!original.startsWith(path.resolve(source)+path.sep))throw Error('Invalid source path');
        copy(original,'assets/retro-arcade/games/'+id+'/'+relative);
        const text=fs.readFileSync(original,'utf8');
        if(relative==='index.html')for(const match of text.matchAll(/(?:src|href)=["']([^"']+)["']/g))queue.push(match[1]);
        if(/\.(js|css)$/.test(relative))for(const match of text.matchAll(/["'](assets\/[^"']+)["']/g))queue.push(match[1]);
      }
    }
    merge(arcade,{id,title:folder,...await thumbnail(art,'assets/retro-arcade/art/'+id+'.webp',640,480),url:playable?'./assets/retro-arcade/games/'+id+'/index.html':null});
  }
  for(const [file,entries] of [['assets/handhelds/catalog.json',handheld],['assets/retro-arcade/catalog.json',arcade]]){
    if(new Set(entries.map(e=>e.id)).size!==entries.length)throw Error('Duplicate entries');
    fs.writeFileSync(path.join(root,file),JSON.stringify(entries,null,2)+'\n');
  }
  fs.writeFileSync(path.join(root,'verification/arcade-additions-source.json'),JSON.stringify(audit,null,2)+'\n');
  console.log(`${handheld.length} handhelds; ${arcade.filter(g=>g.url).length} playable arcade games + ${arcade.filter(g=>!g.url).length} Coming Soon. ${audit.length} files imported; only the approved radar variable rename differs from source.`);
})().catch(e=>{console.error(e);process.exitCode=1});
