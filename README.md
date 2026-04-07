# BMAD QA Agent System

A multi-agent QA testing system built for **Claude Code in VSCode**. Provide your application URL or source code, and these AI agents will plan, write, automate, and report on testing — end to end.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Setup](#setup)
- [Project Structure](#project-structure)
- [Agents Overview](#agents-overview)
  - [Automation Agent](#1-automation-agent)
  - [QA Architect](#2-qa-architect)
  - [Test Case Generator](#3-test-case-generator)
  - [API Test Agent](#4-api-test-agent)
  - [Test Data Agent](#5-test-data-agent)
  - [Bug Reporter](#6-bug-reporter)
  - [MOM Agent](#7-mom-agent)
  - [User Stories Agent](#8-user-stories-agent)
  - [Retest Agent](#9-retest-agent)
  - [SRS Agent](#10-srs-agent)
- [Agent Workflow](#agent-workflow)
- [Automation Framework](#automation-framework)
  - [Site Explorer (Mode A)](#site-explorer-mode-a)
  - [Direct Automation (Mode B)](#direct-automation-mode-b)
  - [Running Tests](#running-tests)
- [Templates & Checklists](#templates--checklists)
- [MCP Server Setup](#mcp-server-setup-jira-figma-github)
- [Configuration](#configuration)
- [Contributing](#contributing)

---

## Quick Start

```bash
# 1. Clone the repo
git clone git@github.com:agammishra18/BMAD-QA-AGENTS.git
cd BMAD-QA-AGENTS

# 2. Install Python dependencies (for DOCX/XLSX generation)
pip install -r scripts/requirements.txt

# 3. Install automation dependencies
cd automation
npm install
npx playwright install
cp .env.example .env    # Edit with your app URL and credentials
cd ..

# 4. Open in VSCode with Claude Code extension
# 5. Invoke any agent using slash commands:
#    /automation-agent
#    /test-case-generator
#    /qa-architect
#    /api-test-agent
#    /bug-reporter
#    /test-data-agent
#    /mom-agent
#    /user-stories-agent
#    /retest-agent
#    /srs-agent
```

---

## Setup

### Prerequisites

| Requirement | Version | Needed For |
|-------------|---------|------------|
| Node.js | 18+ | Automation framework (Playwright) |
| npm | 9+ | Automation framework |
| Python | 3.9+ | DOCX/XLSX generation (SRS, MOM, User Stories agents) |
| pip | Latest | Python dependency management |
| VSCode | Latest | IDE |
| Claude Code Extension | Latest | Agent execution |

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:agammishra18/BMAD-QA-AGENTS.git
   cd BMAD-QA-AGENTS
   ```

2. **Install Python dependencies** (for DOCX/XLSX generation)
   ```bash
   pip install -r scripts/requirements.txt
   ```

3. **Install Playwright and automation dependencies**
   ```bash
   cd automation
   npm install
   npx playwright install        # Downloads browser binaries (Chromium, Firefox, WebKit)
   cd ..
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your values:
   ```env
   BASE_URL=http://localhost:3000          # Your app URL
   API_BASE_URL=http://localhost:3000/api  # Your API base URL
   TEST_USER_EMAIL=testuser@example.com    # Test user credentials
   TEST_USER_PASSWORD=TestPass123!
   TEST_ADMIN_EMAIL=admin@example.com      # Admin credentials
   TEST_ADMIN_PASSWORD=AdminPass123!
   CI=false
   ```

5. **Open in VSCode**
   - Open the `BMAD-QA-AGENTS` folder in VSCode
   - Ensure Claude Code extension is installed and active
   - Invoke agents using `/agent-name` slash commands

### Slash Commands

All agents are registered as Claude Code slash commands via `.claude/commands/`:

| Command | Agent |
|---------|-------|
| `/automation-agent` | Automation Agent |
| `/test-case-generator` | Test Case Generator |
| `/qa-architect` | QA Architect |
| `/api-test-agent` | API Test Agent |
| `/test-data-agent` | Test Data Agent |
| `/bug-reporter` | Bug Reporter |
| `/mom-agent` | MOM Agent |
| `/user-stories-agent` | User Stories Agent |
| `/retest-agent` | Retest Agent |
| `/srs-agent` | SRS Agent |

### MCP Server Setup (Jira, Figma, GitHub)

Some agents (like **Retest Agent**) require MCP (Model Context Protocol) servers to interact with external services. Here's how to set them up in VSCode:

#### Step 1: Open MCP Search in VSCode

1. Open **Claude Code** in VSCode
2. Type `/` in the chat input to open the command menu
3. Select **MCP Server Search** (or press `Cmd+Shift+P` → search "Claude: MCP")
4. This opens the MCP marketplace where you can browse and install servers

#### Step 2: Install Atlassian (Jira) MCP

1. In the MCP search, search for **"Atlassian"**
2. Click **Install** on the **Atlassian Rovo MCP Server**
3. It will run:
   ```bash
   claude mcp add atlassian -- npx -y @anthropic-ai/mcp-remote@latest https://mcp.atlassian.com/v1/sse
   ```
4. A browser window will open — **log in with your Atlassian account** and authorize access
5. Once authorized, the Jira MCP tools will be available (query issues, update tickets, add comments, transition statuses)

**Used by:** Retest Agent (fetch "Ready for Testing" bugs, update ticket status, add verification comments)

#### Step 3: Install Figma MCP

1. In the MCP search, search for **"Figma"**
2. Click **Install** on the **Figma MCP Server**
3. You'll need a **Figma Personal Access Token**:
   - Go to Figma → **Settings** → **Personal access tokens**
   - Click **Create a new personal access token**
   - Copy the token
4. It will run:
   ```bash
   claude mcp add figma -- npx -y figma-developer-mcp --figma-api-key=YOUR_FIGMA_TOKEN
   ```
5. Replace `YOUR_FIGMA_TOKEN` with your actual token

**Used by:** Any agent that needs design context — extract components, styles, and layouts from Figma files for test case generation or UI validation

#### Step 4: Install GitHub MCP

1. In the MCP search, search for **"GitHub"**
2. Click **Install** on the **GitHub MCP Server**
3. It will run:
   ```bash
   claude mcp add github -- npx -y @anthropic-ai/mcp-remote@latest https://api.githubcopilot.com/mcp/
   ```
4. A browser window will open — **log in with your GitHub account** and authorize access
5. Once authorized, GitHub tools will be available (repos, PRs, issues, branches, commits)

**Used by:** Retest Agent (verify fix commits in deployed branches, read code diffs), Automation Agent (read source code from repos)

#### Verify MCP Servers

After installing, verify your MCP servers are active:

```bash
claude mcp list
```

You should see all three servers listed:

```
atlassian: npx -y @anthropic-ai/mcp-remote@latest https://mcp.atlassian.com/v1/sse
figma: npx -y figma-developer-mcp --figma-api-key=***
github: npx -y @anthropic-ai/mcp-remote@latest https://api.githubcopilot.com/mcp/
```

#### MCP Summary

| MCP Server | Auth Method | What It Enables |
|------------|-------------|-----------------|
| **Atlassian** | OAuth (browser) | Query Jira issues, update tickets, add comments, transition statuses |
| **Figma** | Personal Access Token | Read Figma designs, extract components, get design specs |
| **GitHub** | OAuth (browser) | Access repos, PRs, issues, read code, check branches & commits |

---

## Project Structure

```
BMAD-QA-AGENTS/
├── README.md                        # This file
├── BMAD.md                          # Master guide for the agent system
├── .claude/commands/                # Slash command definitions for Claude Code
│
├── agents/                          # Agent prompt definitions
│   ├── automation-agent.md          # Playwright test automation (dual-mode)
│   ├── qa-architect.md              # Test strategy and risk analysis
│   ├── test-case-generator.md       # Manual test case generation
│   ├── api-test-agent.md            # API endpoint testing
│   ├── test-data-agent.md           # Test data and fixtures
│   ├── bug-reporter.md              # Bug report generation
│   ├── mom-agent.md                 # Minutes of Meeting
│   ├── user-stories-agent.md        # User story extraction
│   ├── retest-agent.md              # QA Retest Sentinel
│   └── srs-agent.md                 # SRS document generator
│
├── automation/                      # Playwright test framework
│   ├── playwright.config.js         # Playwright configuration
│   ├── package.json                 # Dependencies and scripts
│   ├── .env.example                 # Environment template
│   ├── .env                         # Your environment (git-ignored)
│   ├── pages/                       # Page Object Model classes
│   │   ├── BasePage.js              # Base page with shared methods
│   │   └── LoginPage.js             # Login page object (sample)
│   ├── tests/
│   │   ├── e2e/                     # End-to-end test specs
│   │   ├── api/                     # API test specs
│   │   └── visual/                  # Visual regression tests
│   ├── fixtures/                    # Test data and auth setup
│   │   ├── test-data.js             # TestDataFactory with Faker.js
│   │   └── auth.setup.js            # Authentication setup fixture
│   ├── utils/                       # Helper utilities
│   │   ├── helpers.js               # General helpers
│   │   └── api-helpers.js           # API request helpers
│   ├── config/                      # Agent config files
│   │   └── qa-retest-config.json   # Retest agent configuration
│   └── explorer/                    # Site Explorer module (Mode A)
│       ├── site-explorer.js         # Main entry point
│       ├── crawler.js               # BFS page crawler
│       ├── page-analyzer.js         # DOM analysis engine
│       ├── login-handler.js         # Auto-login handler
│       ├── report-generator.js      # JSON + Markdown report generator
│       ├── config.js                # Explorer configuration
│       └── screenshots/             # Captured screenshots (git-ignored)
│
├── outputs/                         # Agent output files
│   ├── automation-agent/            # Exploration reports, test coverage
│   ├── qa-architect/                # Test strategy documents
│   ├── test-case-generator/         # Manual test cases
│   ├── api-test-agent/              # API inventory and coverage
│   ├── test-data-agent/             # Data model documentation
│   ├── bug-reporter/                # Bug reports
│   ├── mom-agent/                   # Minutes of Meeting (.md, .docx)
│   ├── user-stories-agent/          # User stories (.md, .xlsx)
│   ├── retest-agent/               # Retest sweep reports
│   └── srs-agent/                  # SRS documents
│
├── project-docs/                    # Input documents for MOM & User Stories agents
│   ├── transcripts/                 # Meeting transcripts
│   ├── recordings/                  # Video recording references
│   ├── ba-workflows/                # BA workflow documents
│   ├── client-documents/            # Client-shared specs and docs
│   └── screenshots/                 # Wireframes, mockups
│
├── scripts/                         # Utility scripts
│   ├── md-to-docx.py               # Markdown to DOCX converter (python-docx)
│   └── requirements.txt            # Python dependencies
│
├── templates/                       # Output format templates
│   ├── test-strategy-template.md
│   ├── test-case-template.md
│   ├── bug-report-template.md
│   ├── mom-template.md
│   └── user-story-template.md
│
├── tasks/                           # Step-by-step task workflows
│   ├── create-test-strategy.md
│   ├── generate-test-cases.md
│   ├── write-automation-tests.md
│   ├── run-api-tests.md
│   ├── report-bugs.md
│   ├── run-retest-sweep.md
│   └── generate-srs.md
│
└── checklists/                      # Testing checklists
    ├── smoke-test.md
    ├── regression.md
    └── release-checklist.md
```

---

## Agents Overview

### 1. Automation Agent

> **Role:** Senior QA Automation Engineer — writes Playwright tests using Page Object Model (POM)

**Supports two modes:**

| | Mode A: Exploratory | Mode B: Direct Automation |
|--|---------------------|--------------------------|
| **How** | Launches a real browser, logs in, crawls the app | Reads your source code directly |
| **Best for** | No source code available, want comprehensive discovery | Have source code, know what to test |
| **Input** | URL + credentials | Source code path + feature name |
| **Process** | Crawl -> Screenshot -> Analyze -> Test cases -> Review -> Automation | Read code -> Page objects -> Test specs |

**Accepts:**
- Application URL and login credentials (Mode A)
- Frontend/backend source code (Mode B)
- Existing test cases from Test Case Generator

**Produces:**
| Output | Location |
|--------|----------|
| Exploration report (JSON + MD) | `outputs/automation-agent/` |
| Screenshots | `automation/explorer/screenshots/` |
| Test cases from exploration | `outputs/automation-agent/test-cases-from-exploration.md` |
| Page Object classes | `automation/pages/` |
| E2E test specs | `automation/tests/e2e/` |

**Critical Rule:** If login fails, the agent takes a screenshot, saves a failure report, and **stops immediately**. No crawling or test generation occurs until credentials are fixed.

**Invoke:** `/automation-agent`

**Hands off to:** Bug Reporter (bugs found), Test Data Agent (data needed), QA Architect (coverage gaps)

---

### 2. QA Architect

> **Role:** Senior QA Architect — creates test strategies and risk assessments

**Accepts:**
- Frontend code (components, routes, state management, API calls)
- Backend code (controllers, services, models, routes, middleware)

**Produces:**
| Output | Location |
|--------|----------|
| Test strategy document | `outputs/qa-architect/` |
| Feature-to-test mapping table | `outputs/qa-architect/` |
| Risk assessment matrix | `outputs/qa-architect/` |
| Recommended test counts per area | `outputs/qa-architect/` |

**Invoke:** `/qa-architect`

**Hands off to:** Test Case Generator, Automation Agent, API Test Agent, Test Data Agent

---

### 3. Test Case Generator

> **Role:** Senior QA Engineer — generates comprehensive manual test cases

**Accepts:**
- Frontend code (components, forms, validations)
- Backend code (API handlers, business logic)
- Requirements / user stories

**Produces:**
| Output | Location |
|--------|----------|
| Manual test cases (TC-MODULE-NNN format) | `outputs/test-case-generator/` |
| Summary table (by priority & category) | `outputs/test-case-generator/` |

**Coverage per feature:**
- 2-3 positive scenarios
- 3-4 negative scenarios
- 2-3 edge/boundary cases
- 1 security scenario
- 1 error handling scenario

**Invoke:** `/test-case-generator`

**Hands off to:** Automation Agent (automate cases), API Test Agent (API cases), Test Data Agent (data needs)

---

### 4. API Test Agent

> **Role:** Senior API Test Engineer — writes Playwright API tests

**Accepts:**
- Backend code (route definitions, controllers, middleware, models)

**Produces:**
| Output | Location |
|--------|----------|
| API inventory table | `outputs/api-test-agent/` |
| API test specs | `automation/tests/api/` |
| Coverage report | `outputs/api-test-agent/` |

**Test categories:** Status codes, request validation, authentication, authorization, error handling, pagination, edge cases

**Invoke:** `/api-test-agent`

**Hands off to:** Bug Reporter (failing tests), Test Data Agent (test data), QA Architect (coverage)

---

### 5. Test Data Agent

> **Role:** Test Data Engineer — generates test data, fixtures, mocks, and factories

**Accepts:**
- Backend models/schemas (Mongoose, Sequelize, Prisma, SQL)
- Entity relationships, field types, constraints

**Produces:**
| Output | Location |
|--------|----------|
| TestDataFactory (Faker.js) | `automation/fixtures/test-data.js` |
| Mock API responses | `automation/fixtures/mock-responses.js` |
| Auth setup fixture | `automation/fixtures/auth.setup.js` |
| Per-entity data files | `automation/fixtures/[entity].data.js` |
| Data model documentation | `outputs/test-data-agent/` |

**Invoke:** `/test-data-agent`

**Hands off to:** Automation Agent (E2E fixtures), API Test Agent (mock responses), QA Architect (data gaps)

---

### 6. Bug Reporter

> **Role:** Senior QA Engineer — creates structured, actionable bug reports

**Accepts:**
- Error messages and stack traces
- Test failure output
- Relevant source code
- Screenshots / recordings

**Produces:**
| Output | Location |
|--------|----------|
| Bug reports (BUG-MODULE-NNN format) | `outputs/bug-reporter/` |
| Bug summary with trends | `outputs/bug-reporter/` |

**Each report includes:** Summary, environment, severity/priority, steps to reproduce, expected vs actual, root cause analysis, suggested fix, test evidence

**Invoke:** `/bug-reporter`

**Hands off to:** QA Architect (critical bugs), Automation Agent (test bugs), API Test Agent (API bugs)

---

### 7. MOM Agent

> **Role:** Senior Business Analyst — generates structured Minutes of Meeting

**Accepts:**
- Meeting transcripts (`.md`, `.txt`, `.docx`)
- Call recordings / references
- BA workflow documents
- Client-shared documents
- All from `project-docs/` folder

**Produces:**
| Output | Location |
|--------|----------|
| MOM document (`.md`) | `outputs/mom-agent/MOM-YYYY-MM-DD-topic.md` |
| MOM document (`.docx`, optional) | `outputs/mom-agent/MOM-YYYY-MM-DD-topic.docx` |

**MOM includes:** Header, executive summary, discussion summary, key decisions, action items (with owners & deadlines), open items

**Invoke:** `/mom-agent`

**Hands off to:** User Stories Agent (extractable stories), Test Case Generator (test scenarios), QA Architect (technical requirements)

---

### 8. User Stories Agent

> **Role:** Senior Business Analyst & Product Owner — extracts user stories from project documents

**Accepts:**
- Meeting transcripts, MOMs
- BA workflows, client documents
- Any project materials from `project-docs/`

**Produces:**
| Output | Location |
|--------|----------|
| User stories grouped by epic (`.md`) | `outputs/user-stories-agent/` |
| User stories spreadsheet (`.xlsx`, optional) | `outputs/user-stories-agent/` |

**Story format:** `As a [role], I want [feature], So that [benefit]` with Given/When/Then acceptance criteria

**Naming:** Epics as `EPIC-[MODULE]`, Stories as `[EPIC-ID]-US-[NUMBER]`

**Invoke:** `/user-stories-agent`

**Hands off to:** Test Case Generator, QA Architect, API Test Agent, MOM Agent

---

### 9. Retest Agent

> **Role:** Senior Automation Engineer & Release Gatekeeper — validates bug fixes, verifies deployments, retests via browser, manages Jira lifecycle, reports to Google Chat

**5-Phase Workflow:**

| Phase | What it Does |
|-------|-------------|
| 1. Jira Query | Fetches "Ready for Testing" bug tickets |
| 2. Deploy Check | Verifies fix commits exist in deployed branches (FE + BE repos) |
| 3. Retest | Logs into QA env, replicates bug steps, verifies fix, checks for regressions |
| 4. Ticket Update | Transitions tickets to DONE (fixed) or REOPEN (still broken) with evidence |
| 5. Report | Sends Google Chat summary and saves detailed report |

**Accepts:**
- Jira project with "Ready for Testing" bug tickets
- Config file at `automation/config/qa-retest-config.json`

**Produces:**
| Output | Location |
|--------|----------|
| Retest sweep report | `outputs/retest-agent/retest-report-YYYY-MM-DD.md` |
| Screenshots (fix evidence) | `automation/explorer/screenshots/` |
| Google Chat notification | Sent to configured webhook |
| Jira comments + transitions | Updated directly on tickets |

**Config file** (`automation/config/qa-retest-config.json`):
```json
{
  "JIRA_PROJECT_KEY": "PROJ",
  "QA_ENV_URL": "https://your-qa-env.com/",
  "QA_USERNAME": "qa@example.com",
  "QA_PASSWORD": "password",
  "FE_REPO_BRANCH": "main",
  "BE_REPO_BRANCH": "qa",
  "GOOGLE_CHAT_WEBHOOK_URL": "https://chat.googleapis.com/...",
  "FE_REPO_URL": "https://github.com/org/frontend.git",
  "BE_REPO_URL": "https://github.com/org/backend.git"
}
```

**Critical Rule:** Login failure = STOP (same rule as Automation Agent). Takes screenshot, saves failure report, halts all retesting.

**Invoke:** `/retest-agent`

**Hands off to:** Bug Reporter (reopened bugs), Automation Agent (regression test cases), QA Architect (strategy gaps)

---

### 10. SRS Agent

> **Role:** Senior Business Analyst & Requirements Engineer — generates comprehensive SRS documents from project docs

**Accepts:**
- Documents from `project-docs/` only (MOMs, transcripts, BA workflows, client specs)
- Supported formats: `.md`, `.txt`, `.docx`
- Auto-scans `project-docs/` subfolders: `Existing-MoM/`, `transcripts/`, `ba-workflows/`, `client-documents/`, `screenshots/`

**Process:**
1. Scan `project-docs/` and ask user which documents to include
2. Analyze all selected documents — extract requirements, actors, features, constraints
3. Cross-reference across docs — flag conflicts and gaps
4. Generate full SRS (IEEE 830 standard)
5. Convert to DOCX using `python3 scripts/md-to-docx.py`
6. Present for review and iteration

**Produces:**
| Output | Location |
|--------|----------|
| SRS document (`.docx`) — primary | `outputs/srs-agent/SRS-{project}-{date}.docx` |
| SRS document (`.md`) — reference | `outputs/srs-agent/SRS-{project}-{date}.md` |

**SRS includes:** Introduction & scope, functional requirements (FR-MODULE-NNN), non-functional requirements (NFR-CATEGORY-NNN), data model, API interfaces, use cases (UC-NNN), traceability matrix, open items & gaps

**Requires:** `pip install -r scripts/requirements.txt` (python-docx)

**Invoke:** `/srs-agent`

**Hands off to:** QA Architect (test strategy from SRS), Test Case Generator (test cases from requirements), API Test Agent (API specs), Automation Agent (use cases for E2E tests)

---

## Agent Workflow

```
Project Documents (transcripts, recordings, BA workflows)
       |
       +---> /mom-agent -----------> Minutes of Meeting ---+
       |                                                    |
       +---> /user-stories-agent --> Epics & User Stories --+
                |                                           |
                v                                           v
       /srs-agent ----------------> SRS Document
                |
                v
Your Application (URL or source code)
       |
       v
 /qa-architect ---------> Test Strategy & Risk Analysis
       |
       v
 /test-case-generator --> Manual Test Cases
       |
       +---> /automation-agent --> Playwright E2E Tests (Mode A or B)
       |
       +---> /api-test-agent ----> API Endpoint Tests
       |
       +---> /test-data-agent ---> Fixtures, Mocks & Factory Data
              |
              v
       /bug-reporter -----------> Structured Bug Reports
              |
              v
       /retest-agent ----------> Verify Fixes, Update Jira, Report
```

### Recommended Order for New Projects

1. `/mom-agent` — Document meetings and decisions
2. `/user-stories-agent` — Extract user stories and acceptance criteria
3. `/qa-architect` — Create test strategy and risk assessment
4. `/test-case-generator` — Generate manual test cases
5. `/automation-agent` — Automate test cases with Playwright
6. `/api-test-agent` — Write API endpoint tests
7. `/test-data-agent` — Generate test data and fixtures
8. `/bug-reporter` — Report any bugs found
9. `/retest-agent` — Verify bug fixes and close the loop
10. `/srs-agent` — Generate SRS from project documents

---

## Automation Framework

### Site Explorer (Mode A)

The Site Explorer launches a real browser, logs into your app, crawls pages, and generates a detailed report.

```bash
cd automation

# Basic exploration (no auth)
npm run explore -- --url https://myapp.com

# With authentication
npm run explore -- --url https://myapp.com --email user@test.com --password Pass123!

# Quick scan (depth 1, max 10 pages)
npm run explore:quick -- --url https://myapp.com

# Deep scan (depth 5, max 100 pages)
npm run explore:deep -- --url https://myapp.com

# Custom limits
npm run explore -- --url https://myapp.com --max-depth 2 --max-pages 20
```

**CLI Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--url` | Application URL (required) | — |
| `--email` | Login email/username | — |
| `--password` | Login password | — |
| `--login-path` | Explicit login page path | Auto-detected |
| `--max-depth` | Max crawl depth | 3 |
| `--max-pages` | Max pages to visit | 50 |
| `--headless` | Run headless (no visible browser) | false |
| `--output-dir` | Custom output directory | `outputs/automation-agent/` |

**What it extracts per page:**
- Links (navigation and content)
- Buttons (text, type, test IDs)
- Forms (fields, types, required, labels, validation attributes)
- Tables (headers, row counts)
- Interactive elements (dropdowns, tabs, modals, accordions)
- Headings (h1-h6 hierarchy)
- ARIA landmarks
- UI patterns (pagination, search, sorting, filters, breadcrumbs)

**Login failure behavior:**
If login fails, the explorer takes a screenshot, saves a failure report (JSON + MD), and exits with code 1. It does **not** continue crawling.

---

### Direct Automation (Mode B)

When you have source code, the agent reads it directly to:
1. Identify UI components, selectors, and user flows
2. Create Page Object classes in `automation/pages/`
3. Write test specs in `automation/tests/e2e/`

Page Objects follow the POM pattern extending `BasePage.js`.

---

### Running Tests

```bash
cd automation

# Run all tests
npm test

# Run E2E tests only
npm run test:e2e

# Run API tests only
npm run test:api

# Run with visible browser
npm run test:headed

# Run interactive UI mode
npm run test:ui

# Run specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# View HTML report
npm run report

# Record tests with codegen
npm run codegen
```

**Browser matrix** (configured in `playwright.config.js`):
- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

---

## Templates & Checklists

### Templates (`templates/`)

| Template | Used By |
|----------|---------|
| `test-strategy-template.md` | QA Architect |
| `test-case-template.md` | Test Case Generator |
| `bug-report-template.md` | Bug Reporter |
| `mom-template.md` | MOM Agent |
| `user-story-template.md` | User Stories Agent |

### Checklists (`checklists/`)

| Checklist | Purpose |
|-----------|---------|
| `smoke-test.md` | Quick verification after deployment |
| `regression.md` | Full regression before release |
| `release-checklist.md` | Pre-release sign-off checklist |

### Tasks (`tasks/`)

Step-by-step guided workflows:

| Task | Guides Through |
|------|----------------|
| `create-test-strategy.md` | Building a test strategy with QA Architect |
| `generate-test-cases.md` | Generating test cases with Test Case Generator |
| `write-automation-tests.md` | Writing Playwright tests with Automation Agent |
| `run-api-tests.md` | Running API tests with API Test Agent |
| `report-bugs.md` | Reporting bugs with Bug Reporter |
| `run-retest-sweep.md` | Running QA retest sweep with Retest Agent |
| `generate-srs.md` | Generating SRS document with SRS Agent |

---

## Configuration

### Environment Variables (`.env`)

```env
# Application URLs
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api

# Test credentials
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=TestPass123!
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=AdminPass123!

# CI/CD
CI=false
```

### Playwright Config

The `automation/playwright.config.js` is pre-configured with:
- Parallel test execution
- Retry on CI (2 retries)
- Screenshots on failure
- Video retained on failure
- Trace on first retry
- Auth setup project (runs before all tests)
- API test project (no browser needed)

---

## Contributing

1. Keep agent definitions in `agents/` as Markdown files
2. Keep slash commands in `.claude/commands/` mirroring agent names
3. All agent outputs go to `outputs/<agent-name>/`
4. Automation code follows CommonJS (`require/module.exports`), JavaScript ES6+
5. Page Objects extend `BasePage.js` and use POM pattern
6. Test files named `feature-name.spec.js`
7. Page Objects named `PageName.js` (PascalCase)

---

Built with Claude Code and Playwright.
