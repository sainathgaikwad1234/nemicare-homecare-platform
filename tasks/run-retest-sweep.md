# Task: Run QA Retest Sweep

## Overview
Validate bug fixes by querying Jira, verifying deployments, retesting in browser, updating ticket statuses, and sending a Google Chat summary.

## Prerequisites
- [ ] Jira MCP tool configured and accessible
- [ ] Git MCP tool configured with access to FE and BE repos
- [ ] `automation/config/qa-retest-config.json` filled with correct values
- [ ] QA environment is accessible and running
- [ ] Google Chat webhook URL is configured
- [ ] Playwright and browser dependencies installed (`cd automation && npm install && npx playwright install`)

## Step-by-Step Workflow

### Step 1: Load & Validate Configuration
1. Read `automation/config/qa-retest-config.json`
2. Verify all fields are filled (no placeholder values)
3. Confirm QA environment URL is accessible
4. Confirm Jira project key is correct

### Step 2: Fetch Tickets from Jira
1. Query Jira: `status = "Ready for Testing" AND issuetype = Bug AND project = {KEY}`
2. List all matching tickets with ID, title, assignee, linked branch/commit
3. Present to user for confirmation
4. If no tickets found, report and stop

### Step 3: Verify Deployment
For each ticket:
1. Identify the fix commit or branch from Jira
2. Check if commit exists in the FE repo's deployed branch
3. Check if commit exists in the BE repo's deployed branch
4. Mark as Deployed / Not Deployed / Unknown
5. Send Google Chat alert for any undeployed tickets
6. Skip undeployed tickets from retesting

### Step 4: Analyze & Retest
For each deployed ticket:
1. Read the fix diff (Git MCP)
2. Identify changed files and impacted areas
3. Log into QA environment (LOGIN FAILURE = STOP)
4. Navigate to the affected screen
5. Follow steps-to-reproduce from Jira
6. Verify the fix (take screenshots)
7. Quick regression check on impacted areas
8. Record result: PASS / FAIL / REGRESSION

### Step 5: Update Jira Tickets
For each tested ticket:
- **PASS**: Add verification comment + screenshots, transition to DONE
- **FAIL**: Add failure comment + screenshots, transition to REOPEN
- **REGRESSION**: Add regression details, REOPEN original, flag new issue

### Step 6: Generate Report & Notify
1. Save detailed report to `outputs/retest-agent/retest-report-{date}.md`
2. Send Google Chat summary (pass/fail/regression counts + action items)
3. Present results to user

## Output Files
| File | Location |
|------|----------|
| Retest report | `outputs/retest-agent/retest-report-YYYY-MM-DD.md` |
| Screenshots | `automation/explorer/screenshots/` |
| Login failure report (if any) | `outputs/retest-agent/login-failure-report.md` |

## Invoke
```
/retest-agent
```

## Related Agents
- **Bug Reporter** — if retesting finds new bugs or regressions
- **Automation Agent** — if regression needs new test coverage
- **QA Architect** — if recurring issues suggest test strategy gaps
