// Test script for API endpoints
const http = require('http');

const testEndpoints = [
  {
    name: 'Health Check',
    path: '/health',
    method: 'GET'
  },
  {
    name: 'API Info',
    path: '/api',
    method: 'GET'
  },
  {
    name: 'Test Login',
    path: '/api/auth/login',
    method: 'POST',
    data: JSON.stringify({
      email: 'admin@test.com',
      password: '123456'
    })
  }
];

function testAPI(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        ...(endpoint.data && { 'Content-Length': Buffer.byteLength(endpoint.data) })
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (endpoint.data) {
      req.write(endpoint.data);
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing API Endpoints...\n');
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
      const result = await testAPI(endpoint);
      
      if (result.status === 200 || result.status === 201) {
        console.log('✅ Success:', result.status);
        console.log('📄 Response:', JSON.stringify(result.data, null, 2));
      } else {
        console.log('⚠️  Status:', result.status);
        console.log('📄 Response:', JSON.stringify(result.data, null, 2));
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    console.log('---');
  }
}

// Run tests if server is not running, start it first
const testConnection = () => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: '/health',
      method: 'GET'
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.end();
  });
};

testConnection().then(isConnected => {
  if (isConnected) {
    runTests();
  } else {
    console.log('❌ Server is not running on port 5001');
    console.log('Please start the server first: npm start');
  }
});