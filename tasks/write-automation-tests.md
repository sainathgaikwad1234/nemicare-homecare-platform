# Task: Write Automation Tests

## Agent: Automation Agent
## Trigger: After test cases are generated, or when automation is directly requested

## Inputs Required
- Frontend code (components, pages, routes)
- Test cases to automate (from Test Case Generator)
- Application URL (local/staging)

## Steps

### 1. Framework Setup Check
- [ ] Verify `automation/package.json` exists with dependencies
- [ ] Verify `automation/playwright.config.js` is configured
- [ ] Verify `.env` file has required variables (BASE_URL, credentials)
- [ ] Run `npm install` if needed

### 2. Identify Page Objects Needed
- [ ] List all pages/views involved in test cases
- [ ] For each page, identify key elements and their selectors
- [ ] Check for existing data-testid attributes in source code
- [ ] Recommend adding data-testid where missing

### 3. Create Page Objects
- [ ] Create `pages/BasePage.js` with common methods (if not exists)
- [ ] Create page object for each page under test
- [ ] Define locators using best practices (data-testid > role > text > CSS)
- [ ] Add action methods (login, fillForm, submitOrder, etc.)
- [ ] Add assertion helper methods (isVisible, hasText, etc.)

### 4. Write Test Files
- [ ] Create test file per feature: `tests/e2e/[feature].spec.js`
- [ ] Implement `beforeEach` / `afterEach` hooks
- [ ] Write test for each automated test case
- [ ] Follow naming: `should [expected] when [condition]`
- [ ] Use proper assertions with `expect`
- [ ] Handle async operations with proper waits

### 5. Add Fixtures & Test Data
- [ ] Import test data from `fixtures/test-data.js`
- [ ] Set up authentication fixture if needed
- [ ] Create any custom fixtures required

### 6. Verify & Run
- [ ] Run tests: `npx playwright test`
- [ ] Fix any failing tests
- [ ] Run in headed mode to visually verify: `npx playwright test --headed`
- [ ] Generate report: `npx playwright show-report`

### 7. Output
- [ ] All test files saved in `automation/tests/`
- [ ] All page objects saved in `automation/pages/`
- [ ] Report any bugs found to Bug Reporter Agent
- [ ] Report coverage summary

## Output Location
- Tests: `automation/tests/e2e/[feature].spec.js`
- Pages: `automation/pages/[PageName].js`
