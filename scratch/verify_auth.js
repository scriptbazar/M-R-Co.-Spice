import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/auth';

async function runTests() {
  console.log('--- STARTING UPGRADED AUTH FLOW TESTS ---');

  // Test 1: Restored /login-password with correct credentials (seeded Admin)
  try {
    console.log('Test 1: Testing login-password with seeded admin...');
    // The seeded admin password hash in init.js is sha256 of 'admin123'
    const response = await axios.post(`${BASE_URL}/login-password`, {
      email: 'admin@apice.com',
      password: 'admin123'
    });
    if (response.data.success && response.data.user.role === 'admin') {
      console.log('PASS: Password login succeeded for seeded admin.');
    } else {
      console.error('FAIL: Password login response incorrect:', response.data);
    }
  } catch (error) {
    console.error('FAIL: Password login error for admin:', error.response ? error.response.data : error.message);
  }

  // Test 2: Restored /login-password with NON-EXISTENT email
  try {
    console.log('\nTest 2: Testing login-password with non-existent email...');
    await axios.post(`${BASE_URL}/login-password`, {
      email: 'nonexistent_user@gmail.com',
      password: 'somepassword'
    });
    console.error('FAIL: Non-existent email should have returned 404');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('PASS: Correctly returned 404. Error message:', error.response.data.error);
    } else {
      console.error('FAIL: Expected 404 for non-existent email, got:', error.response ? error.response.status : error.message);
    }
  }

  // Test 3: New /signup-password endpoint
  const newEmail = `customer_test_${Math.floor(Math.random() * 100000)}@gmail.com`;
  const newPhone = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  try {
    console.log(`\nTest 3: Testing signup-password for ${newEmail}...`);
    const response = await axios.post(`${BASE_URL}/signup-password`, {
      name: 'Test Sign Up User',
      email: newEmail,
      phone: newPhone,
      password: 'mypassword123'
    });
    if (response.data.success && response.data.user.email === newEmail) {
      console.log('PASS: Sign up successful. Hashed user registered.');
    } else {
      console.error('FAIL: Sign up response incorrect:', response.data);
    }
  } catch (error) {
    console.error('FAIL: Sign up error:', error.response ? error.response.data : error.message);
  }

  // Test 4: New /signup-password duplicate check
  try {
    console.log('\nTest 4: Testing duplicate signup-password...');
    await axios.post(`${BASE_URL}/signup-password`, {
      name: 'Test Sign Up User Duplicate',
      email: newEmail,
      phone: newPhone,
      password: 'mypassword123'
    });
    console.error('FAIL: Duplicate email/phone should have returned 400');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('PASS: Correctly blocked duplicate signup. Error:', error.response.data.error);
    } else {
      console.error('FAIL: Expected 400, got:', error.response ? error.response.status : error.message);
    }
  }

  // Test 5: Google Login with action=login for non-existent email
  try {
    console.log('\nTest 5: Testing Google login with non-existent email...');
    await axios.post(`${BASE_URL}/google-login`, {
      is_mock: true,
      mock_email: 'unregistered_google_user@gmail.com',
      mock_name: 'Unregistered Google User',
      action: 'login'
    });
    console.error('FAIL: Non-existent email with action=login should have returned 404');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('PASS: Correctly blocked unregistered Google login. Error:', error.response.data.error);
    } else {
      console.error('FAIL: Expected 404, got:', error.response ? error.response.status : error.message);
    }
  }

  // Test 6: Google Login with action=signup for non-existent email (should auto-register)
  try {
    const freshGoogleEmail = `unregistered_google_${Math.floor(Math.random() * 100000)}@gmail.com`;
    console.log(`\nTest 6: Testing Google signup for ${freshGoogleEmail}...`);
    const response = await axios.post(`${BASE_URL}/google-login`, {
      is_mock: true,
      mock_email: freshGoogleEmail,
      mock_name: 'Fresh Google User',
      action: 'signup'
    });
    if (response.data.success && response.data.user.email === freshGoogleEmail) {
      console.log('PASS: Unregistered Google account registered successfully when registering.');
    } else {
      console.error('FAIL: Google signup response incorrect:', response.data);
    }
  } catch (error) {
    console.error('FAIL: Google signup error:', error.response ? error.response.data : error.message);
  }

  console.log('\n--- UPGRADED AUTH FLOW TESTS COMPLETED ---');
}

runTests();
