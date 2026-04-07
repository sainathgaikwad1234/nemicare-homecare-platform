const { faker } = require('@faker-js/faker');

/**
 * TestDataFactory - Generates test data for all entities.
 * Uses faker.js for realistic dynamic data.
 */
class TestDataFactory {
  /**
   * Generate a valid user object
   * @param {Object} overrides - Fields to override defaults
   * @returns {Object} User data
   */
  static createUser(overrides = {}) {
    return {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      password: 'TestPass123!',
      role: 'user',
      ...overrides,
    };
  }

  /**
   * Generate multiple users
   * @param {number} count
   * @param {Object} overrides
   * @returns {Array}
   */
  static createUsers(count, overrides = {}) {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  /** Invalid user data for negative testing */
  static get invalidUsers() {
    return {
      missingEmail: { name: 'John Doe', password: 'Pass123!' },
      invalidEmail: { email: 'not-an-email', name: 'John', password: 'Pass123!' },
      shortPassword: { email: 'john@test.com', name: 'John', password: '12' },
      emptyFields: { email: '', name: '', password: '' },
      sqlInjection: { email: "admin'--@test.com", name: "'; DROP TABLE users;--", password: 'Pass123!' },
      xssPayload: { email: 'xss@test.com', name: '<script>alert("xss")</script>', password: 'Pass123!' },
    };
  }

  /** Credentials for login testing */
  static get credentials() {
    return {
      valid: {
        email: process.env.TEST_USER_EMAIL || 'testuser@example.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPass123!',
      },
      admin: {
        email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
        password: process.env.TEST_ADMIN_PASSWORD || 'AdminPass123!',
      },
      invalid: {
        email: 'wrong@example.com',
        password: 'WrongPassword123!',
      },
    };
  }
}

module.exports = { TestDataFactory };
