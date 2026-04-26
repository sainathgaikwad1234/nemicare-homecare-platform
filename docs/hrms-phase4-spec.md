# HRMS Phase 4 — Build Spec

Phase 4 covers My Profile (Employee), Tasks (HR/Supervisor assigns, Employee marks done), Performance Reviews (HR Admin list + View+Approve), and Exit/Separation Management (HR Admin 5-step flow). Grounded in Figma + AC + MOM.

---

## 1. My Profile (Employee, `/hrms/me/profile`)

Read-only profile page for employees viewing their own record. Subset of HR Admin's profile (no SSN, no employment compensation).

### Layout
- Title "Profile" + person icon (left), kebab menu (right) — kebab opens edit form
- **"Your Account" section**: large avatar + Name + email + phone + 3 fields (Designation / Department / Supervisor)
- **"Personal Details" section**: Date of Birth / Age (computed) / Gender / Language Preference (4 columns)
- **"Other Details" section**: Address fields, Probation End Date, Notice End Date, Slack Member ID, Marital Status, Business Address
- Reuses `/api/v1/me/profile` (already built in Phase 3)
- Edit limited to Phase 4: phone, address, slackMemberId. Sensitive fields (designation, department, supervisor, salary, probation/notice) require HR.

---

## 2. Tasks

### Schema (already exists)
`EmployeeTask` model has: assignedToId, createdById, title, description, priority (LOW/MEDIUM/HIGH), status (PENDING/IN_PROGRESS/COMPLETED/CANCELLED), dueDate, completedAt.

### Backend endpoints
- `GET /api/v1/tasks` — HR Admin/Supervisor list (filterable by status, assignee, dueDate)
- `GET /api/v1/me/tasks` — Employee's own tasks
- `POST /api/v1/tasks` — assign new task (HR Admin/Supervisor)
- `POST /api/v1/me/tasks/:id/complete` — employee marks own task complete
- `PUT /api/v1/tasks/:id` — update task
- `DELETE /api/v1/tasks/:id` — remove task

### Employee Tasks page (`/hrms/me/tasks`)
- **4 stat cards top**: Total / Completed / Pending / Due
- **Banner**: "⚠ You have N pending tasks assigned for this week."
- **Tabs**: All / Completed / Pending / Due
- **Table columns**: Title / Description / Due Date / Assigned By / **Priority** badge (High pink / Medium amber / Low green) / **Status** badge / Action (✓ button)
- Click ✓ on a Pending/Due task → marks Completed → status badge changes

### HR Admin / Supervisor side (defer for Phase 4 scope — only employee side built now)
HR Admin/Supervisor task assignment UI deferred to a follow-up. Backend POST endpoint built so it can be exercised via API.

---

## 3. Performance Reviews

### Schema (already exists)
`PerformanceReview` model: employeeId, reviewerId, periodStart/End, overallRating, strengths, areasForImprovement, goals, comments, status (DRAFT/SUBMITTED/APPROVED/REJECTED), approvedById, approvedAt.

### Backend endpoints
- `GET /api/v1/performance-reviews?status=&employeeId=` — list
- `POST /api/v1/performance-reviews` — supervisor creates (DRAFT)
- `PUT /api/v1/performance-reviews/:id` — supervisor edits draft
- `POST /api/v1/performance-reviews/:id/submit` — supervisor → SUBMITTED
- `POST /api/v1/performance-reviews/:id/approve` — HR → APPROVED
- `POST /api/v1/performance-reviews/:id/reject` — HR → REJECTED

### HR Admin Reviews page (`/hrms/reviews`)
- Title + segmented filter (All / Approved / Pending / Rejected)
- **Columns**: Name (avatar + ID) / Role / Department / Joined Date / **Days Left** (number; "+N" prefix if overdue, red) / Status / **Action: View + Approve** buttons
- Pagination
- Click View → opens **Performance Review modal** (full-screen dialog):
  - Header section: photo + "Resident Name" (Employee), Role, Department, Joined Date, Contact, Email
  - Overall Rating (1-5 stars, read-only when viewing as HR)
  - Strengths text block
  - Areas of Improvement text block
  - Goals for Next Period text block
  - Additional Comments text block
  - Footer: Cancel + **Approve** (filled green)
- Phase 4 build: read-only View modal with Approve action. Supervisor create/edit deferred to follow-up.

---

## 4. Exit / Separation Management

### Schema (already exists)
`EmployeeExit` model: employeeId, exitReason, exitType, noticeDate, lastWorkingDay, exitInterviewNotes, exitInterviewDate, finalPayAmount, benefitsTerminated, portalAccessRevoked, status (INITIATED/IN_PROGRESS/COMPLETED), initiatedById, completedAt.

### Backend endpoints
- `GET /api/v1/exits?status=` — list with employee join
- `POST /api/v1/exits` — initiate (employeeId, exitType, noticeDate, lastWorkingDay, exitReason)
- `PUT /api/v1/exits/:id` — update step data
- `POST /api/v1/exits/:id/complete` — finalize: revoke portal access, terminate benefits, set status COMPLETED, mark Employee as TERMINATED

### HR Admin Exits page (`/hrms/exits`)
Two-pane layout per Figma:
- **Left pane**: cards list — avatar + Name + status badge + ID + Role + Last Day + Reason
- **Right pane**: detail/stepper for selected card. **5 steps** following AC patterns:
  1. Exit Interview (notes + interview date)
  2. Final Pay Calculation (auto-suggested amount + edit)
  3. Benefits Termination (toggle benefitsTerminated)
  4. Portal Access Revocation (toggle portalAccessRevoked + warning)
  5. Finalize (Confirm — moves status to COMPLETED, marks Employee.status=TERMINATED, sets terminationDate=lastWorkingDay)

Top-right: segmented filter (All / Approved / Pending / Rejected) — note: Figma shows these tabs but per the EmployeeExit model we only have INITIATED/IN_PROGRESS/COMPLETED. **Mapping**: Pending = INITIATED+IN_PROGRESS, Approved = COMPLETED, Rejected = (cancelled exits — not in current model; defer).

Top-right: "+ Initiate Exit" button (filled blue) — opens Initiate Exit modal.

### Initiate Exit modal
Fields: Employee (Autocomplete from Active employees), Exit Type (Voluntary/Involuntary/Retirement), Notice Date (date picker), Last Working Day (date picker), Exit Reason (text).
Footer: Cancel + Initiate (filled blue).

---

## 5. Out of Phase 4

- HR Admin / Supervisor side of Tasks page (assignment UI)
- Performance Review create/edit (supervisor side)
- Exit "Rejected" status (cancelled exits)
- Real benefits provider integration
- Documents UI for employee
- Chat / Messages
- Reports / Analytics
- Notice Board
- Real Clock-In via portal login + EVV + IP whitelist + geofencing

---

## 6. Build order

1. Phase 4 backend (Tasks + Performance + Exit services + routes; permissions patch)
2. My Profile page (employee read-only with kebab → Edit modal for limited fields)
3. Employee Tasks page (4 stats + banner + table + mark complete)
4. Performance Reviews HR Admin page (list + View+Approve modal)
5. Exit Management HR Admin page (cards + stepper)
6. Wire routes + smoke test
