import http from 'node:http';

// Sends outbound requests through HTTP_PROXY (e.g. Fiddler on :8866) when set, so they can be captured.
export function httpGet(url, { headers = {} } = {}) {
  const target = new URL(url);
  const proxy = process.env.HTTP_PROXY ? new URL(process.env.HTTP_PROXY) : null;

  const options = proxy
    ? { host: proxy.hostname, port: proxy.port, path: target.href, headers: { ...headers, Host: target.host } }
    : { host: target.hostname, port: target.port, path: target.pathname + target.search, headers };

  return new Promise((resolve, reject) => {
    const req = http.request({ method: 'GET', ...options }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () =>
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          headers: res.headers,
          json: async () => JSON.parse(body),
        }),
      );
    });
    req.on('error', reject);
    req.end();
  });
}
