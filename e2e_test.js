const https = require('https');

const BACKEND = 'api-production-7561.up.railway.app';

function request(hostname, path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname, path, method,
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', ...headers, ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}) }
    };
    const req = https.request(opts, res => {
      let s = '';
      res.on('data', d => s += d);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(s) }); } catch { resolve({ status: res.statusCode, body: s }); } });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function run() {
  const email = `final_${Date.now()}@example.com`;
  await request(BACKEND, '/api/v1/auth/register', 'POST', { email, password: 'TestPass123!', full_name: 'Final Test' });
  let r = await request(BACKEND, '/api/v1/auth/login', 'POST', { email, password: 'TestPass123!' });
  const auth = { 'Authorization': 'Bearer ' + r.body?.access_token };
  console.log('Auth: OK');

  r = await request(BACKEND, '/api/v1/companies', 'POST', {
    name: 'Testvirksomhed ApS', cvr: '33445566', industry_code: 'technology',
    country_code: 'DK', employee_count: 25, revenue_eur: 1500000
  }, auth);
  const cid = r.body?.id;

  r = await request(BACKEND, `/api/v1/companies/${cid}/submissions`, 'POST', { reporting_year: 2024 }, auth);
  const sid = r.body?.id;

  await request(BACKEND, `/api/v1/submissions/${sid}/energy`, 'PATCH',
    { electricity_kwh: 85000, natural_gas_m3: 3200, diesel_litres: 1500 }, auth);
  await request(BACKEND, `/api/v1/submissions/${sid}/workforce`, 'PATCH',
    { employees_total: 25, employees_male: 15, employees_female: 10, accident_count: 0,
      gender_pay_gap_pct: 6.2, training_hours_total: 180 }, auth);
  await request(BACKEND, `/api/v1/submissions/${sid}/environment`, 'PATCH',
    { has_pollution_reporting: false, water_withdrawal_m3: 2500, waste_total_tonnes: 12.0, waste_recycled_pct: 72 }, auth);
  await request(BACKEND, `/api/v1/submissions/${sid}/policies`, 'PATCH',
    { has_climate_policy: true, has_diversity_policy: true, has_anti_corruption_policy: true }, auth);
  await request(BACKEND, `/api/v1/submissions/${sid}/submit`, 'POST', {}, auth);
  console.log('All data saved & submitted');

  r = await request(BACKEND, '/api/v1/reports/generate', 'POST', { submission_id: sid }, auth);
  const rid = r.body?.report_id;
  console.log('Report started:', rid, '\nPolling...');

  let finalStatus = 'processing';
  for (let i = 0; i < 20; i++) {
    await new Promise(res => setTimeout(res, 10000));
    r = await request(BACKEND, `/api/v1/reports/${rid}/status`, 'GET', null, auth);
    finalStatus = r.body?.status;
    process.stdout.write(`  [${(i+1)*10}s] ${finalStatus}\n`);
    if (finalStatus === 'completed' || finalStatus === 'failed') {
      if (finalStatus === 'failed') console.log('  Error:', r.body?.error_message);
      break;
    }
  }

  // Print full raw response to understand structure
  r = await request(BACKEND, `/api/v1/reports/${rid}`, 'GET', null, auth);
  console.log('\n=== RAW REPORT RESPONSE (HTTP', r.status, ') ===');
  console.log(JSON.stringify(r.body, null, 2).slice(0, 4000));
}

run().catch(e => console.error('ERROR:', e.message));
