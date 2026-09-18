import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('out');
const prefix = '/halloween-assortment-ai-dashboard';
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (!pathname.startsWith(prefix + '/')) throw new Error('Not found');
      let file = path.resolve(root, '.' + pathname.slice(prefix.length));
      if (!file.startsWith(root + '/') && file !== root) throw new Error('Not found');
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.end(await fs.readFile(file));
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  })
  .listen(3200, '127.0.0.1');
