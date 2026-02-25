const https = require('https');

const TOKEN = 'c4954cc7-bc20-4e0a-9526-a247662e1f80';
const SERVICE_ID = '9db36734-b056-420b-aa82-e00d5b7baa95';
const ENV_ID = 'afb6f15b-2e93-4e5e-ac9d-0a7f259d34c3';

function post(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const opts = {
      hostname: 'backboard.railway.app',
      path: '/graphql/v2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, res => {
      let s = '';
      res.on('data', d => s += d);
      res.on('end', () => {
        try { resolve(JSON.parse(s)); }
        catch (e) { resolve({ raw: s }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  const query = `{
    deployments(input: { serviceId: "${SERVICE_ID}", environmentId: "${ENV_ID}" }) {
      edges { node { id status createdAt } }
    }
  }`;

  const r = await post(query);
  console.log(JSON.stringify(r, null, 2));
}

run().catch(console.error);
