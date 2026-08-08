async function test() {
  const aRes = await fetch('http://localhost:3001/api/auth/login',
    {method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:'analyst@finsight.demo',password:'demo1234'})});
  const {token:aT, user:aU} = await aRes.json();
  console.log('ANALYST:', aU?.name, aU?.role);

  const cRes = await fetch('http://localhost:3001/api/auth/login',
    {method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:'cfo@finsight.demo',password:'demo1234'})});
  const {token:cT, user:cU} = await cRes.json();
  console.log('CFO:', cU?.name, cU?.role);

  // Submit report
  const rRes = await fetch('http://localhost:3001/api/reports',
    {method:'POST',
    headers:{'Authorization':'Bearer '+aT,'Content-Type':'application/json'},
    body:JSON.stringify({
      client_name:'Alpha Capital Portfolio',
      analyst_notes:'Strong NIM at 4.10% for HDFC Bank with improving asset quality trend.',
      insight_ids:[11,12]
    })});
  const rData = await rRes.json();
  console.log('SUBMIT:', rRes.status, rData.report?.report_id);

  // CFO get pending
  const pRes = await fetch('http://localhost:3001/api/reports?status=pending',
    {headers:{'Authorization':'Bearer '+cT}});
  const pData = await pRes.json();
  console.log('PENDING:', pData.reports?.length, 'reports');

  // CFO approve
  const rid = rData.report?.report_id;
  if (rid) {
    const apRes = await fetch('http://localhost:3001/api/reports/'+rid+'/review',
      {method:'PATCH',
      headers:{'Authorization':'Bearer '+cT,'Content-Type':'application/json'},
      body:JSON.stringify({status:'approved',cfo_comment:'Good analysis, approved.'})});
    console.log('APPROVE:', apRes.status);
  }

  // Analyst check notifications
  const nRes = await fetch('http://localhost:3001/api/reports/notifications/mine',
    {headers:{'Authorization':'Bearer '+aT}});
  const nData = await nRes.json();
  console.log('NOTIFICATIONS:', nData.unread_count, 'unread');
  if (nData.notifications?.[0]) {
    console.log('FIRST NOTIF:', nData.notifications[0].title);
    console.log('MESSAGE:', nData.notifications[0].message);
  }
}
test().catch(console.error);
