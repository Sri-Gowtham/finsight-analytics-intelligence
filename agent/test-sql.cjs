const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_6DazBAEi2kMT@ep-noisy-star-aza6idur-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });
client.connect().then(() => 
  client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bank_financials_raw' ORDER BY ordinal_position;")
).then(res => console.log(res.rows)).finally(() => client.end());
