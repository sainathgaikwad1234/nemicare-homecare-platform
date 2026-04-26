# HRMS Phase 5 — Workflow Connective Tissue

**Source of truth:** `project-docs/ba-workflows/Sam Shah discovery call-HRMS.drawio.png` (4-lane swim chart) + HRMS AC CSV (3231 lines / 138 stories) + 22 MOM transcripts + 84 HRMS Figma screens.

**Why Phase 5 exists:** Phases 1–4 built CRUD shells for every box in lanes 1–3 of the workflow diagram. Phase 5 builds the **handoffs between lanes** — the state-machine transitions, system crons, and cross-lane data flow that turn the shells into a working operations system.

---

## Sprint sequencing (dependency order)

| Sprint | Group | Deliverable | Why this order |
|---|---|---|---|
| 5.1 | **A** | EVV / Time Card / Payroll spine | Cascades into 5.2 (cron) and 5.7 (exit final pay). Highest single-sprint value. |
| 5.2 | **G** | Automated System Operations (cron jobs) | Some crons require 5.1 timecards (payroll), some are independent (doc expiry). Run 5.2 after 5.1 lands the data shape. |
| 5.3 | **B** | Shift Change Request entity | Self-contained; can run any time after 5.1 because it touches roster, not timecards. |
| 5.4 | **C** | Leave gaps (quota, coverage, replacement, roster block) | Requires 5.2's "block roster on leave approved" cron to be live. |
| 5.5 | **D** | Performance Review supervisor flow + employee read-only | Requires 5.2's anniversary-trigger cron. |
| 5.6 | **E** | Onboarding gaps (tests/expiry, BG dispatch, IP/geo per employee, clinical perms) | Independent. |
| 5.7 | **F** | Exit gaps (Property, Final Pay, Benefits, auto-remove) | Requires 5.1 (final pay calc reads timecards) + 5.2 (auto-remove cron). |
| 5.8 | **H** | Notice Board / Messaging / HR-triggered Reports | Independent; lowest urgency, highest UI surface. |

---

## Sprint 5.1 — EVV / Time Card / Payroll Spine

The diagram's central pipeline: **Login = IP-validated clock-in** → work → break → clock out → auto-calc → submit timecard → supervisor approve → payroll cron → ADP.

### Schema additions (`backend/prisma/schema.prisma`)

```prisma
model FacilityIpWhitelist {
  id            Int      @id @default(autoincrement())
  facilityId    Int
  cidr          String   // e.g. "192.168.1.0/24"
  description   String?
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  facility      Facility @relation(fields: [facilityId], references: [id])
}

model FacilityGeofence {
  id            Int      @id @default(autoincrement())
  facilityId    Int      @unique
  lat           Float
  lng           Float
  radiusMeters  Int      @default(100)
  active        Boolean  @default(true)
  facility      Facility @relation(fields: [facilityId], references: [id])
}

model AttendancePunch {
  id              Int       @id @default(autoincrement())
  employeeId      Int
  punchType       PunchType // LOGIN_CLOCK_IN | BREAK_START | BREAK_END | CLOCK_OUT
  timestamp       DateTime  @default(now())
  ipAddress       String?
  ipValidated     Boolean   @default(false)
  geoLat          Float?
  geoLng          Float?
  geoValidated    Boolean   @default(false)
  shiftScheduleId Int?
  notes           String?
  employee        Employee  @relation(fields: [employeeId], references: [id])
  shiftSchedule   ShiftSchedule? @relation(fields: [shiftScheduleId], references: [id])
}

enum PunchType {
  LOGIN_CLOCK_IN
  BREAK_START
  BREAK_END
  CLOCK_OUT
}

// Extend existing Timesheet
model Timesheet {
  // existing fields...
  totalHours       Decimal? @db.Decimal(6,2)   // auto-calculated
  breakMinutes     Int?                         // auto-calculated
  netHours         Decimal? @db.Decimal(6,2)   // total - break
  overtimeHours    Decimal? @db.Decimal(6,2)   // hours > daily/weekly threshold
  taskDetails      String?  @db.Text            // "What Work Performed"
  status           TimecardStatus @default(DRAFT) // DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | PAID
  submittedAt      DateTime?
  approvedById     Int?
  approvedAt       DateTime?
  rejectionReason  String?  @db.Text
  payrollBatchId   Int?
}

enum TimecardStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
  PAID
}

model PayrollBatch {
  id              Int       @id @default(autoincrement())
  companyId       Int
  facilityId      Int?
  payPeriodStart  DateTime
  payPeriodEnd    DateTime
  runDate         DateTime  @default(now())
  status          PayrollBatchStatus @default(COMPILING) // COMPILING | VALIDATING | EXPORTED | SENT_TO_ADP | COMPLETE | FAILED
  totalRegularHours  Decimal?
  totalOvertimeHours Decimal?
  totalEmployees     Int?
  adpExportPath      String?
  adpTransferAt      DateTime?
  errors             Json?
  timesheets         Timesheet[]
}

enum PayrollBatchStatus {
  COMPILING
  VALIDATING
  EXPORTED
  SENT_TO_ADP
  COMPLETE
  FAILED
}
```

