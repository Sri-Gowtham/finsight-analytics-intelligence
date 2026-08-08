const http = require('http');
const accounts = [
  { email: 'admin@finsight.demo', role: 'Admin' },
  { email: 'cfo@finsight.demo', role: 'CFO' },
  { email: 'analyst@finsight.demo', role: 'Analyst' }
];

async function testLogin(email) {
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:8081/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(JSON.stringify({ email, password: 'demo1234' }));
    req.end();
  });
}

(async () => {
  for (const acc of accounts) {
    try {
      const res = await testLogin(acc.email);
      const data = JSON.parse(res.body);
      if (res.status === 200 && data.token) {
        console.log(`✓ ${acc.role} (${acc.email}): HTTP ${res.status} OK - Valid JWT received`);
      } else {
        console.log(`✗ ${acc.role} (${acc.email}): HTTP ${res.status} - ${res.body}`);
      }
    } catch (e) {
      console.log(`✗ ${acc.role} (${acc.email}): Error - ${e.message}`);
    }
  }
})();
