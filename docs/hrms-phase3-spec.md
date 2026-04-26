# HRMS Phase 3 — Employee Self-Service

Phase 3 covers the Employee experience: Home dashboard, My Shifts, My Leaves (with submit), My Profile. Grounded in Figma + AC + MOM.

---

## 1. Architecture

- **Same top horizontal nav** as HR Admin (Nemicare top bar with HRMS tab active)
- **Different left sidebar** — 10 items: Home / My Shifts / Leaves / Tasks / Timecard / My Progress / Chat / Documents / Profile / Settings
- Role-aware: `HrmsLayout` looks at `user.userRole` (or RBAC permission) and renders the right item set
- Employees only see/edit their own data — backend enforces `employeeId = (Employee where userId = req.user.userId).id`

## 2. Routes (Phase 3 in-scope)

| Route | Page | Source |
|---|---|---|
| `/hrms/me/home` | Employee Home | Home.png |
| `/hrms/me/shifts` | My Shifts | My Shifts.png |
| `/hrms/me/leaves` | My Leaves + Request Leave modal | Leaves.png + Leave Request.png |
| `/hrms/me/profile` | My Profile (view + edit) | Profile.png + Edit Details.png |

Auto-redirect on login: HR_ADMIN → `/hrms/employees`, EMPLOYEE → `/hrms/me/home`.

## 3. Backend endpoints (`/api/v1/me/*`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/me/profile` | Current user's Employee record |
| GET | `/api/v1/me/shifts/calendar?view=DAY\|WEEK\|MONTH&date=` | Pre-grouped calendar for self only |
| GET | `/api/v1/me/leaves?status=` | My leave requests |
| POST | `/api/v1/me/leaves` | Submit a leave request for self |
| GET | `/api/v1/me/leave-balance` | Current year balance |

Auth: any authenticated user. Service resolves Employee via userId. If no Employee exists for user → 404.

## 4. Employee Home page (`/hrms/me/home`)

### 4 stat cards (top row)
| Card | Content |
|---|---|
| Upcoming Shift | "Tomorrow / Morning · 8:00 AM - 4:00 PM" + calendar icon (cyan bg) |
| Leave Balance | "0/12 / Annual: 8 · Sick: 4" + leaf icon (green bg) |
| Pending Requests | Count + "Awaiting supervisor" + clock icon (orange bg) |
| Performance | "4.5/5 / Last review: Jan 2026" + star icon (blue bg) |

### My Weekly Schedule (large card, left)
- Title + Week navigation arrows + Month dropdown
- 7 day cards in row: Mon / Tue / Wed / Thu / Fri / Sat / Sun
- Each card shows shift type label (orange/green/blue tone) + time range OR "OFF" with diagonal-line pattern

### Clock In/Out card (right)
- Title "Clock In/Out" + status text "Not Started"
- 00:00:00 timer
- Break button (disabled until clocked in)
- **Clock-In** button (filled blue, becomes Clock-Out when active)
- **Phase 3 scope**: UI only with mocked behavior; the MOM-7 decision says clock-in = portal login. Real EVV+IP+geofencing in later phase. For now, button toggles state and stores a localStorage timestamp.

### Today's Tasks (bottom-left)
- Title + count badge + View All link
- Each task: circle checkbox + title + description + Pending chip (orange) + High priority chip (pink) + "Assigned By: Name"
- Phase 3 scope: placeholder — Tasks data feature isn't built yet. Empty state.

### Notice Board (bottom-right)
- Title + count badge + View All link
- Each: title + Holiday chip (blue) + posted date
- Phase 3 scope: placeholder — NoticeBoard model exists but not wired. Show empty state for now.

## 5. My Shifts page (`/hrms/me/shifts`)

- Title with calendar icon + **Request Shift Change** button (top-right)
- Week navigation + Month dropdown
- 7-day card row (Mon-Sun) showing shift type + time, or "OFF"
- **Past Requests** section below: tabs (All / Approved / Pending / Rejected) + table (Period / Change From / Change To / Description / Status / Action)
- Phase 3 scope: read shifts from `/api/v1/me/shifts/calendar`. Past Requests = ShiftChangeRequest model — not yet built. **Show placeholder empty state for Past Requests.** Request Shift Change button opens a "coming soon" tooltip.

## 6. My Leaves page (`/hrms/me/leaves`)

- Title + airplane icon + **Request Leave** button (filled blue)
- 4 balance cards: Annual / Sick / Personal / Unpaid (numeric values)
- **Past Requests** section: tabs (All / Approved / Pending / Rejected) + columns Request Type / Start Date / End Date / Description / **Supervisor** / **HR** / Action (eye + cancel)
- Both Supervisor + HR status columns shown (matches dual-approval flow built in Phase 2)
- Cancel button only enabled if Supervisor=PENDING (employee can withdraw)

### Request Leave modal
- Header: "Leave Request to- [chip with supervisor name]"
- Leave Balance card showing current balance for selected type with warning if exhausted
- Leave Type dropdown
- Start Date + End Date pickers
- Reason textarea (required)
- Supporting Documents drag-drop area (Phase 4 file upload)
- Cancel + **Send Request** (disabled until valid)

Endpoint: `POST /api/v1/me/leaves` with `{ leaveType, fromDate, toDate, reason }`. Backend reuses Phase 2 leaveService.createLeave.

## 7. Out of Phase 3

- Tasks (data + UI for managing)
- Timecard (employee-side weekly timecard view + send-to-supervisor)
- My Progress (performance review read-only)
- Chat / Messages
- Documents (employee view of employment docs)
- Settings (notification prefs)
- Real Clock-In/Out (EVV + IP whitelist + geofencing)
- Shift Change Request submission (entity not built)
- Cancel pending leave (route exists in spec, deferred to Phase 4)
- Supporting documents on leave request (file upload)

## 8. Build order

1. Backend `me.service.ts` + `me.routes.ts`
2. Update `HrmsLayout` to be role-aware (read user.userRole)
3. Frontend service `me.service.ts`
4. Employee Home, My Shifts, My Leaves + LeaveRequestDialog, My Profile
5. Wire routes + role-based home redirect