### Backend services

| File | Responsibility |
|---|---|
| `backend/src/services/attendance.service.ts` | `loginClockIn(req)` — validate facility IP from `FacilityIpWhitelist`, validate geo from `FacilityGeofence`, write `AttendancePunch` with `LOGIN_CLOCK_IN`, return validated session. `startBreak`, `endBreak`, `clockOut` — write punches. Block second clock-in on same shift. |
| `backend/src/services/timecard.service.ts` | `computeFromPunches(employeeId, date)` — read punches for the day, compute `totalHours` (clockout − clockin), `breakMinutes` (sum of break pairs), `netHours`, flag `overtimeHours` if >8h/day or >40h/week. `submitForApproval(timesheetId, taskDetails)`. `supervisorApprove(id)`, `supervisorReject(id, reason)`, `approveOvertime(id)` (1.5x flag). |
| `backend/src/services/payroll.service.ts` | `runWeeklyPayroll(payPeriodStart, payPeriodEnd)` — compile APPROVED timesheets, group by department, separate regular vs OT, validate (every employee has SSN, dept, pay rate), `generateAdpExport(batchId)` returns CSV with cols `EmployeeID, Hours, OvertimeHours, Department`, `sendToAdp(batchId)` (stub: write to `/exports/adp/`). |
| `backend/src/middleware/ipValidation.ts` | Extract `req.ip`, check against active facility CIDRs for the user's facility. Block login if not whitelisted. |

### Routes

```
POST   /api/v1/attendance/clock-in       (auto on login, but exposed for manual override)
POST   /api/v1/attendance/break/start
POST   /api/v1/attendance/break/end
POST   /api/v1/attendance/clock-out
GET    /api/v1/me/timecards               (employee view of own)
POST   /api/v1/me/timecards/:id/submit    (with taskDetails)
GET    /api/v1/timecards                  (supervisor queue, filterable by dept)
PATCH  /api/v1/timecards/:id/approve
PATCH  /api/v1/timecards/:id/reject
PATCH  /api/v1/timecards/:id/approve-overtime
GET    /api/v1/payroll/batches
POST   /api/v1/payroll/batches            (manual run; cron also calls)
GET    /api/v1/payroll/batches/:id/adp-export   (download CSV)
GET    /api/v1/admin/ip-whitelist
POST   /api/v1/admin/ip-whitelist
GET    /api/v1/admin/geofence
POST   /api/v1/admin/geofence
```

### Frontend pages/components

| Page | What it does |
|---|---|
| `MeHome.tsx` (modify) | Replace localStorage timer with real `AttendancePunch`-backed clock state. Show: current punch state, today's totals, "Start Break / Clock Out" buttons gated on state machine. |
| `MeTimecards.tsx` (new) | List employee's own timecards by week. Editable `taskDetails` on DRAFT, "Submit for Approval" button. |
| `pages/hrms/Timecards.tsx` (new) | Supervisor approval queue. Filter by dept. Per-row: Approve / Reject (with reason) / Approve Overtime (1.5x) / view punch trail. |
| `pages/hrms/Payroll.tsx` (new) | HR view of payroll batches. "Run Now" button. Status badges. Download ADP export CSV. |
| `pages/hrms/IpWhitelist.tsx` (new) | HR Admin → manage facility CIDRs and geofences. |

### State machines

