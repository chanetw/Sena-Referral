const http = require('http');

const data = JSON.stringify({
  firstName: 'ทดสอบ',
  lastName: 'เอพีไอใหม่',
  email: 'test.register' + Date.now() + '@example.com',
  phone: '08' + Math.random().toString().substring(2, 10),
  idCard: '1234567890' + Math.floor(Math.random() * 100).toString().padStart(3, '0'),
  agentTypeCode: 'general'
});

console.log('Request:', JSON.parse(data));

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('\nStatus:', res.statusCode);
    try {
      const json = JSON.parse(body);
      console.log('Response:', JSON.stringify(json, null, 2));
    } catch(e) {
      console.log('Response:', body);
    }
  });
});

req.on('error', (err) => {
  console.error('Error:', err.message);
});

req.write(data);
req.end();
