# HRMS Phase 1 — Build Spec

**Sources cross-referenced:** HRMS user stories CSV (242 rows) · HRMS AC & test scenarios CSV (3231 rows / 138 stories) · 22 MOM transcripts · 84 HRMS Figma screens (HR Admin: 36, Supervisor: 23, Employee: 25).

Phase 1 scope = **HR Admin role only**: Sidebar, Dashboard (placeholder), Employees List, Add Employee, Onboarding stepper, Active Employee Profile (5 read-only tabs).

---

## 1. Architectural decisions

1. **HRMS layout** = existing top horizontal nav (with `HRMS` tab active) + a new dedicated **icon-only thin left sidebar**. Sidebar items: Home, Employees, Onboarding, Shifts, Leaves, Payroll, Chat, Reviews, Documents, Exits, Reports, Settings.
2. **Two role concepts on each Employee:**
   - `userRole`: access level — `HR_ADMIN | SUPERVISOR | EMPLOYEE` (drives RBAC)
   - `clinicalRole`: job role shown on list — `LPN | RN | CNA | ...` (extensible)
   - Plus a free-text `designation` field (e.g., "Registered Nurse")
3. **Status taxonomy:**
   - `Employee.status` = `ACTIVE | TERMINATED` (only these in Active list)
   - `Employee.onboardingStatus` = `IN_PROGRESS | COMPLETED`; new employees default `IN_PROGRESS` and appear under `/onboarding` route, NOT the Employees list.
4. **3-step onboarding stepper** is on each Onboarding employee's profile (Documentation tab):
   - Step 1: Pre-Employment Screening
   - Step 2: Mandatory Document Collection
   - Step 3: Employment Activation
5. **Background check agencies are per-state** (MOM-10). Need agency directory + per-employee routing.
6. **MVP scope decisions inherited from MOMs:** ADP-only payroll; clock-in via portal login (no separate button); IP whitelist + geofencing for clock-in; OT only allowed for caregivers; shift swap dropped; performance review annual cadence; recruiting in scope but later.

---

## 2. Schema additions

### Modify `Employee`
Add fields:
- `salutation` (string?)
- `userRole` (enum: HR_ADMIN | SUPERVISOR | EMPLOYEE) — replaces existing `hrmsRole` semantics
- `clinicalRole` (string?, e.g., LPN/RN/CNA — kept extensible)
- `designation` (string?)
- `country` (string?)
- `language` (string?)
- `about` (string?)
- `reportingManagerId` (int? FK → Employee.id)
- `probationEndDate` (DateTime?)
- `noticeEndDate` (DateTime?)
- `slackMemberId` (string?)
- `maritalStatus` (string?)
- `businessAddress` (string?)
- `addressLine2` (string?)
- `socialLinks` (Json?) — array of {platform, url}
- `ssn` (string?, encrypted at app layer in production)
- `overtimeAllowed` (boolean, default false; flip true for caregivers)
- `onboardingStatus` (enum: IN_PROGRESS | COMPLETED, default IN_PROGRESS)
- `onboardingStep` (int, 1-3, default 1)
- `officialStartDate` (DateTime?)
- `welcomeEmailHistory` (Json?, array of {sentAt, sentById, subject})

### New models

```prisma
model BackgroundCheckAgency {
  id           Int    @id @default(autoincrement())
  companyId    Int
  location     String           // state name or code
  agencyName   String
  contactEmail String?
  contactPhone String?
  active       Boolean @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([companyId, location])
}

model OnboardingDocument {        // Step 1 documents
  id           Int      @id @default(autoincrement())
  companyId    Int
  employeeId   Int
  employee     Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  documentType OnboardingDocumentType
  status       OnboardingDocumentStatus @default(PENDING)
  fileUrl      String?
  sentAt       DateTime?
  completedAt  DateTime?
  agencyId     Int?           // FK to BackgroundCheckAgency
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([employeeId])
}

enum OnboardingDocumentType {
  BACKGROUND_CHECK_REPORT
  DRUG_SCREEN_REPORT
  DMV_BACKGROUND_CHECK
}

enum OnboardingDocumentStatus {
  PENDING
  SENT
  COMPLETE
}

model OnboardingMandatoryDoc {     // Step 2 documents
  id           Int      @id @default(autoincrement())
  companyId    Int
  employeeId   Int
  employee     Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  slot         MandatoryDocSlot
  fileUrl      String
  uploadedAt   DateTime @default(now())
  uploadedById Int
  @@unique([employeeId, slot])
}

enum MandatoryDocSlot {
  LICENSES
  CPR_CERTIFICATES
  TB_TESTS
  I9_W4_FORMS
  VISA_DETAILS
}
```

### Existing `EmployeeDocument`
Already has `documentType`, `expiryDate`, `status` — add `category` (Mandatory | Other) for the active-employee Documents tab sub-tabs.

---

