async function createTestUser() {
  try {
    // Create a test user
    const testUser = {
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'Demo123456'
    };
    
    console.log('Creating test user...');
    const response = await fetch('http://localhost:9090/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const result = await response.json();
    console.log('Registration result:', result);
    
    // Try login
    console.log('Testing login...');
    const loginResponse = await fetch('http://localhost:9090/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login result:', loginResult);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();
