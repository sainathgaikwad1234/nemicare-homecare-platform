# Task: Run API Tests

## Agent: API Test Agent
## Trigger: When backend API endpoints need testing

## Inputs Required
- Backend code (routes, controllers, middleware, models)
- API documentation (if available)
- Base URL for the API

## Steps

### 1. API Discovery
- [ ] Read all route definitions in backend code
- [ ] Read all controller/handler functions
- [ ] Read all middleware (auth, validation, rate limiting)
- [ ] Read all data models/schemas
- [ ] Create API endpoint inventory table

### 2. Auth Setup
- [ ] Identify authentication mechanism (JWT, session, API key)
- [ ] Create auth helper to get valid tokens
- [ ] Prepare tokens for different roles (admin, user, guest)

### 3. Write API Tests
For each endpoint:
- [ ] Test successful request (200/201)
- [ ] Test with missing required fields (400)
- [ ] Test without authentication (401)
- [ ] Test with wrong role/permissions (403)
- [ ] Test with non-existent resource (404)
- [ ] Test with duplicate/conflict data (409)
- [ ] Test edge cases (empty strings, special characters, long values)
- [ ] Validate response schema
- [ ] Validate response headers

### 4. Run Tests
- [ ] Run all API tests: `npx playwright test tests/api/`
- [ ] Review test results
- [ ] Fix any test issues
- [ ] Generate coverage report

### 5. Output
- [ ] All API test files saved
- [ ] API coverage summary
- [ ] List of bugs found → Bug Reporter Agent
- [ ] Missing test data → Test Data Agent

## Output Location
- Tests: `automation/tests/api/[resource].api.spec.js`
