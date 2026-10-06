const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.js':'text/javascript', '.html':'text/html', '.css':'text/css', '.png':'image/png', '.glb':'model/gltf-binary' };
http.createServer((req,res)=> {
 let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
 try { if(fs.statSync(file).isDirectory()) file=path.join(file,'index.html'); res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream'); fs.createReadStream(file).pipe(res); }
 catch {res.writeHead(404).end('Not found');}
}).listen(8771,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:8771'));
