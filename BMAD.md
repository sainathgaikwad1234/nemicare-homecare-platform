# BMAD QA Agent System

## Overview
A multi-agent QA testing system designed to work with Claude Code in VSCode. Provide your frontend and backend code, and these agents will help you plan, write, automate, and report on testing.

## How to Use

### Step 1: Set the Context
Before invoking any agent, share your project context:
- Point to your frontend code directory
- Point to your backend code directory
- Describe the application briefly

### Step 2: Choose Your Agent
Invoke the appropriate agent based on what you need:

| Agent | When to Use | Command |
|-------|------------|---------|
| **QA Architect** | Starting a new project/feature, need test strategy | `Follow agents/qa-architect.md` |
| **Test Case Generator** | Need manual test cases for a feature | `Follow agents/test-case-generator.md` |
| **Automation Agent** | Need Playwright automated tests written | `Follow agents/automation-agent.md` |
| **API Test Agent** | Need backend/API endpoint tests | `Follow agents/api-test-agent.md` |
| **Bug Reporter** | Found a bug, need structured report | `Follow agents/bug-reporter.md` |
| **Test Data Agent** | Need test data, fixtures, or mocks | `Follow agents/test-data-agent.md` |
| **MOM Agent** | Need Minutes of Meeting from transcripts/docs | `Follow agents/mom-agent.md` |
| **User Stories Agent** | Need user stories extracted from project docs | `Follow agents/user-stories-agent.md` |
| **Retest Agent** | Need to verify bug fixes and retest | `Follow agents/retest-agent.md` |
| **SRS Agent** | Need SRS document from project docs | `Follow agents/srs-agent.md` |

### Step 3: Use Tasks for Specific Workflows
Each agent has associated tasks in the `tasks/` folder for guided step-by-step workflows.

## Agent Workflow

```
Project Documents (transcripts, recordings, BA workflows, client docs)
       │
       ├──→ MOM Agent ──────────→ Minutes of Meeting
       │                              │
       └──→ User Stories Agent ──→ Epics & User Stories
                │                      │
                ▼                      ▼
       SRS Agent ──────────→ Software Requirements Specification
                │
                ▼
Your Code (FE + BE)
       │
       ▼
 QA Architect ──────→ Test Strategy & Risk Analysis
       │
       ▼
 Test Case Generator ──→ Manual Test Cases (functional, edge, negative)
       │
       ├──→ Automation Agent ──→ Playwright E2E + Component Tests
       │
       ├──→ API Test Agent ──→ API Endpoint Tests
       │
       └──→ Test Data Agent ──→ Fixtures, Mocks & Test Data
              │
              ▼
       Bug Reporter ──→ Structured Bug Reports
              │
              ▼
       Retest Agent ──→ Verify Fixes, Update Jira, Report
```

## Project Structure

```
bmad-qa-agents/
├── BMAD.md                      # This file - master guide
├── agents/                      # Agent prompt definitions
├── tasks/                       # Step-by-step task workflows
├── templates/                   # Output templates
├── checklists/                  # Testing checklists
├── project-docs/                # Project documents (input for MOM & User Stories agents)
│   ├── transcripts/             # Meeting transcripts
│   ├── recordings/              # Video recording references
│   ├── ba-workflows/            # BA workflow documents
│   ├── client-documents/        # Client-shared docs, specs
│   └── screenshots/             # Screenshots, wireframes
├── outputs/                     # Agent output files (each agent has its own folder)
│   ├── mom-agent/               # MOM .md and .docx files
│   ├── user-stories-agent/      # User stories .md and .xlsx files
│   ├── qa-architect/            # Test strategy documents
│   ├── test-case-generator/     # Test case documents
│   ├── automation-agent/        # Test reports and coverage summaries
│   ├── api-test-agent/          # API inventory and coverage reports
│   ├── bug-reporter/            # Bug reports and summaries
│   ├── test-data-agent/         # Data model docs and inventories
│   ├── retest-agent/            # Retest sweep reports
│   └── srs-agent/               # SRS documents
└── automation/                  # Playwright framework
    ├── playwright.config.js
    ├── package.json
    ├── tests/                   # Test files
    ├── pages/                   # Page Object Models
    ├── fixtures/                # Test fixtures
    ├── utils/                   # Helper utilities
    ├── config/                  # Agent config files
    │   └── qa-retest-config.json # Retest agent configuration
    └── reports/                 # Test reports
```

## Quick Start

1. Open this project in VSCode
2. Start Claude Code
3. Say: "Read BMAD.md and help me test my application at [path]"
4. Claude will guide you through the appropriate agent workflow
