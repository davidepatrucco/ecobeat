require('dotenv').config();
console.log('MONGODB_URI found:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET found:', !!process.env.JWT_SECRET);
console.log('MONGODB_URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');
console.log('JWT_SECRET:', process.env.JWT_SECRET?.substring(0, 20) + '...');
