# Task: Create Test Strategy

## Agent: QA Architect
## Trigger: When starting testing for a new project or feature

## Inputs Required
- Path to frontend code
- Path to backend code
- Brief description of the application/feature

## Steps

### 1. Project Discovery
- [ ] Read the project README and documentation
- [ ] Identify the tech stack (frontend framework, backend framework, database)
- [ ] Understand the deployment architecture

### 2. Code Analysis
- [ ] Map all frontend pages/components
- [ ] Map all backend API endpoints
- [ ] Identify authentication/authorization mechanisms
- [ ] Identify third-party integrations
- [ ] Identify database operations (CRUD)

### 3. Feature Inventory
- [ ] List all user-facing features
- [ ] List all admin/internal features
- [ ] Identify critical business flows
- [ ] Identify data input points

### 4. Risk Assessment
- [ ] Rate each feature by risk level (Critical/High/Medium/Low)
- [ ] Identify areas with complex business logic
- [ ] Identify areas handling sensitive data
- [ ] Identify areas with third-party dependencies

### 5. Strategy Document
- [ ] Define test scope (in-scope / out-of-scope)
- [ ] Define test types needed per feature
- [ ] Create priority matrix
- [ ] Define test environment requirements
- [ ] Define test data requirements
- [ ] Estimate test case count per module

### 6. Output
- [ ] Save test strategy to project using `templates/test-strategy-template.md`
- [ ] Recommend next agent to invoke

## Output Location
Save to: `[project-root]/test-strategy.md`
