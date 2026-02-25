const https = require('https');

const TOKEN = 'c4954cc7-bc20-4e0a-9526-a247662e1f80';
const SERVICE_ID = '9db36734-b056-420b-aa82-e00d5b7baa95';
const ENV_ID = 'afb6f15b-2e93-4e5e-ac9d-0a7f259d34c3';
const COMMIT_SHA = '5280bcd8a2595ff5737a8b501cd2f5404fae1180';

function post(query, variables) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
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
  console.log('Attempting to trigger Railway deployment from commit:', COMMIT_SHA);
  console.log('Service:', SERVICE_ID, '| Env:', ENV_ID);
  console.log('');

  // Try 1: serviceInstanceDeploy with commitSha
  console.log('--- Try 1: serviceInstanceDeploy ---');
  const r1 = await post(`
    mutation Deploy($serviceId: String!, $environmentId: String!, $commitSha: String) {
      serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId, commitSha: $commitSha)
    }
  `, { serviceId: SERVICE_ID, environmentId: ENV_ID, commitSha: COMMIT_SHA });
  console.log(JSON.stringify(r1, null, 2));

  // Try 2: deploymentCreate
  console.log('\n--- Try 2: deploymentCreate ---');
  const r2 = await post(`
    mutation {
      deploymentCreate(input: {
        serviceId: "${SERVICE_ID}",
        environmentId: "${ENV_ID}",
        commitSha: "${COMMIT_SHA}"
      }) { id status }
    }
  `);
  console.log(JSON.stringify(r2, null, 2));

  // Try 3: check latest deployments to see if anything changed
  console.log('\n--- Try 3: list recent deployments ---');
  const r3 = await post(`{
    deployments(input: { serviceId: "${SERVICE_ID}", environmentId: "${ENV_ID}" }) {
      edges { node { id status createdAt } }
    }
  }`);
  const deps = r3.data?.deployments?.edges || [];
  deps.slice(0, 5).forEach(e => {
    console.log(' -', e.node.id, '|', e.node.status, '|', e.node.createdAt);
  });
}

run().catch(console.error);
