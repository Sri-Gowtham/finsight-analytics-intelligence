const http = require('http');

const req = http.request(`http://localhost:8081/api/auth/login`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:8081',
    'Referer': 'http://localhost:8081/login',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(`Response:`, res.statusCode, body.substring(0, 100)));
});
req.on('error', err => console.log(`Error:`, err.message));
req.write(JSON.stringify({ email: 'admin@finsight.demo', password: 'demo1234' }));
req.end();
