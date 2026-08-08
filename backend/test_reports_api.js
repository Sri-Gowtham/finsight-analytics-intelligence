async function test() {
  // Login as analyst
  const aLogin = await fetch('http://localhost:3001/api/auth/login',
    {method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:'analyst@finsight.demo',password:'demo1234'})});
  const {token: aToken, user: aUser} = await aLogin.json();
  console.log('ANALYST LOGIN:', aLogin.status, aUser?.name);

  // Submit report
  const report = await fetch('http://localhost:3001/api/reports',
    {method:'POST',
    headers:{'Authorization':'Bearer '+aToken,'Content-Type':'application/json'},
    body:JSON.stringify({
      client_name: 'Alpha Capital Portfolio',
      analyst_notes: 'HDFC shows strong NIM at 4.10% with improving asset quality.',
      insight_ids: [11]
    })});
  const rData = await report.json();
  console.log('SUBMIT REPORT:', report.status, JSON.stringify(rData).slice(0,150));

  // Login as CFO
  const cLogin = await fetch('http://localhost:3001/api/auth/login',
    {method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:'cfo@finsight.demo',password:'demo1234'})});
  const {token: cToken} = await cLogin.json();
  console.log('CFO LOGIN:', cLogin.status);

  // CFO get pending reports
  const pending = await fetch('http://localhost:3001/api/reports?status=pending',
    {headers:{'Authorization':'Bearer '+cToken}});
  const pData = await pending.json();
  console.log('PENDING REPORTS:', pending.status, 
    pData.reports?.length + ' reports');

  // CFO approve the report
  if (rData.report?.report_id) {
    const approve = await fetch(
      'http://localhost:3001/api/reports/'+rData.report.report_id+'/review',
      {method:'PATCH',
      headers:{'Authorization':'Bearer '+cToken,'Content-Type':'application/json'},
      body:JSON.stringify({status:'approved', cfo_comment:'Well analysed.'})});
    console.log('APPROVE:', approve.status, 
      JSON.stringify(await approve.json()).slice(0,100));
  }

  // Analyst check notifications
  const notifs = await fetch(
    'http://localhost:3001/api/reports/notifications/mine',
    {headers:{'Authorization':'Bearer '+aToken}});
  const nData = await notifs.json();
  console.log('NOTIFICATIONS:', notifs.status, 
    nData.unread_count + ' unread,', 
    nData.notifications?.length + ' total');
}
test().catch(console.error);
