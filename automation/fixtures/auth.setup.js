const { test: setup } = require('@playwright/test');

/**
 * Auth Setup - Runs before test suites that need authentication.
 * Stores auth state for reuse across tests.
 */
setup('authenticate as test user', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    data: {
      email: process.env.TEST_USER_EMAIL || 'testuser@example.com',
      password: process.env.TEST_USER_PASSWORD || 'TestPass123!',
    },
  });

  // Store the auth token for use in API tests
  if (response.ok()) {
    const body = await response.json();
    process.env.AUTH_TOKEN = body.token;
  }
});
