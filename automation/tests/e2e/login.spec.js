const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { TestDataFactory } = require('../../fixtures/test-data');

test.describe('Login Feature', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // --- Positive Tests ---

  test('should login successfully with valid credentials', async ({ page }) => {
    const { email, password } = TestDataFactory.credentials.valid;
    await loginPage.login(email, password);
    await loginPage.dismissPopup();
    await expect(page).not.toHaveURL(/.*auth\/login/);
  });

  test('should display login form with all required fields', async () => {
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  // --- Negative Tests ---

  test('should show error for invalid credentials', async () => {
    const { email, password } = TestDataFactory.credentials.invalid;
    await loginPage.login(email, password);
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should show validation message when username is empty', async () => {
    await loginPage.login('', 'SomePassword123');
    await expect(loginPage.validationMessage).toBeVisible();
  });

  test('should show validation message when password is empty', async () => {
    await loginPage.login('user@example.com', '');
    await expect(loginPage.validationMessage).toBeVisible();
  });

  test('should show validation message for empty form submission', async () => {
    await loginPage.loginButton.click();
    await expect(loginPage.validationMessage).toBeVisible();
  });

  // --- Edge Cases ---

  test('should handle SQL injection in username field', async () => {
    await loginPage.login("admin'--@test.com", 'password');
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should handle XSS payload in username field', async () => {
    await loginPage.login('<script>alert("xss")</script>', 'password');
    await expect(loginPage.errorMessage).toBeVisible();
  });
});
