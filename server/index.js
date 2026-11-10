import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));

const STATIC_FILES = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/skycast-client.js': ['skycast-client.js', 'text/javascript; charset=utf-8'],
  '/config.js': ['config.js', 'text/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

  const file = req.method === 'GET' && STATIC_FILES[url.pathname];
  if (file) {
    const [name, type] = file;
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    return res.end(await readFile(PUBLIC_DIR + name));
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Trip Planner running on http://localhost:${PORT}`);
});
