const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Токен из консоли браузера (localStorage.getItem('auth_token'))
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1OTg3MTZlYy03NTQwLTQ0YjUtYTBlNy1kMzcwOGI5Y2NmMTUiLCJhY2NvdW50SWQiOiJhZTAzMGMwZi1jYzVhLTQ4NjMtODQyMi00NzZkNTk3YzAzYWEiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwiaWF0IjoxNzY1MDQ3Mzc1LCJleHAiOjE3Njc2MzkzNzV9.ghwEEB8SYXGakucEL82SJlCuIhX8oiHHD-r9YzM31Fo';

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Токен валиден!');
  console.log('User ID:', decoded.userId);
  console.log('Account ID:', decoded.accountId);
  console.log('Email:', decoded.email);
} catch (error) {
  console.log('Ошибка токена:', error.message);
}
