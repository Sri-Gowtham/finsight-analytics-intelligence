async function t() {
  const r = await fetch('http://localhost:3001/api/auth/login',
    {method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:'analyst@finsight.demo',password:'demo1234'})});
  const {token} = await r.json();

  // Test chatbot
  const c = await fetch('http://localhost:3001/api/chat',
    {method:'POST',
    headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({message:'Where do I submit a report?'})});
  const cd = await c.json();
  console.log('CHAT STATUS:', c.status);
  console.log('CHAT REPLY:', cd.reply?.slice(0,150) || cd);

  // Test approval history
  const cfoR = await fetch('http://localhost:3001/api/auth/login',
    {method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:'cfo@finsight.demo',password:'demo1234'})});
  const {token:ct} = await cfoR.json();
  
  const h = await fetch('http://localhost:3001/api/reports?status=approved',
    {headers:{'Authorization':'Bearer '+ct}});
  const hd = await h.json();
  console.log('APPROVED REPORTS:', hd.reports?.length);
}
t().catch(console.error);
