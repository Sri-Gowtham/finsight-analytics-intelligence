const http = require('http');
function testHost(host) {
  const h = host === '::1' ? '[::1]' : host;
  const req = http.request(`http://${h}:8081/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => console.log(`[PROXY VIA ${host}] Response:`, res.statusCode, body.substring(0, 100)));
  });
  req.on('error', err => console.log(`[PROXY VIA ${host}] Error:`, err.message));
  req.write(JSON.stringify({ email: 'admin@finsight.demo', password: 'demo1234' }));
  req.end();
}
testHost('localhost');
testHost('127.0.0.1');
