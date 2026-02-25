const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const PROJECT_ID = 'prj_yWoGG6ZWkVpm7VBI5mHagTqg7Cep';
const TEAM_ID = 'team_b6w1AX0aHMQPZwSXNztV5KBz';
const API_URL = 'https://api-production-7561.up.railway.app';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const url = path.includes('?') ? path + `&teamId=${TEAM_ID}` : path + `?teamId=${TEAM_ID}`;
    const opts = {
      hostname: 'api.vercel.com',
      path: url,
      method,
      headers: {
        'Authorization': 'Bearer ' + VERCEL_TOKEN,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = https.request(opts, res => {
      let s = '';
      res.on('data', d => s += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(s) }); }
        catch { resolve({ status: res.statusCode, body: s }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// Get project aliases / production URL
async function run() {
  const r = await request('GET', `/v9/projects/${PROJECT_ID}`);
  console.log('Project name:', r.body?.name);
  console.log('Aliases:', JSON.stringify(r.body?.alias || []));

  const r2 = await request('GET', `/v6/deployments?projectId=${PROJECT_ID}&limit=3&target=production`);
  console.log('\nRecent deployments:');
  (r2.body?.deployments || []).forEach(d => {
    console.log(' ', d.state, '|', 'https://' + d.url);
  });
}

run().catch(console.error);
