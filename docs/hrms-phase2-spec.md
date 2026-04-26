# HRMS Phase 2 — Build Spec

Phase 2 covers HR Admin Shift Calendar, HR Admin Leave Management, and Timecard Supervisor approval. Grounded in Figma + AC + MOM.

---

## 1. Shift Calendar (`/hrms/shifts`)

Three view modes selectable via top-right dropdown (Day / Week / Month).

### Top toolbar (all views)
- "Shift Calendar" title with calendar icon (left)
- **Today** button + ‹ ›  date arrows + current date label (e.g., "1 September 2026")
- **Legends** (with i icon) — opens legend popover
- **Filter** (funnel icon) — opens filter drawer (department, role, status)
- **Facility** dropdown (default ALF)
- **View** dropdown (Day / Week / Month)
- **+ Bulk Assign** button (filled blue, top-right)

### Shift type colors
| Type | Background | Time band |
|---|---|---|
| 1st Shift | orange/amber `#fff7ed` | 9:00 AM – 8:00 PM |
| 2nd Shift | green `#d1fae5` | 3:00 PM – 12:00 AM |
| 3rd Shift | blue `#dbeafe` | 12:00 AM – 9:00 AM |
| Day Off | gray `#f3f4f6` | — |
| Leave (Applied) | pink/orange `#fff7ed` | shows "Applied" tag |
| Leave (Approved) | green `#d1fae5` | shows "Approved" tag |

### Day view
Kanban-style 6 columns side-by-side:
- 1st (orange header)
- 2nd (green header)
- 3rd (blue header)
- Leave Applied (pink)
- Leave Approved (green)
- Day Off (gray)

Each column lists employees as chips (avatar + name).

### Week view
Tabular grid:
- Top header row: 6-7 employee columns (avatar + name + role like "LPN")
- Left column: day labels (Sun / Mon / Tue / Wed / Thu / Fri / Sat) with date numbers
- Sat displayed in red text
- Each cell: shift badge + time
- "Today" label or first day of week toggle

### Month view
Same as week but spans full month. Employees as columns, dates as rows.

### Shift Assignment modal (single)
- Title "Shift Assignment" with X close
- **Shift Type** dropdown — driver field
- After selecting type, panel below populates with assignment grid (employee + date pickers)
- Empty state: "Select Shift Type First" illustration
- Footer: Cancel + **Assign** (filled blue)

### Bulk Assign modal (per AC)
- Shift Type dropdown
- Select Staff (multi-select with checkboxes + Select All + search)
- Select Month dropdown
- Day grid (01-31, toggle each day)
- Footer: Cancel + Assign

---

## 2. Leave Management (`/hrms/leaves`)

### Header
- Title "Leave Requests" with people icon (left)
- **Segmented filter** (top-right): All / Approved / Pending / Rejected

### Table columns
| Column | Notes |
|---|---|
| Name | avatar + name + employee ID below |
| Date | range "07/15/2026 - 07/20/2026" or single |
| Days | number |
| Leave Left | "5/12" format |
| Leave Type | "Sick Leave" / "Annual Leave" / "Emergency Leave" |
| Reason | truncated text |
| Status | Pending (orange) / Approved (green) / Rejected (red) — Supervisor decision |
| HR | Waiting (blue) / Approved (green) — HR decision |
| Action | Pending → **Approve** + **Reject** buttons; Approved/Rejected → **View Details** button |

Pagination: Rows per page: 10 + numbered pages.

### Approve action (HR)
- Click → POST to backend → status changes to `APPROVED`
- Triggers replacement assignment prompt (Phase 3)

### Reject Leave Request modal
- Header: "Reject Leave Request" with X
- Profile section: photo + name + role chip (LPN) + email + phone
- Below: "Leave Request - 08/15/2025" + "Reason" button (with i icon, top-right)
- Box: Days | From date | To date | "HR Approval: Waiting" (blue badge)
- **Rejection Reason** textarea (required, "Enter Rejection Reason")
- Footer: Close (outlined) + **Submit** (filled blue)

### Dual approval state machine
```
SUBMIT (employee)
  → Supervisor: PENDING (orange), HR: WAITING (blue)
SUPERVISOR APPROVE
  → Supervisor: APPROVED (green), HR: PENDING (orange)
HR APPROVE
  → Final: APPROVED (green); balance deducted
SUPERVISOR REJECT (with reason)
  → Final: REJECTED (red)
HR REJECT (with reason)
  → Final: REJECTED (red)
```

In Phase 1 backend I created `LeaveRequest` with single status. In Phase 2 I'll extend with `supervisorApprovalStatus`, `supervisorApprovedById/At`, `hrApprovalStatus`, `hrApprovedById/At`, `rejectionReason`.

---

## 3. Timecard Supervisor Approval (`/hrms/timecards`)

### Header
- Title "Weekly Timecard"
- Filter tabs: All / Approved / Pending / Rejected (top-right)

### Table columns
- Name (avatar + ID)
- Total Hours
- Overtime Hours
- Flags: Overtime (orange chip) / Short (orange chip) / "-"
- Status (Pending / Approved / Rejected)
- Action: Pending row → Reject + Approve buttons; non-pending → action buttons disabled

