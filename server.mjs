import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mp4':'video/mp4','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf'};
http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    const data = await readFile(file);
    res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream','Content-Length':data.length,'Cache-Control':'no-cache'});
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(Number(process.env.PORT || 4174), '127.0.0.1', () => console.log(`http://localhost:${process.env.PORT || 4174}`));