```
Punch state per shift:
  NONE → LOGIN_CLOCK_IN → [BREAK_START → BREAK_END]* → CLOCK_OUT → done

Timecard state:
  DRAFT → PENDING_APPROVAL → (APPROVED | REJECTED → DRAFT) → PAID

Payroll batch state:
  COMPILING → VALIDATING → (EXPORTED → SENT_TO_ADP → COMPLETE) | FAILED
```

---

## Sprint 5.2 — Automated System Operations (Lane 4)

8 cron jobs. Use `node-cron` or BullMQ (recommended for retries + dashboards).

| Cron | Schedule | What it does |
|---|---|---|
| `monitorDocExpiry` | Daily 2am | Scan `EmployeeDocument` + `OnboardingDocument` for expiryDate. Email + portal alert at 60/30/7 days. Mark Compliance flag if expired. |
| `triggerReviewCycle` | Daily 3am | For each Employee, if `(today - hireDate)` mod 365 days = 30, create `PerformanceReview` in DRAFT and notify supervisor. |
| `monitorCoverage` | Hourly during business hours | For each shift today/tomorrow, count assigned vs minimums (1st: 5–7, 2nd: 3, 3rd: 3). Post to NoticeBoard + email supervisors if understaffed. |
| `blockRosterOnLeave` | On leave APPROVED (event-driven, not cron) | When `LeaveRequest` flips to APPROVED, mark `ShiftSchedule` rows in date range as `LEAVE_BLOCKED`. |
| `runWeeklyPayroll` | Every other Friday 6pm | Calls `payroll.service.runWeeklyPayroll()`. |
| `generateAttendanceSummaryReport` | Weekly Mon 6am | Roll up attendance for prior week. |
| `generateOvertimeAnalysisReport` | Weekly Mon 6am | OT hours by dept and employee. |
| `generateComplianceStatusReport` | Daily 4am | Doc expiry + missing docs by employee. |

### Files
- `backend/src/jobs/index.ts` — bootstrap all cron registrations
- `backend/src/jobs/docExpiry.job.ts`
- `backend/src/jobs/reviewCycle.job.ts`
- `backend/src/jobs/coverage.job.ts`
- `backend/src/jobs/payroll.job.ts`
- `backend/src/jobs/reports.job.ts`
- `backend/src/services/notification.service.ts` — email + portal alert dispatcher (writes to `NoticeBoard` + sends SMTP)

---

## Sprint 5.3 — Shift Change Request entity

### Schema
```prisma
model ShiftChangeRequest {
  id              Int       @id @default(autoincrement())
  employeeId      Int
  originalShiftId Int
  requestedDate   DateTime?
  requestedShiftType ShiftType?
  reason          String    @db.Text
  status          ShiftChangeStatus @default(PENDING) // PENDING | APPROVED | REJECTED
  decidedById     Int?
  decidedAt       DateTime?
  rejectionReason String?
  createdAt       DateTime  @default(now())
}
enum ShiftChangeStatus { PENDING APPROVED REJECTED }
```

### Backend
- `shiftChange.service.ts` — submit, list (supervisor queue), approve (mutates roster atomically), reject

### Frontend
- `MeShifts.tsx` (modify) — "Request Change" button per shift → opens dialog with reason
- `pages/hrms/ShiftChangeQueue.tsx` (new) — supervisor approval list

---

## Sprint 5.4 — Leave gaps

### Backend additions
- Inline quota check endpoint: `GET /api/v1/me/leaves/quota?leaveType=SICK` → returns `{ remainingDays, sufficient: boolean }` for client gate before submit
- Supervisor approval enrichment: when supervisor calls `supervisorApprove`, run `checkCoverage(date, leaveType)` — if inadequate, return 200 with `{ requiresReplacement: true, candidates: [...] }`. Frontend shows replacement picker before final approve.
- Need-Info path: new state `WAITING_INFO` on `LeaveRequest`. `supervisorRequestInfo(id, message)` flips state and notifies employee. Employee responds via comments.

### Frontend
- `MeLeaves.tsx` (modify) — show remaining balance inline; client-gate Submit button if insufficient
- `Leaves.tsx` (modify) — Approve action opens a coverage check modal; if inadequate, surface replacement picker
- New `LeaveInfoRequestDialog.tsx`

---

## Sprint 5.5 — Performance Review (Supervisor + Employee)

