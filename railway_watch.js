const https = require('https');

const TOKEN = 'c4954cc7-bc20-4e0a-9526-a247662e1f80';
const SERVICE_ID = '9db36734-b056-420b-aa82-e00d5b7baa95';
const ENV_ID = 'afb6f15b-2e93-4e5e-ac9d-0a7f259d34c3';
const DEP_ID = 'f1ae94e4-583a-448b-9170-6c6141795a1b';

function post(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const opts = {
      hostname: 'backboard.railway.app', path: '/graphql/v2', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(opts, res => {
      let s = ''; res.on('data', d => s += d);
      res.on('end', () => { try { resolve(JSON.parse(s)); } catch(e) { resolve({raw:s}); } });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

async function checkBilling() {
  return new Promise(resolve => {
    const req = https.get('https://api-production-7561.up.railway.app/api/v1/billing/status', res => {
      resolve(res.statusCode);
    });
    req.on('error', () => resolve('err'));
  });
}

async function run() {
  let attempt = 0;
  while (attempt < 20) {
    attempt++;
    const r = await post(`{
      deployments(input: { serviceId: "${SERVICE_ID}", environmentId: "${ENV_ID}" }) {
        edges { node { id status createdAt } }
      }
    }`);
    const deps = r.data?.deployments?.edges || [];
    const latest = deps[0]?.node;
    const status = latest?.status || 'unknown';
    const billing = await checkBilling();
    console.log(`[${attempt}] Deploy: ${status} | /billing/status HTTP: ${billing}`);

    if (status === 'SUCCESS') {
      console.log('\n✅ Deployment succeeded! New code is live.');
      break;
    }
    if (status === 'FAILED' || status === 'CRASHED') {
      console.log('\n❌ Deployment failed! Getting logs...');
      const r2 = await post(`{ deploymentLogs(deploymentId: "${DEP_ID}") { message } }`);
      const logs = r2.data?.deploymentLogs || [];
      logs.slice(-20).forEach(l => console.log(' ', l.message));
      break;
    }
    await new Promise(r => setTimeout(r, 30000)); // wait 30s
  }
}

run().catch(console.error);
