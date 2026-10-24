// Usage: node test-webhook.cjs [TICKER]
// Reads AGENT_WEBHOOK_URL from backend/.env
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

const url = process.env.AGENT_WEBHOOK_URL;
if (!url) {
  console.error('AGENT_WEBHOOK_URL is not set in backend/.env');
  process.exit(1);
}

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ticker: process.argv[2] || 'HDFCBANK' }),
})
  .then(async (res) => {
    console.log(`statusCode: ${res.status}`);
    console.log(await res.text());
  })
  .catch((err) => console.error(err));
