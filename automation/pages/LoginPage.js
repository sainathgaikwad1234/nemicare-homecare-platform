const { BasePage } = require('./BasePage');

/**
 * LoginPage - Page object for the BrightCare login page.
 * URL: /auth/login
 */
class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    this.usernameInput = page.getByRole('textbox', { name: 'Enter your username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Enter Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.closePopupButton = page.getByRole('button', { name: 'close' });
    this.errorMessage = page.getByRole('alert');                              // API-level errors (invalid credentials)
    this.validationMessage = page.getByText('Please enter your details');    // Client-side field validation
  }

  /** Navigate to login page */
  async goto() {
    await super.goto('/auth/login');
  }

  /**
   * Perform login action
   * @param {string} email - User email/username
   * @param {string} password
   */
  async login(email, password) {
    await this.usernameInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Dismiss the welcome/notification popup shown after login, if present
   */
  async dismissPopup() {
    if (await this.closePopupButton.isVisible()) {
      await this.closePopupButton.click();
    }
  }

  /** Get error message text */
  async getErrorText() {
    return await this.getText(this.errorMessage);
  }

  /** Check if error message is visible */
  async isErrorVisible() {
    return await this.isVisible(this.errorMessage);
  }
}

module.exports = { LoginPage };
