const https = require('https');

const data = JSON.stringify({ ticker: "HDFCBANK" });

const options = {
  hostname: 'api.agents.snsihub.ai',
  port: 443,
  path: '/webhook/dd177273-ec59-4344-91c2-df1efbb547ce',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
