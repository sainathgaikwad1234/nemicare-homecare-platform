# Task: Generate Test Cases

## Agent: Test Case Generator
## Trigger: After test strategy is created, or when a new feature needs test cases

## Inputs Required
- Feature name or module to test
- Frontend code for the feature
- Backend code for the feature
- Test strategy document (if available)

## Steps

### 1. Feature Analysis
- [ ] Read all frontend components related to the feature
- [ ] Read all backend handlers/controllers for the feature
- [ ] Identify all user interactions (clicks, inputs, navigation)
- [ ] Identify all validations (client-side and server-side)
- [ ] Identify all possible states and transitions

### 2. Scenario Identification
- [ ] List all positive/happy path scenarios
- [ ] List all negative scenarios (invalid inputs, unauthorized access)
- [ ] List all edge cases (boundary values, empty states, max limits)
- [ ] List all integration scenarios (cross-feature interactions)
- [ ] List all error handling scenarios (network failure, server error)
- [ ] List security-related scenarios (injection, XSS, CSRF)

### 3. Test Case Writing
- [ ] Write test cases using `templates/test-case-template.md`
- [ ] Assign unique IDs: TC-[MODULE]-[NUMBER]
- [ ] Set priority: Critical / High / Medium / Low
- [ ] Define clear preconditions
- [ ] Write step-by-step reproduction steps
- [ ] Define expected results for each step

### 4. Review & Organize
- [ ] Group test cases by module/feature
- [ ] Create summary table with counts by priority
- [ ] Mark test cases suitable for automation
- [ ] Mark test cases requiring specific test data
- [ ] Flag unclear requirements or assumptions

### 5. Output
- [ ] Save test cases to project
- [ ] Handoff automation-suitable cases to Automation Agent
- [ ] Handoff API cases to API Test Agent
- [ ] Request test data from Test Data Agent if needed

## Output Location
Save to: `[project-root]/test-cases/[feature-name]-test-cases.md`
