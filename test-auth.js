#!/usr/bin/env node

/**
 * Script di test per gli endpoint di autenticazione JWT
 * Uso: node test-auth.js [API_URL]
 */

const https = require('https');
const http = require('http');

// API base URL - default locale o da argomento
const API_BASE = process.argv[2] || 'http://localhost:3000';
console.log(`🧪 Testing auth endpoints on: ${API_BASE}`);

// Test data
const testUser = {
  email: `test+${Date.now()}@ecobeat.com`,
  password: 'TestPass123!',
  firstName: 'Mario',
  lastName: 'Rossi',
};

let authTokens = null;

async function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const isHttps = url.protocol === 'https:';
    const requestModule = isHttps ? https : http;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EcoBeat-Test/1.0',
        ...headers,
      },
    };

    const req = requestModule.request(options, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers,
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testHealthCheck() {
  console.log('\n📍 Testing health check...');

  try {
    const response = await makeRequest('GET', '/health');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);

    if (response.status === 200) {
      console.log('   ✅ Health check passed');
      return true;
    } else {
      console.log('   ❌ Health check failed');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Health check error:', error.message);
    return false;
  }
}

async function testDetailedHealthCheck() {
  console.log('\n📍 Testing detailed health check...');

  try {
    const response = await makeRequest('GET', '/health/detailed');
    console.log(`   Status: ${response.status}`);
    console.log(`   MongoDB: ${response.data.checks?.mongodb || 'unknown'}`);
    console.log(`   KMS: ${response.data.checks?.kms || 'unknown'}`);
    console.log(`   SSM: ${response.data.checks?.ssm || 'unknown'}`);

    if (response.status === 200) {
      console.log('   ✅ Detailed health check passed');
      return true;
    } else {
      console.log('   ❌ Detailed health check failed');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Detailed health check error:', error.message);
    return false;
  }
}

async function testUserRegistration() {
  console.log('\n📍 Testing user registration...');

  try {
    const response = await makeRequest('POST', '/auth/register', testUser);
    console.log(`   Status: ${response.status}`);

    if (response.status === 201) {
      authTokens = response.data.tokens;
      console.log('   ✅ Registration successful');
      console.log(
        `   Access Token: ${authTokens?.accessToken?.substring(0, 20)}...`
      );
      console.log(
        `   Refresh Token: ${authTokens?.refreshToken?.substring(0, 20)}...`
      );
      return true;
    } else {
      console.log('   ❌ Registration failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Registration error:', error.message);
    return false;
  }
}

async function testUserLogin() {
  console.log('\n📍 Testing user login...');

  try {
    const loginData = {
      email: testUser.email,
      password: testUser.password,
    };

    const response = await makeRequest('POST', '/auth/login', loginData);
    console.log(`   Status: ${response.status}`);

    if (response.status === 200) {
      authTokens = response.data.tokens;
      console.log('   ✅ Login successful');
      console.log(
        `   Access Token: ${authTokens?.accessToken?.substring(0, 20)}...`
      );
      return true;
    } else {
      console.log('   ❌ Login failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Login error:', error.message);
    return false;
  }
}

async function testProtectedRoute() {
  console.log('\n📍 Testing protected route (/auth/me)...');

  if (!authTokens?.accessToken) {
    console.log('   ❌ No access token available');
    return false;
  }

  try {
    const headers = {
      Authorization: `Bearer ${authTokens.accessToken}`,
    };

    const response = await makeRequest('GET', '/auth/me', null, headers);
    console.log(`   Status: ${response.status}`);

    if (response.status === 200) {
      console.log('   ✅ Protected route accessible');
      console.log(
        `   User: ${response.data.user?.firstName} ${response.data.user?.lastName}`
      );
      console.log(`   Email: ${response.data.user?.email}`);
      return true;
    } else {
      console.log('   ❌ Protected route failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Protected route error:', error.message);
    return false;
  }
}

async function testTokenRefresh() {
  console.log('\n📍 Testing token refresh...');

  if (!authTokens?.refreshToken) {
    console.log('   ❌ No refresh token available');
    return false;
  }

  try {
    const refreshData = {
      refreshToken: authTokens.refreshToken,
    };

    const response = await makeRequest('POST', '/auth/refresh', refreshData);
    console.log(`   Status: ${response.status}`);

    if (response.status === 200) {
      console.log('   ✅ Token refresh successful');
      console.log(
        `   New Access Token: ${response.data.tokens?.accessToken?.substring(0, 20)}...`
      );
      return true;
    } else {
      console.log('   ❌ Token refresh failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Token refresh error:', error.message);
    return false;
  }
}

async function testInvalidData() {
  console.log('\n📍 Testing validation with invalid data...');

  try {
    const invalidUser = {
      email: 'invalid-email',
      password: '123', // Too short
      firstName: '',
      lastName: '',
    };

    const response = await makeRequest('POST', '/auth/register', invalidUser);
    console.log(`   Status: ${response.status}`);

    if (response.status === 400) {
      console.log('   ✅ Validation working correctly');
      return true;
    } else {
      console.log('   ❌ Validation should have failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Validation test error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting EcoBeat Auth API Tests');
  console.log('====================================');

  const results = [];

  // Test sequence
  results.push(await testHealthCheck());
  results.push(await testDetailedHealthCheck());
  results.push(await testUserRegistration());
  results.push(await testUserLogin());
  results.push(await testProtectedRoute());
  results.push(await testTokenRefresh());
  results.push(await testInvalidData());

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 All tests passed! Auth system is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
