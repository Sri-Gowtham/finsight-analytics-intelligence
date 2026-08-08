const http = require('http');

const data = JSON.stringify({ email: "analyst@finsight.demo", password: "demo1234" });

const req = http.request('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log("LOGIN RESPONSE:");
    console.log(body);
    const token = JSON.parse(body).token;
    
    if (token) {
      const req2 = http.request('http://localhost:3001/api/market-intelligence', {
        headers: { 'Authorization': 'Bearer ' + token }
      }, (res2) => {
        let body2 = '';
        res2.on('data', d => body2 += d);
        res2.on('end', () => {
          console.log("MARKET INTELLIGENCE RESPONSE:");
          console.log(body2.substring(0, 2000));
        });
      });
      req2.end();
    }
  });
});
req.write(data);
req.end();
