# Task: Report Bugs

## Agent: Bug Reporter
## Trigger: When test failures or issues are discovered

## Inputs Required
- Test failure output (error message, stack trace)
- Relevant source code
- Steps that caused the failure

## Steps

### 1. Analyze Failure
- [ ] Read the error message and stack trace
- [ ] Read the relevant source code (frontend and/or backend)
- [ ] Reproduce the issue mentally or through code analysis
- [ ] Identify the root cause or narrow down possibilities
- [ ] Classify as: code bug / test issue / environment issue / requirement gap

### 2. Classify the Bug
- [ ] Assign severity: S1 (Blocker) / S2 (Critical) / S3 (Major) / S4 (Minor)
- [ ] Assign priority: P1 (Immediate) / P2 (High) / P3 (Medium) / P4 (Low)
- [ ] Assign type: Functional / UI / API / Performance / Security
- [ ] Assign module: Auth / Dashboard / Cart / etc.

### 3. Create Bug Report
- [ ] Write clear title
- [ ] Document environment details
- [ ] Write step-by-step reproduction steps
- [ ] Document expected vs actual results
- [ ] Include error logs, screenshots, or API responses
- [ ] Provide root cause analysis with code references
- [ ] Suggest fix if possible

### 4. Output
- [ ] Save bug report using `templates/bug-report-template.md`
- [ ] If multiple bugs, create summary report
- [ ] Notify relevant agents about the bugs

## Output Location
Save to: `[project-root]/bug-reports/[BUG-ID].md`