### Backend
- `PerformanceReview` already exists — extend with: `compensationNotes`, `trainingNeeds`, `electronicSignature`, `lockedAt`
- `submitToHr(id, signature)` — Supervisor flow: locks supervisor side, flips state to `PENDING_HR_REVIEW`
- `hrFinalize(id, compensationNotes, trainingNeeds)` — flips to `FINALIZED`, generates PDF, grants employee read access
- PDF generation via `pdfkit` or `puppeteer`

### Frontend
- `pages/hrms/SupervisorReviewForm.tsx` (new) — full form with Ratings/Strengths/Improvements/Goals/Comments, e-signature canvas, Submit to HR
- `Reviews.tsx` (modify) — HR side adds Compensation/Training fields + Finalize button
- `pages/hrms/MeReviews.tsx` (new) — employee read-only list + Download PDF

---

## Sprint 5.6 — Onboarding gaps

### Schema additions
```prisma
model EmployeeTestExpiry {
  id           Int      @id @default(autoincrement())
  employeeId   Int
  testType     String   // "TB", "Drug Screen", "Physical"
  passedDate   DateTime
  expiryDate   DateTime
  notes        String?
}

// Extend Role with clinicalPermissions JSON for: medication_admin, charting, vitals, etc.
```

### Backend
- Drug-test consent + Fingerprint DMV explicit fields on OnboardingDocument
- "Send to BG agency" — generates email with attachments, logs dispatch
- Per-employee IP/geo overrides (some employees may need work-from-anywhere — rare)
- Clinical permission preset templates (CNA, RN, Caregiver) seeded

---

## Sprint 5.7 — Exit gaps

### Schema extension
```prisma
model EmployeeExit {
  // existing...
  propertyCollected      Json?     // checklist
  finalPayAmount         Decimal?
  finalPayCalculatedAt   DateTime?
  benefitsTerminationDate DateTime?
  systemRemovalLog       Json?     // audit of what was auto-removed
}
```

### Backend
- `exit.service.calculateFinalPay(employeeId)` — sums unpaid timecards + accrued leave payout
- `exit.service.finalize(id)` — transactional: revoke User, mark Employee TERMINATED, cancel future shifts, remove from active rosters, archive

---

## Sprint 5.8 — Notice Board / Messaging / HR Reports

### Notice Board
- `NoticeBoard` model exists. Add CRUD routes + admin UI + employee-side card on MeHome

### Messaging
- New `Message` + `MessageThread` models — 1:1 and department channel
- WebSocket via `socket.io` for live chat
- `pages/hrms/Messages.tsx`

### HR-triggered Reports
- `pages/hrms/Reports.tsx` — list of report types, date range picker, "Generate" button
- Reports: Headcount, Turnover, Attendance, Leave Utilization, Performance, Compliance
- Export as PDF + CSV

---

## File-level estimate

| Sprint | New files | Modified files | Schema changes | Effort |
|---|---|---|---|---|
| 5.1 | ~8 backend, 5 frontend | 3 | 5 models + 3 enums | L |
| 5.2 | ~7 jobs, 1 service | 1 | none | M |
| 5.3 | 2 backend, 1 frontend | 1 | 1 model + 1 enum | S |
| 5.4 | 1 frontend | 3 backend, 2 frontend | none | M |
| 5.5 | 2 backend, 2 frontend | 2 | review extension | M |
| 5.6 | 1 model, 1 service | 3 | 1 model | S |
| 5.7 | 1 service | 2 | 1 model extension | S |
| 5.8 | 4 backend, 3 frontend | 1 | 2 models | L |

**Total:** roughly L + M + S + M + M + S + S + L ≈ 3–4 weeks if done sequentially, or 2 weeks parallelized across the dependency graph (5.1+5.6+5.8 in parallel, then 5.2, then 5.3+5.4+5.5+5.7).

---

## Definition of done (per sprint)

For every sprint:
1. Schema migration applied (`prisma db push`)
2. Backend service unit-testable (smoke test in `automation/`)
3. Frontend page wired into HrmsLayout role-aware sidebar
4. End-to-end smoke test: Sarah (employee) + Eleanor (supervisor) + admin can complete the relevant flow
5. Updated knowledge base entry in `docs/knowledge-base/`

---

## Recommended start

**Sprint 5.1 first** — the EVV/timecard/payroll spine is the diagram's backbone. Without it, supervisors can't approve timecards, payroll cron has nothing to compile, and exit final-pay can't calculate. Every other sprint depends on data shapes introduced here.
