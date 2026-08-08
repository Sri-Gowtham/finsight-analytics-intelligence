async function testLandingPage() {
  console.log("--- Landing Page Chatbot Request ---");
  const url = 'http://localhost:3001/api/chat';
  const payload = { message: 'how to login', history: [] };
  
  console.log("Request URL:", url);
  console.log("Request payload:", JSON.stringify(payload));
  console.log("Request headers: { 'Content-Type': 'application/json' }");
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  console.log("HTTP status:", res.status);
  const text = await res.text();
  console.log("Response body:", text);
}
testLandingPage().catch(console.error);
