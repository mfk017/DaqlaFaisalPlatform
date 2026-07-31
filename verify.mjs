const BASE_URL = 'http://localhost:3000';
let cookie = '';

async function run() {
  console.log('--- Starting System Verification ---');

  // 1. Create a test user via signup
  const timestamp = Date.now();
  const testEmail = `test_${timestamp}@example.com`;
  
  console.log('1. Testing Signup API...');
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      full_name: 'QA Tester',
      username: `qa_${timestamp}`
    })
  });
  
  if (signupRes.ok) {
    console.log('✅ Signup successful');
  } else {
    console.error('❌ Signup failed:', await signupRes.text());
    return;
  }

  // NOTE: Newly signed up users are NOT approved by default. 
  // Trying to log in should fail or redirect to pending.
  console.log('2. Testing Login API (Unapproved User)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'password123' })
  });

  const loginData = await loginRes.json();
  if (loginRes.ok && loginData.redirect === '/pending-approval') {
    console.log('✅ Login correctly detected unapproved status');
  } else {
    console.error('❌ Unapproved login logic failed:', loginData);
  }

  // 3. Test Public Pages (No Auth Required)
  console.log('3. Testing Public Routes...');
  const routes = ['/login', '/signup'];
  for (const route of routes) {
    const res = await fetch(`${BASE_URL}${route}`);
    if (res.ok) {
      console.log(`✅ ${route} loaded successfully`);
    } else {
      console.error(`❌ ${route} failed to load`);
    }
  }

  // 4. Test Protected Pages (Should redirect to login without cookie)
  console.log('4. Testing Protected Route Middleware...');
  const protectedRes = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' });
  if (protectedRes.status === 307 || protectedRes.status === 302) {
    console.log('✅ Middleware correctly protects /dashboard');
  } else {
    console.error(`❌ Middleware failed, status: ${protectedRes.status}`);
  }

  console.log('--- Verification Complete ---');
}

run().catch(console.error);
