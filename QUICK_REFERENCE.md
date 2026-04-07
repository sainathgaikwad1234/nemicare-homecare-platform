# Nemicare Development - Quick Reference

## 🚀 Getting Started (5 minutes)

### Clone & Setup
```bash
cd HomeCare-Project-Development
npm install
cd automation
npm install
npx playwright install
cd ..
```

### Environment
```bash
# Copy example config
cp automation/.env.example automation/.env
# Edit with your app URL and test credentials
```

---

## 📂 Project Structure at a Glance

```
agents/              → AI-powered documentation & test generation
automation/          → Playwright E2E/API/Visual tests (start here!)
project-docs/        → Client requirements, wireframes, user stories
tasks/               → Step-by-step workflow guides
templates/           → Output templates for reports
checklists/          → Testing checklists (smoke, regression, release)
```

---

## 🧠 Key Insights

| Aspect | Details |
|--------|---------|
| **Project** | Nemicare HomeCare Platform (healthcare facility mgmt) |
| **Portals** | Facility, Family, HRMS, Super Admin (4 distinct UIs) |
| **Users** | 22+ discovery meetings, 200+ user stories |
| **State** | Active development, requirements-complete |
| **Team** | 8-12 people for 3.5-month delivery |

---

## 🎯 Phase Breakdown (High-Level)

| Phase | Timeline | Focus | Artifacts |
|-------|----------|-------|-----------|
| **1: Foundation** | Weeks 1-2 | Requirements, architecture, setup | SRS, Schema, APIs |
| **2: Backend** | Weeks 3-6 | Core services, all APIs, tests | Node.js APIs, Unit tests |
| **3: Frontend** | Weeks 7-10 | 4 portals, responsive, accessible | React/Vue SPA |
| **4: Testing** | Weeks 11-12 | E2E, security, performance tests | 50+ E2E tests |
| **5: UAT** | Weeks 13-14 | Client acceptance, production deploy | Live deployment |

---

## 🧪 Using AI Agents

### Generate SRS Document
📄 Follow: `agents/srs-agent.md`
- Input: project-docs/ (user stories, wireframes, MOMs)
- Output: Formal SRS document

### Write Automated Tests
🤖 Follow: `agents/automation-agent.md`
- Input: Application URL + credentials
- Output: Playwright E2E test suite

### Generate Test Cases
📋 Follow: `agents/test-case-generator.md`
- Input: User stories or features
- Output: Manual test case document

### API Testing
🔌 Follow: `agents/api-test-agent.md`
- Input: API specs/endpoints
- Output: API test suite

### Other Agents Available
- Bug reporter, MOM generator, test data, security testing, performance testing

---

## 🧪 Testing Standards

### Unit Tests (Backend)
- Target: 80%+ coverage
- Framework: Jest
- Command: `npm test`

### E2E Tests (Automation)
- Target: 50+ critical workflows
- Framework: Playwright
- Command: `npm run test:e2e`

### API Tests
- Target: 100% endpoint coverage
- Framework: Supertest/Mocha
- Command: `npm run test:api`

---

## 🔒 Security Checklist

- [ ] Environment variables never in code
- [ ] HTTPS only in production
- [ ] JWT tokens with 15min expiry
- [ ] OWASP top 10 mitigations
- [ ] Data encryption at-rest for PII
- [ ] SQL injection prevention (parameterized queries)
- [ ] CORS properly configured
- [ ] Rate limiting on APIs

---

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| API response time | <50ms (95th %) |
| First Contentful Paint | <2s |
| API load @ 1000 users | <2s response |
| Database query time | <100ms (95th %) |
| Lighthouse score | >90 (all metrics) |

---

## 📞 Quick Contacts

| Role | Responsibility |
|------|-----------------|
| **Tech Lead** | Architecture, decisions, code review |
| **Frontend Lead** | UI/UX across 4 portals |
| **Backend Lead** | APIs, database, integrations |
| **QA Lead** | Test strategy, automation, quality gates |

---

## 📚 Documentation Links

- [Full Development Plan](DEVELOPMENT_PLAN.md)
- [User Stories](project-docs/user-stories/)
- [Wireframes](project-docs/figma-screens/)
- [Meeting Notes](project-docs/Existing-MoM/)
- [QA Framework](BMAD.md)

---

## ⏱️ Common Commands

```bash
# Testing
npm test                    # All unit tests
npm run test:e2e           # E2E tests
npm run test:api           # API tests
npm run test:headed        # See browser while running
npm run test:debug         # Debug mode

# Development
npm run start               # Start dev server
npm run build               # Production build
npm run lint                # Lint & format check
npm run format              # Auto-format code

# Automation
npx playwright test          # Run all tests
npx playwright test --headed # Run with browser visible
npx playwright codegen       # Record test script
```

---

## 🎓 Learning Path

1. **Day 1**: Review this quick reference + DEVELOPMENT_PLAN.md
2. **Day 2**: Run sample tests in `automation/tests/e2e/`
3. **Day 3**: Review Figma wireframes (understand UI)
4. **Day 4**: Review user stories (understand requirements)
5. **Day 5**: Start assigned phase (backend/frontend/testing)

---

**Last Updated**: April 4, 2026  
**Version**: 1.0
