const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_6DazBAEi2kMT@ep-noisy-star-aza6idur-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });
client.connect().then(() => 
  client.query(`
    SELECT ticker, fetch_date, source,
      market_data->>'current_price' as price,
      market_data->>'market_cap' as market_cap,
      income_statement IS NOT NULL as has_income,
      quarterly_results IS NOT NULL as has_quarterly
    FROM bank_financials_raw
    ORDER BY fetch_date DESC
    LIMIT 10;
  `)
).then(res => console.log(res.rows)).finally(() => client.end());