### View Weekly Progress (eye icon → slides in right drawer)
- Header: avatar + name (e.g., "Jerome Bell") + X
- Top stats: Date, Total Hours, Overtime Hours, Status (Pending orange)
- **Per-day rows**: each day shows
  - Date (e.g., "02/01/2026")
  - Working hr 0X (scheduled hours)
  - Worked hr 0X (actual hours, red if > working)
  - Tasks list ("1. Task" + description)
- Footer: Reject + Approve buttons (large, full-width feel)

### Reject Timecard modal
Identical pattern to Reject Leave Request:
- Title "Reject Timecard" with X
- Profile section (photo, name, role chip, email, phone)
- Rejection Reason textarea
- Close + Submit

### Note on Phase 2 scope for Timecards
Per MOM-7 + AC: timecards auto-generate from EVV (clock in/out via portal login). EVV system is Phase 3 work. For Phase 2, this page shows **placeholder demo data** — the approval workflow UI is built but the underlying timecard records won't exist until Phase 3. We'll seed a few demo timecards manually so HR can validate the approve/reject UX.

---

## 4. Schema additions

### Extend `LeaveRequest`
- Already exists from Phase 1 with `status: LeaveStatus`
- ADD: `supervisorApprovalStatus` (enum APPROVED/REJECTED/PENDING/null), `supervisorApprovedById`, `supervisorApprovedAt`, `hrApprovalStatus`, `hrApprovedById`, `hrApprovedAt`, `rejectionReason`
- Computed `status` becomes derived from the two: if both APPROVED → APPROVED, if any REJECTED → REJECTED, else PENDING

For Phase 2 I'll add new fields without removing old ones (backward-compat).

### Extend `ShiftSchedule`
- Already exists with shiftDate, shiftType, startTime, endTime, status, notes
- Verify enum `ShiftType` includes FIRST/SECOND/THIRD/CUSTOM (it does)
- Add `appliedLeaveRequestId` FK so we can show "Leave (Applied/Approved)" on the calendar

### Existing `Timesheet` (Phase 1)
- Already has regularHours, overtimeHours, status, approval fields
- Add `flags` Json column (e.g., `["OVERTIME", "SHORT", "MISSING_PUNCH"]`)
- Add `tasksByDay` Json column for the slide-in panel content (placeholder structure for Phase 2; real data wired in Phase 3)

---

## 5. Backend endpoints

### Shifts
- `GET /api/v1/shifts?facilityId=&from=&to=` — flat list of shifts in range
- `POST /api/v1/shifts` — create one shift
- `PUT /api/v1/shifts/:id` — edit
- `DELETE /api/v1/shifts/:id` — delete
- `POST /api/v1/shifts/bulk` — bulk assign (employeeIds[], shiftType, dates[])
- `GET /api/v1/shifts/calendar?facilityId=&view=DAY|WEEK|MONTH&date=` — pre-grouped data for the selected view

### Leave
- `GET /api/v1/leaves?status=PENDING|APPROVED|REJECTED|ALL` — list with includes
- `POST /api/v1/leaves` — employee submits (Phase 3 mostly)
- `POST /api/v1/leaves/:id/supervisor-approve`
- `POST /api/v1/leaves/:id/supervisor-reject` (body: rejectionReason)
- `POST /api/v1/leaves/:id/hr-approve`
- `POST /api/v1/leaves/:id/hr-reject` (body: rejectionReason)

### Timecards
- `GET /api/v1/timecards?status=&period=` — supervisor list
- `GET /api/v1/timecards/:id` — full detail with per-day breakdown
- `POST /api/v1/timecards/:id/approve` — supervisor approve
- `POST /api/v1/timecards/:id/reject` (body: rejectionReason)

---

## 6. Frontend pages

| Route | Page |
|---|---|
| `/hrms/shifts` | Shift Calendar (Day/Week/Month) |
| `/hrms/leaves` | Leave Management |
| `/hrms/timecards` | Timecard Supervisor Approval |

All wrapped in `HrmsLayout`.

---

## 7. Out of Phase 2 (deferred)

- Employee self-service Clock In/Out + Leave Request submission (Phase 3)
- EVV integration (Phase 3)
- Pay Rules / ADP export (Phase 4)
- Performance Reviews (Phase 4)
- Tasks (Phase 4)
- Exit/Separation flow (Phase 4)
- Supervisor Dashboard layout (separate from HR layout) — Phase 3 if needed
- Shift Change Requests (Phase 3 — employee initiates)
- Replacement employee assignment on approved leaves (Phase 3)
- Compliance alerts (Phase 4)
- Notice Board / Chat (Phase 5)
- Reports / Analytics (Phase 5)

---

## 8. Build order

1. Schema additions (LeaveRequest dual approval, Timesheet flags)
2. Backend: shifts service + routes
3. Backend: leaves service + routes
4. Backend: timecards service + routes (read + approve/reject)
5. Frontend: Shifts page + Shift Assignment + Bulk Assign modals
6. Frontend: Leaves page + Reject Leave modal
7. Frontend: Timecards page + Reject Timecard modal + Weekly Progress drawer
8. Wire routes, smoke test