## 3. Backend endpoints (Phase 1)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/employees` | filter `?status=ACTIVE\|TERMINATED` (default ALL active+terminated, exclude IN_PROGRESS) |
| GET | `/api/v1/onboarding/employees` | list IN_PROGRESS employees |
| GET | `/api/v1/employees/:id` | full profile (works for both onboarding + active) |
| POST | `/api/v1/employees` | sets onboardingStatus=IN_PROGRESS, status=ACTIVE (status field), step=1 |
| PUT | `/api/v1/employees/:id` | edit profile fields |
| GET | `/api/v1/employees/:id/onboarding` | step state + Step 1 docs + Step 2 mandatory docs |
| POST | `/api/v1/employees/:id/onboarding/step1/documents` | body: documentType — creates OnboardingDocument PENDING |
| POST | `/api/v1/employees/:id/onboarding/step1/documents/:docId/send` | marks SENT |
| POST | `/api/v1/employees/:id/onboarding/step1/documents/:docId/complete` | body: fileUrl — marks COMPLETE |
| DELETE | `/api/v1/employees/:id/onboarding/step1/documents/:docId` | remove |
| PUT | `/api/v1/employees/:id/onboarding/step1/agency` | body: location, agencyId |
| POST | `/api/v1/employees/:id/onboarding/step1/satisfactory` | gates step 2; requires all 3 docs COMPLETE |
| POST | `/api/v1/employees/:id/onboarding/step2/upload` | body: slot, fileUrl |
| POST | `/api/v1/employees/:id/onboarding/step3/activate` | body: officialStartDate; sets status=ACTIVE+onboardingStatus=COMPLETED |
| POST | `/api/v1/employees/:id/welcome-email` | sends/resends welcome email; appends to history |
| GET | `/api/v1/background-check-agencies` | filter by location |

---

## 4. Frontend pages (Phase 1)

| Route | Page | Source screens |
|---|---|---|
| `/hrms/employees` | Employees list (tabs All/Active/Terminated) | Employees(All), Employees(Active), Employees/Terminated |
| `/hrms/employees/:id` | Active Employee Profile (5 tabs: Personal/Documents/Shifts/Leave History/Timecards) | Profile/Personal Details, /Documents, /Shifts, /Leaves History |
| `/hrms/onboarding` | Onboarding list (all IN_PROGRESS) | Onboarding |
| `/hrms/onboarding/:id` | Onboarding profile + 3-step stepper | Onboarding-1 to -6, Employment Activation |
| `/hrms/dashboard` | HR Admin dashboard placeholder (Phase 1.5) | Dashboard (HR) |

All wrapped in `<HrmsLayout>` which provides the icon-only left sidebar.

---

## 5. Add Employee modal — exact fields per Figma

**Section: Account Details**
| Field | Control | Required |
|---|---|---|
| Profile Picture | upload (preview, eye, upload, delete icons after upload) | optional |
| Employee ID | text "eg.996" | required, unique |
| Employee Name | text "Add Employee Name" | required |
| Salutation | dropdown (Mr/Mrs/Ms/Dr) | optional |
| Employee Email | dropdown text | required, unique, email format |
| User Role | dropdown (Employee, Supervisor, HR Admin) | required |
| Designation | dropdown OR text — Figma shows both; **default to text input** as primary, dropdown later for standardization | required |
| Department | text "Design" placeholder | required |
| Phone Number | text "(406) 555-0120" | required |
| Country | dropdown with flag | required |
| Gender | text/dropdown | required |
| Joining Date | date picker | required |
| Reporting To | dropdown of existing Employees by name | required (per AC) |
| Language | dropdown with flag | optional |
| About | textarea | optional |

**Section: Other Details** (continues below — Figma cuts off, so based on Personal Details visible fields):
- Address Line 1 (text), Address Line 2 (text), City, State, Zip Code
- Probation End Date, Notice End Date
- Slack Member ID, Marital Status, Business Address
- Emergency Contact (Name / Phone / Relation) — placement TBD; using Figma profile structure as guide

Buttons: Cancel (outlined) + **Save** (filled blue, top-right corner of modal footer)

---

## 6. Onboarding stepper specifics

### Step 1 — Pre-Employment Screening (Onboarding-2 to -4)
- Header: "Document Share & Sign" with **Add More** button (top-right) when ≥1 doc exists
- 3 fixed default rows (added on demand):
  - Background Check Report
  - Drug Screen Report
  - DMV/Background Checks
- Each row: doc icon + title + (PENDING: Send button outlined / SENT: spinner / COMPLETE: green "Complete" badge + View + Delete) + delete icon
- Below: "Background Agency Routing" section
  - Location dropdown (state)
  - Agency Name dropdown (filtered by location)
- Footer: Next button (disabled until ≥1 doc) OR **Mark as Satisfactory →** (replaces Next when all 3 docs COMPLETE) → advances to Step 2

### Step 2 — Mandatory Document Collection (Onboarding-5)
- Title: "Documents Upload"
- 5 fixed slots:
  - Licenses
  - CPR certificates
  - TB tests
  - I9 (W4) forms
  - Visa Details
- Each row: doc icon + title + Upload button (when uploaded shows file row with View/Delete instead)
- Footer: ← Previous + Next →
- Cannot advance to Step 3 until at least required slots filled (per AC: Licenses + I9 + Visa(if applicable) — for Phase 1 require all 5; configurable later)

