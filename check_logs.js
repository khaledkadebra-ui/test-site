const https = require('https');

const TOKEN = 'c4954cc7-bc20-4e0a-9526-a247662e1f80';
const DEP_ID = 'c1ea1ed8-ab11-4809-a4c7-f54dd27f2fe6';

function post(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const opts = {
      hostname: 'backboard.railway.app', path: '/graphql/v2', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(opts, res => {
      let s = '';
      res.on('data', d => s += d);
      res.on('end', () => { try { resolve(JSON.parse(s)); } catch { resolve({ raw: s }); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  const r = await post(`{
    deploymentLogs(deploymentId: "${DEP_ID}", limit: 100) { message severity }
  }`);
  const logs = r.data?.deploymentLogs || [];
  logs.filter(l => l.message.trim()).forEach(l => console.log(`[${l.severity}] ${l.message}`));
}

run().catch(console.error);
