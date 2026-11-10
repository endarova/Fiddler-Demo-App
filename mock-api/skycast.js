// SkyCast Weather API — local stand-in for a third-party service the developer does not own.
import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.SKYCAST_PORT ?? 4001);
const VALID_KEY = 'skc_demo_7f3a9e2b41c84d06';

const FORECASTS = {
  sofia: { name: 'Sofia', country: 'BG', days: [[14, 6, 'Partly cloudy'], [16, 7, 'Sunny'], [12, 5, 'Light rain']] },
  london: { name: 'London', country: 'GB', days: [[11, 7, 'Overcast'], [12, 8, 'Showers'], [13, 8, 'Cloudy']] },
  'cape town': { name: 'Cape Town', country: 'ZA', days: [[24, 15, 'Sunny'], [22, 14, 'Windy'], [25, 16, 'Sunny']] },
  'new york': { name: 'New York', country: 'US', days: [[9, 2, 'Clear'], [11, 4, 'Partly cloudy'], [8, 1, 'Rain']] },
  tokyo: { name: 'Tokyo', country: 'JP', days: [[18, 11, 'Sunny'], [17, 12, 'Cloudy'], [19, 13, 'Sunny']] },
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Request-Id': `req_${randomUUID().slice(0, 12)}`,
    'X-RateLimit-Limit': '1000',
    'X-RateLimit-Remaining': '998',
    ...headers,
  });
  res.end(JSON.stringify(body, null, 2));
}

function authenticate(req, res) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    send(res, 401, { error: 'unauthorized', message: 'Missing or invalid credentials.' }, {
      'WWW-Authenticate': 'Bearer realm="skycast-api", error="invalid_request"',
    });
    return false;
  }
  if (token !== VALID_KEY) {
    send(res, 401, { error: 'unauthorized', message: 'Missing or invalid credentials.' }, {
      'WWW-Authenticate': 'Bearer realm="skycast-api", error="invalid_token"',
    });
    return false;
  }
  return true;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

  if (req.method !== 'GET' || url.pathname !== '/v1/forecast') {
    return send(res, 404, { error: 'not_found', message: 'Unknown endpoint.' });
  }
  if (!authenticate(req, res)) return;

  const city = FORECASTS[(url.searchParams.get('city') ?? '').trim().toLowerCase()];
  if (!city) {
    return send(res, 404, { error: 'city_not_found', message: 'No forecast available for that city.' });
  }

  const units = url.searchParams.get('units') === 'imperial' ? 'imperial' : 'metric';
  const toUnits = (c) => (units === 'imperial' ? Math.round(c * 9 / 5 + 32) : c);
  const start = new Date();

  send(res, 200, {
    location: { name: city.name, country: city.country },
    units,
    forecast: city.days.map(([high, low, summary], i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return { date: date.toISOString().slice(0, 10), high: toUnits(high), low: toUnits(low), summary };
    }),
  });
});

server.listen(PORT, () => {
  console.log(`SkyCast mock API listening on http://localhost:${PORT}`);
});
