import 'dotenv/config';

async function verify() {
  console.log("=== GEMINI CHAT VERIFICATION ===");

  const queries = [
    "What should I invest in?"
  ];

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  for (let i = 0; i < queries.length; i++) {
    console.log(`\nTEST ${i+1}: "${queries[i]}"`);
    let res = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: queries[i], history: [] })
    });
    
    let data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data.reply ? data.reply : data.error);
    await delay(3000);
  }
}
verify().catch(console.error);
