import dotenv from 'dotenv';
dotenv.config();

import { AuthService } from './src/services/auth';
import { DatabaseService } from './src/services/database';

async function testAuth() {
  try {
    console.log('🧪 Testing auth components...');

    // Test 1: Database connection
    console.log('1. Testing database...');
    const db = DatabaseService.getInstance();
    await db.connect();
    console.log('✅ Database connected');

    // Test 2: Auth service initialization
    console.log('2. Testing auth service...');
    const auth = AuthService.getInstance();
    await auth.initialize();
    console.log('✅ Auth service initialized');

    // Test 3: Password hashing
    console.log('3. Testing password hashing...');
    const hash = await auth.hashPassword('TestPass123!');
    console.log('✅ Password hashing works');

    // Test 4: Password verification
    console.log('4. Testing password verification...');
    const isValid = await auth.verifyPassword('TestPass123!', hash);
    console.log('✅ Password verification works:', isValid);

    console.log('🎉 All auth components working!');
  } catch (error) {
    console.error('❌ Auth test failed:', error);
  }

  process.exit(0);
}

testAuth();
