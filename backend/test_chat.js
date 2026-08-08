async function t() {
  const r = await fetch('http://localhost:3001/api/auth/login',
    {method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:'analyst@finsight.demo',password:'demo1234'})});
  const {token} = await r.json();

  const tests = [
    'Where do I submit a report?',
    'What does Peer Comparison do?',
    'How does CFO approval work?'
  ];

  for (const msg of tests) {
    const c = await fetch('http://localhost:3001/api/chat',
      {method:'POST',
      headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({message: msg, history:[]})});
    const cd = await c.json();
    console.log('Q:', msg);
    console.log('A:', cd.reply?.slice(0,150));
    console.log('---');
  }
}
t().catch(console.error);
