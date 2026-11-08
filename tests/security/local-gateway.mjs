import http from 'node:http';

// Local synthetic test fixture only. Never proxy to a production project.
http.createServer((request, response) => {
  if (!request.url.startsWith('/rest/v1/')) {
    response.writeHead(503, { 'Content-Type': 'application/json' });
    response.end('{"message":"Storage unavailable in the local database fixture"}');
    return;
  }
  const upstream = http.request({ hostname: '127.0.0.1', port: 55433,
    path: request.url.slice('/rest/v1'.length), method: request.method, headers: request.headers }, reply => {
    response.writeHead(reply.statusCode, reply.headers);
    reply.pipe(response);
  });
  upstream.on('error', () => { response.writeHead(503); response.end(); });
  request.pipe(upstream);
}).listen(55434, '127.0.0.1', () => console.log('Synthetic database gateway listening on loopback only.'));
