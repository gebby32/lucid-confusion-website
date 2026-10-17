const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.js':'text/javascript', '.html':'text/html', '.css':'text/css', '.png':'image/png', '.glb':'model/gltf-binary', '.mp4':'video/mp4' };
http.createServer((req,res)=> {
 let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
 try { if(fs.statSync(file).isDirectory()) {
   const url = new URL(req.url,'http://localhost');
   if (!url.pathname.endsWith('/')) { res.writeHead(301,{Location:url.pathname+'/'+url.search}).end(); return; }
   file=path.join(file,'index.html');
 } res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
 if (path.extname(file) === '.mp4') {
   const size = fs.statSync(file).size;
   res.setHeader('Accept-Ranges','bytes');
   if (req.headers.range) {
     const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
     const start = match?.[1] ? Number(match[1]) : Math.max(0,size-Number(match?.[2]));
     const end = match?.[1] && match[2] ? Math.min(Number(match[2]),size-1) : size-1;
     if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) { res.writeHead(416,{'Content-Range':`bytes */${size}`}).end(); return; }
     res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});
     if (req.method === 'HEAD') res.end(); else fs.createReadStream(file,{start,end}).pipe(res);
     return;
   }
   res.setHeader('Content-Length',size);
 }
 if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res); }
 catch {res.writeHead(404).end('Not found');}
}).listen(Number(process.env.PORT || 8771),'127.0.0.1',()=>console.log('Preview port: '+(process.env.PORT || 8771)));
