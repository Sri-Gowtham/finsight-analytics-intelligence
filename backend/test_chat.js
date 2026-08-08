async function t() {
  const r = await fetch('http://localhost:3001/api/auth/login',
    {method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:'analyst@finsight.demo',password:'demo1234'})});
  const {token} = await r.json();

  const tests = [
    'hi',
    'How do I login?',
    'Explain FinSight',
    'Where is What-if Analysis?',
    'Where can CFOs approve reports?',
    'Where is Approval History?',
    'What can an Analyst do?',
    'What can an Admin do?',
    'What should I invest in?'
  ];

  for (const msg of tests) {
    const c = await fetch('http://localhost:3001/api/chat',
      {method:'POST',
      headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({message: msg, history:[]})});
    const cd = await c.json();
    console.log('Q:', msg);
    console.log('A:', cd.reply ? cd.reply.slice(0, 150) : cd);
    console.log('---');
    await new Promise(r => setTimeout(r, 7000));
  }
}
t().catch(console.error);
