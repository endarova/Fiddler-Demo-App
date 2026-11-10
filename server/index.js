import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getForecast } from './skycast-client.js';

const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));

const STATIC_FILES = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/api/forecast') {
    const city = url.searchParams.get('city');
    if (!city) return sendJson(res, 400, { error: 'City is required.' });

    try {
      const data = await getForecast(city);
      return sendJson(res, 200, data);
    } catch (err) {
      console.error('Failed to load forecast:', err.message);
      return sendJson(res, 502, { error: 'Unable to load forecast right now.' });
    }
  }

  const file = req.method === 'GET' && STATIC_FILES[url.pathname];
  if (file) {
    const [name, type] = file;
    res.writeHead(200, { 'Content-Type': type });
    return res.end(await readFile(PUBLIC_DIR + name));
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  const via = process.env.HTTP_PROXY ? ` (outbound via ${process.env.HTTP_PROXY})` : '';
  console.log(`Trip Planner running on http://localhost:${PORT}${via}`);
});