### Step 3 — Employment Activation (Onboarding-6)
- Section: "Employee Summary" (read-only): Name, Department, Job Title (=designation), Supervisor (=reportingManager.name)
- Field: **Official Start Date*** (date picker, required)
- Footer: ← Previous + **Convert to Active** (filled blue) → confirmation modal "Convert to Active - {Name} / Are you sure you want to convert this employee to active? / Department / Supervisor / Close + Done"
- On Done: PATCH employee onboardingStatus=COMPLETED, status=ACTIVE, officialStartDate=picked
- Redirects to Employees list

### Always-visible "Send Welcome Email" card (top of every onboarding step)
- Title: "Send Welcome Email"
- Subtitle: "Includes login credentials, first-day instructions, and company handbook."
- Right: **Send** button (outlined)
- Click → POST welcome-email → toast "Welcome email sent"; button shows "Resend" if `welcomeEmailHistory` non-empty

---

## 7. Active Employee Profile (5 tabs)

### Header (sticky)
- Photo (avatar)
- Name + ID chip ("ID : 996") + designation (text below name)
- Email + phone
- Right: 4 social icons (LinkedIn, Slack, WhatsApp, X) with the URL stored in `socialLinks`

### Personal Details tab
- Section "Personal Details": Date of Birth, Age (computed), Gender, Language Preference, SSN
  - SSN: Figma shows visible. Phase 1 = display masked by default (`***-**-1234`) with click-to-reveal (audit-logged). Will revisit if Sam confirms always visible.
- Section "Other Details": Address Line 1, Address Line 2, City, State, Zip Code, Probation End Date, Notice End Date, Slack Member ID, Marital Status, Business Address
- Top-right: **Edit Info** button (outlined)

### Documents tab
- Header: "Documents" + segmented control **Mandatory / Other** + **+ Add Document** button (filled, top-right)
- Table columns: Title (link), Uploaded Date, Expiry Date, Status (badge), Action (kebab)
- Status badges: Active (green), Expiring Soon (orange, ≤30 days to expiry), Expired (red)
- Pagination: "Rows per page: 10" + numbered pages

### Shifts tab
- Header: "Recent Shifts" + **+ Create Shift** button (filled, top-right)
- Columns: Date, Shift (1st/2nd/3rd Shift + time range below), Hours, Overtime, Status
- Status badges: Completed (green), Overtime (orange)
- (Phase 1: read-only — empty state until Phase 2 builds shift creation)

### Leave History tab
- Columns: Request Type, Start Date, End Date, Description, Status, Action (kebab)
- Status badges: Approved (green), Rejected (red), Pending (orange)
- Pagination
- (Phase 1: read-only — empty state until Phase 2)

### Timecards tab
- Phase 1: read-only — placeholder. Built in Phase 2/3.

---

## 8. Spec ambiguities (flagged, defaulted to Figma)

| # | Question | Default chosen | Recheck |
|---|---|---|---|
| 1 | SSN visible vs masked? | Mask by default + reveal-on-click (audit-logged) | Confirm with Sam |
| 2 | Designation: dropdown or free text? | Free text input (matches profile display) | Confirm |
| 3 | Employee Name single field vs first/middle/last? | Single field on form; parse-or-store-as-is on backend; profile shows full name as entered | Reconfirm — most systems use structured |
| 4 | Welcome email content: textarea or simple Send? | Phase 1 = simple Send button (Figma); Phase 2 add textarea per AC | — |
| 5 | "Label / Label" placeholder tabs in Onboarding profile | Skip in Phase 1; ignore | Awaiting Figma updates |

---

## 9. Out of Phase 1 (deferred)

- HR Admin Dashboard (cards + sections) — Phase 1.5
- Supervisor pages — Phase 2
- Employee self-service — Phase 3
- Shift Calendar / Shift Change Requests / Bulk Assign — Phase 2
- Leave dual-approval workflow + replacement assignment — Phase 2
- EVV clock-in via portal login + Timecard auto-gen — Phase 3
- Pay Rules engine + ADP export — Phase 4
- Performance Reviews — Phase 4
- Training & Orientation — Phase 4
- Exit / Separation 5-step flow — Phase 4
- Notice Board / Chat — Phase 5
- Reports / Analytics — Phase 5
- Background check email-to-agency integration — Phase 2 (manual upload in Phase 1)
- IP whitelist + geofencing — Phase 3 (clock-in)
- Shift swap — dropped from MVP per Sam (MOM-21)
- Mileage reimbursement — deferred per Sam (MOM-10)

---

## 10. Build order (this is what I'll execute next)

1. Schema fixes + new models
2. Backend endpoints
3. `HrmsLayout.tsx` (icon-only sidebar)
4. Refactor Employees list (3 tabs, correct columns)
5. Rebuild Add Employee form to spec
6. Onboarding list page
7. Onboarding profile + 3-step stepper
8. Active Employee Profile (5 tabs)
9. Wire routes, migrate, smoke test
