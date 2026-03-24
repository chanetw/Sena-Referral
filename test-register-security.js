const http = require('http');

const API_KEY = '2e95610014cbacb8edd1856372f7313162744a2675b546423c718aa9d1bdabae';

function makeRequest(path, body, headers) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', (err) => resolve({ status: 'ERROR', body: err.message }));
    req.write(data);
    req.end();
  });
}

async function runTests() {
  const testData = {
    firstName: 'ทดสอบ',
    lastName: 'ระบบใหม่',
    email: `test${Date.now()}@example.com`,
    phone: '0812345699',
    idCard: '1234567890' + Math.floor(Math.random() * 900 + 100),
    agentTypeCode: 'general'
  };

  console.log('=== Test 1: ไม่มี X-Api-Key ===');
  const r1 = await makeRequest('/api/auth/register', testData, {});
  console.log(`Status: ${r1.status} (ต้องได้ 401)`);
  console.log('Response:', JSON.stringify(r1.body, null, 2));
  console.log();

  console.log('=== Test 2: X-Api-Key ผิด ===');
  const r2 = await makeRequest('/api/auth/register', testData, { 'X-Api-Key': 'wrongkey123' });
  console.log(`Status: ${r2.status} (ต้องได้ 401)`);
  console.log('Response:', JSON.stringify(r2.body, null, 2));
  console.log();

  console.log('=== Test 3: X-Api-Key ถูกต้อง ===');
  const r3 = await makeRequest('/api/auth/register', testData, { 'X-Api-Key': API_KEY });
  console.log(`Status: ${r3.status} (ต้องได้ 201)`);
  console.log('Response:', JSON.stringify(r3.body, null, 2));
}

runTests();
