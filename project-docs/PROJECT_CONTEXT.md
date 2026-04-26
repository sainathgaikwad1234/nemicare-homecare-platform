# Nemicare HomeCare Platform — Complete Project Context

## About the Project
Nemicare is a healthcare management platform built for **Sam Shah** (client) to manage operations across three types of care facilities:
- **ALF** — Assisted Living Facility (residential care for elderly)
- **ADH** — Adult Day Health (day program where members come in during the day and go home)
- **Home Care** — In-home care services
- **MC** — Memory Care (specialized care for dementia/Alzheimer's residents)
- **IL** — Independent Living (minimal care, mostly residential)

The platform has **4 portals** serving different user types:
1. **Facility Portal** — Used by Providers (nurses, admin staff, billing staff, schedulers) to manage residents, leads, charting, attendance, billing, scheduling
2. **Family Portal** — Used by family members/contacts to view their loved one's care info, vitals, medications, incidents, tickets, documents, chat with staff
3. **Super Admin Portal** — Used by system administrators to manage companies, facilities, users, roles, CPT/ICD-10 codes, forms, audit logs, branding
4. **HRMS Portal** — Used by HR Admins, Supervisors, and Employees for workforce management (shifts, timecards, leave, performance, onboarding, separation)

---

## Portal 1: Facility Portal (Primary Portal)

### 1. Login & Authentication
- **Account Setup**: Provider receives welcome email with "Set Password" link when admin creates their profile. Split-layout page with care facility background image on left, form on right with Nemicare logo
- **Login**: Email + Password on "Sign in to your account" screen. Validates credentials, then redirects to OTP screen
- **OTP Verification (2FA)**: 6-digit numeric OTP sent to registered email. Six individual digit input boxes with auto-advance cursor. "Verify" button disabled until all 6 digits entered. OTP expires in 5 minutes
- **Resend OTP**: Cooldown timer (30s) after resend. Max 5 resend attempts per session. Previous OTPs invalidated on resend
- **Forgot Password**: "Forgot Password?" link → enter email → receive reset link → Set Password screen. Generic response message to prevent email enumeration
- **Security**: Account lockout after 5 failed attempts (15 min lock). HTTPS required. Passwords hashed with bcrypt. JWT access token (15min) + refresh token (7 days)

### 2. Dashboard
- **Quick Links Row**: Text links + filled blue buttons + outlined buttons
- **Stats Bar**: Single white row with vertical dividers showing Active Members, New Leads, Attendance MTD, Visits Today
- **Today's Members Table** (left) + **Attendance Stacked Bar Chart** (right) — side by side
- **PA Authorization Calendar Grid** (left) + **Vitals & Progress Notes Calendar Grid** (right) — side by side
- **Add Activities**: Opens as right Drawer

### 3. Lead Management (CRM)

#### Lead Lifecycle
Leads flow through statuses: PROSPECT → QUALIFIED → DOCUMENTATION → VISIT_SCHEDULED → CONVERTING → CONVERTED → (or NURTURE / NOT_QUALIFIED / CLOSED)

#### Lead Operations
- **Add Lead**: Form with First Name, Last Name, Email, Phone, DOB, Gender, Address, Lead Source (Caring.com, A Place for Mom, Referral, Walk-in), Service Type (ADH/ALF/etc.), Lead Owner
- **View Lead List**: Table with columns — Lead ID, Lead Name, Source, Service Type, Status, Added By, Email, Lead Owner, Created On, Actions. Search, filter, pagination
- **Edit Lead**: Modify any lead field
- **Import/Export Leads**: CSV/Excel upload with validation, duplicate detection by email. Export filtered list
- **Add Filter**: Filter leads by status, source, service type, date range, owner
- **Lead Activity**: Timeline showing all activities with timestamps (Lead Created, Visit Done, Phone Call, SMS, Visit Scheduled)
- **Reject Lead**: Reject with mandatory reason

#### Lead Communication
- **Call Lead**: Select call type, add pre-call notes, initiate call, add in-call notes. Auto-transcription via RingCentral integration
- **AI Call Summary**: Automatically generated structured summary after each call (condition discussed, history highlights, family concerns, decision outcome, next actions)
- **SMS Lead**: Send SMS to lead. AI-generated SMS summary
- **Private Notes**: Internal notes visible only to staff
- **Public Notes**: Notes visible to lead/family

#### Visit Management
- **Schedule Facility Tour/Consultation**: Schedule visit with lead including date, time, location, provider
- **Calendar View**: Day, Week, Month views showing all scheduled visits
- **List View**: Scheduled visits in tabular format
- **Edit/Filter Visits**: Modify scheduled visits, filter by criteria
- **Visit Notes**: Add notes to completed visits (Post Visit Notes)

#### Rate & Pricing
- **Rate Card (Private Pay)**: View and send private pay rate card to lead. Room type pricing (Private room, Semi-private room). A La Carte vs Blended Rate options
- **Rate Card (Medicaid)**: View and send fixed state-mandated Medicaid rates

### 4. Lead-to-Resident Conversion (In-Progress Status)

When a lead is ready to convert, they enter an "In-Progress" state with a multi-step setup workflow. Steps differ by service type:

#### ADH Documentation Stepper
1. Case Agency Selection — Select Case Management Agency, request case manager
2. Patient Required Documents — View/send documents (Intake Form, Contract, State-specific docs, TB Test, ADH Agreement)
3. Case Manager Setup — Select Case Manager, send required documents
4. Transportation Request — Send Verida state transport request with details, add case manager to request, escalation capability
5. Billing Setup & Clearance — Add state-provided details (CPT/ICD-10 codes, NPI), track PA status (Submitted/Under Review/Approved/Denied)

#### ALF Documentation Stepper
1. Case Agency Selection — Same as ADH
2. Patient & Case Manager Setup — Documents + case manager
3. Check Bed Availability — Real-time bed check against state license capacity, view census (occupied/available/on-hold), room assignment (floor/room type filter), waitlist management
4. Billing Setup & Clearance — Payment type selection, PA process
5. Assessment — RN assessment scheduling, assessment form, care level decision, approve/reject admission

#### Conversion Flow
- Lead → In-Progress (ON_HOLD status) → Patient Setup wizard completed → New Arrival → Active Resident
- Each step must be completed before proceeding
- On ALF decline: notify family, release room hold

### 5. Resident Management

#### Resident List
- **View**: Table with tabs — All, Active, In-Progress, New Arrivals, Discharge In-Progress, Discharged
- **Columns**: Resident Name (avatar), Phone, Email, Service Type, Admission Date, Billing Type, Status (colored chips)
- **Status Chips**: Active (green), New Arrival (blue), In-progress (amber), Discharge In-progress (red), Discharged (gray)
- **Actions**: Edit, Delete, Discharge per row
- **Search/Filter/Pagination**: Full text search, status filters, paginated results
- **Import/Export**: CSV/Excel

#### Resident Detail (Face Sheet)
Sticky header showing resident profile (name, photo, status, service type, billing type, DOB/age, gender, contact info) with 11+ tabs below:

**Common Charting Tabs (ADH + ALF):**
- **Vitals**: Record temperature, blood pressure, heart rate, respiratory rate, oxygen saturation, weight, height, BMI. Add/Edit/View/Search
- **Allergies**: Type, allergen, reaction, severity, status, onset date. Add/Edit/View/Search
- **Medications**: Name, SIG, dosage, frequency, route, quantity, start/end dates, prescriber. Add/Edit/View/Search
- **Progress Notes**: Date, staff name, findings, interventions, level, status (Draft/Final). Add/Edit/View/Search
- **Documents**: Upload, view, manage documents. Folder structure with mandatory and custom docs
- **Incidents**: Minor and Major incidents — date, time, type, category, location, severity, description, action taken, witnesses, follow-up. Add/Edit/View

**ADH-Specific Tabs:**
- **Care Plans**: Problem, goal, approach, target date, provider, status. Add/Edit/View/Search
- **Events**: Date, note type, description, category. Add/Edit/View/Search
- **Pain Scale**: Date, pain level (0-10), location, intervention, post-intervention score. Add/Edit/View/Search

**ALF-Specific Tabs:**
- **Services**: Service name, type, frequency, start/end dates, provider. Add/Edit/View/Search
- **Tickets**: Support/maintenance tickets — title, category, priority, status, assigned to, description, resolution. Add/Edit/View/Search
- **Inventory**: Personal belongings — item name, category, quantity, condition, location. Add/Edit/View/Search
- **Face-to-Face Notes**: Assessment notes with CNA signature + RN approval workflow. Date, type, member name, findings, CNA signature, RN approval, status

### 6. Attendance (ADH-focused)

- **Daily Roster**: View all ADH members expected for the day with check-in/out status
- **Weekly Roster**: 7-day view of attendance
- **Check-In**: Record member arrival with timestamp
- **Check-Out**: Record member departure with timestamp
- **Mark Absent**: Select reason (hospitalization, scheduled vacation, illness, no-show, family emergency) with optional notes
- **Attendance Types**: Full-day, Half-day, Partial (system calculates duration and adjustable billable hours)
- **EDWP Form**: Complete Member Information Form with absence details, email to state case manager, track sign-off status
- **Activity Recording**: Record participation in therapy activities, personal care, meals, social activities. Copy from master template
- **Monthly Attendance Report**: Generate and export for previous month's services

### 7. Discharge Process (Multi-Step Wizard)

**Step 1 — Discharge Initiation:**
- Click "Discharge" action from resident list
- Fill mandatory discharge details: discharge reason (predefined categories), discharge date/time, discharge type
- Add specific events leading to discharge decision
- Fill mandatory discharge survey/comment

**Step 2 — Notification & Care Coordination:**
- Select and send notifications to: Parent/Guardian, Primary Caregiver, Care team members, Case Manager with EDWP mail
- View signed EDWP form (stored in Documents section)

**Step 3 — Final Evaluation:**
- Staff discharge survey (overall behavior, participation in therapy, medication compliance, strengths observed, areas of concern)
- Resident/family discharge survey (feedback)
- Quality of care rating

**Step 4 — Financial Closing & Confirmation:**
- Preview discharge confirmation details
- Create final medication list
- Generate final billing invoice through discharge date
- Include outstanding balances
- Apply security deposit deductions (unpaid balances, damages)
- Calculate final refund amount
- Initiate refund request (three-level approval workflow)
- Send refund check to responsible party

**Post-Discharge:**
- Release room, mark as AVAILABLE
- Update census (Occupied -1, Available +1)
- Archive resident record with 7-year retention for HIPAA compliance
- Preserve all historical data (clinical, financial, administrative)

### 8. Payment & Billing Configuration

#### Payment Types
- Medicaid
- Private Pay
- Insurance
- Insurance + Medicaid
- Insurance + Copay
- Medicaid + Copay

#### Medicaid Path
- Add billing details: Prior Authorization, frequency, CPT/ICD-10 codes, NPI numbers
- Track PA status (Submitted/Under Review/Approved/Denied)
- PA rejection → resubmit updated documents

#### Private Pay Path
- Single or multiple payers
- Payment methods: Card, Cash, Money Order, Check
- Equal Split or Custom Split between payers
- Generate separate invoices per payer

#### Insurance Path
- Add insurance details in Insurance tab
- Insurance + Medicaid mixed billing (insurance primary, Medicaid secondary)

#### Service Model & Pricing (ALF)
- **A La Carte**: Track individual services (Room, Board, Laundry, Transport)
- **Blended Rate**: Single bundle price, no individual tracking
- Rate card generation for Private room / Semi-private room
- Apply discounts, send rate card + welcome email

### 9. Scheduling & Calendar
- Calendar view (Day, Week, Month) for visits/appointments
- Create new appointments with details (time, region, type, provider, location, authorization, billing)
- Search member appointments
- Filter by facility, provider, type
- Staff shift management, conflict detection, availability tracking

### 10. Respite Care
- Add respite resident at admission with room assignment
- Collect upfront deposit
- Charting (vitals, medications) during stay
- Discharge with actual date, auto-release room

### 11. Independent Living (IL)
- IL-specific resident list view
- Medication module visibility (if facility offers IL + ALF/MC)
- Vitals, Progress Notes, Allergies — Add/Edit/View

### 12. Memory Care (MC)
- Behavior tracking (wandering, aggression)
- Cognitive assessment (MMSE scores)
- Elopement risk tagging + alerts
- Activity participation logging
- Family behavior/care updates
- Pain Scale at top of charting screen
- Incident reports

### 13. AI & Automation Features (Planned)
- One-click AI-generated progress notes from vitals/ADLs/history
- Regulatory-aligned documentation phrasing suggestions
- Missing element highlighting before submission
- Attendance anomaly detection
- Fall & ER pattern flagging
- Predictive hospitalization risk scores
- AI claim scrubber (CPT/ICD-10 validation, denial risk scoring)
- Smart staffing suggestions based on census/acuity
- Route optimization for transportation
- Auto-generated monthly progress notes (batch)
- AI lead qualification matching
- Patient-specific clinical recommendations
- Pain scale anomaly detection
- Intelligent care plan template suggestions
- AI Scribe for incident intervention guidance

---

## Portal 2: Family Portal

### Login & Onboarding
- Receive email invitation from facility
- Set password on first login
- OTP verification (2FA)
- Complete profile (personal info, address)
- Select linked resident (name, room, program type)

### Dashboard
- Summary cards: Family Members count, Active Alerts, Open Tickets, Next Visit date
- Resident demographics: photo, name, program, relationship, facility, room, comfortability score
- Overall progress bar, Pain Scale rating
- Frequency/schedule info, Enrollment details (start date, admitted date, expected discharge, payment type)
- Case Manager info (name, contact)
- Attendance calendar (monthly)
- Alerts, Incidents, Vitals summary, Allergies, Tickets
- Switch between multiple linked residents (tabs)
- Quick actions: Request Meet, Create Ticket

### Clinical Module (Read-Only)
- View Medications, Vitals, Progress Notes, Alerts, Allergies, Incidents, Inventory, Events

### Tickets
- Create support ticket (title, description, linked resident)
- Track status (Open/Closed tabs)
- View ticket detail, Edit open tickets
- Search/filter tickets

### Scheduling
- Request appointment (In-Person/Virtual, time window, family member, facility, preferred provider, message)
- View Upcoming/Past appointments
- Appointment cards with full details (date, time, resident, facility, provider, telehealth link)
- Cancel or Reschedule appointments

### Documents
- View & digitally sign documents shared by facility
- Upload documents (insurance cards, hospital papers)
- Mandatory documents tab (Intake Form, Contract, State-specific, TB Test, ADH Agreement)
- My Space (personal folders) + Group Space (shared documents)
- Create folders, upload documents (drag-and-drop, .png/.jpg, 5MB limit)
- Grid/List view toggle, Search, Filter, Star/favorite

### Billing
- View statements & payment history
- Pay via card
- Payment confirmation
- View/download invoices
- Monthly patient summary report with invoice (medication changes, vitals, alerts, incidents over 30 days)

### Communication
- Secure group messaging (with operations manager + assigned nurse)
- Contact list with avatars, last message preview
- Voice call from chat
- Message timestamps, Unread badges

### Notifications
- New document shared, Incident reported, Chat message, Ticket update
- Payment reminder (1st-5th of month), Late fee notice, Invoice generated
- Alert notification, Event notification, Appointment reminder

---

## Portal 3: Super Admin Portal

### Login
- Email + Password → OTP verification → Dashboard
- Resend OTP with cooldown timer
- Forgot/Reset Password flow

### Dashboard
- Metric cards: Facilities, Providers, Patients, Appointments, Encounters (live counts)
- Facilities list with name, company, status (Active/Inactive), pagination, search, sort
- Click facility → detail screen

### Company/Organization Onboarding
- Add Company (with details)
- View/Search/Filter registered companies
- Edit company profile
- Set brand color + company logo per company

### Facility Management
- Add/View/Edit facilities
- Location details
- Users management (add, view, edit, archive)

### Settings / Master Management
- View/Edit own profile
- Add/manage other users, Import/Export users
- Roles & Permissions management
- CPT Codes: Add/Edit/Archive/View/Import/Export/Search/Filter
- ICD-10 Codes: Add/Edit/Archive/View/Import/Export/Search/Filter
- Service Codes: Manage and map to service types
- Specialities: Add/Edit/View/Archive
- Support Tickets: View all facility-submitted tickets
- Form Builder: Create/archive/duplicate forms, manage templates, assign to facilities

### Audit Log
- View all company-level audit logs
- Download as CSV/PDF
- Search & filter logs

### Document & Invoice Branding
- Configure facility logo on generated documents
- Configure legal facility name on document headers
- Configure logo on invoices

### Notifications
- Configure notification settings per event (User Add, Facility Add, Task)
- Enable/disable channels: SMS, Email, Push, Family Portal
- Track notification setting changes

---

## Portal 4: HRMS Portal

### HR Admin Operations
- **Dashboard**: Summary cards (Total Employees, Pending Leave Approvals, Expiring Documents, Payroll Status). Leave approval queue, Compliance alerts, Workforce movement (new joiners/exits), Staffing management, Activity log
- **Employee Management**: Add employee, View employee list (All/Active/Terminated tabs), Manage onboarding forms (background check, drug screen), Manage mandatory documents (licenses, visa), Activate employee after verification
- **Employee Profile**: Personal details, documents, shifts, leave history, timecards
- **Shift Calendar**: Day/Week/Month views with Day Off & Leave entries, shift timeline, filters
- **Leave Management**: View all leave requests (All/Approved/Rejected/Pending), Approve/Reject with details
- **Performance Reviews**: View list, Approve reviews, View details
- **Training & Orientation**: Schedule orientation, assign training modules, update completion status
- **Employee Separation**: Create separation request, View exit management list, Conduct exit interview, Final pay calculation, Revoke portal access, Terminate benefits

### Supervisor Operations
- **Dashboard**: Today's coverage %, active staff, on shift, pending approvals, upcoming leave, weekly shift calendar, staffing coverage graph, approval queue
- **Shift Management**: List/Week/Month views, Create/Edit/Assign shifts, Bulk assign, Change shift type, Assign backup staff
- **Shift Change Requests**: View requests, Check availability/conflicts, Approve/Reject
- **Leave Requests**: View all, Approve/Reject with replacement assignment
- **Performance**: View reviews, Add employee for review, Submit reviews with ratings/comments
- **Timecards**: View weekly timecards, Approve/Reject with reason
- **Tasks**: View/Assign/Edit tasks to employees
- **Incident & Disciplinary**: Log incident reports for staff, Request attendance corrections

### Employee Operations
- **Dashboard**: Upcoming shift card, Leave balance card, Pending requests card, Performance card
- **Schedule**: View weekly schedule (Day/Week/Month), Clock In/Out with timer + break marking
- **Tasks**: View today's tasks with priority/status, Mark complete
- **Timecards**: View weekly summary (Total Hours, Break Time, Net Hours, Overtime), View all history, Send for approval, Submit overtime requests
- **Leave**: Submit leave request, View balances (Annual/Sick/Personal/Unpaid), View past requests, Cancel pending
- **Shift**: View assigned schedule, View/Submit shift change requests, Accept/Decline shift swaps
- **Notice Board**: View notices with category tags
- **Profile**: View/Edit personal details

### Payroll
- Pay period, Workweek, Overtime calculation settings
- Auto-generated timesheets from EVV clock in/out + scheduled shifts
- Automated pay calculations (overtime, shift differentials, premium pay)
- Multi-level timesheet approval workflow
- Payroll export (ADP, Gusto, Paychex, QuickBooks formats)

---

## Business Rules & Domain Knowledge

### Multi-Tenancy
- Company → Facility → Users/Residents/Leads
- All data scoped by companyId, optionally facilityId
- RBAC: Permission-based access (e.g., leads.read, residents.create, charting.read)

### HIPAA Compliance
- Audit log on every API request (userId, companyId, action, entity, IP, user-agent)
- 7-year audit retention (HIPAA_AUDIT_RETENTION_DAYS=2555)
- PHI fields: SSN, DOB, medical conditions, allergies, medications, vitals, clinical notes, billing info
- Feature flags: HIPAA audit logging, encryption, access controls, MFA, session timeout, password expiry

### Medicaid Workflow (ADH)
- Lead qualifies → Case Agency selected → Case Manager assigned → Documents sent → Transportation (Verida) arranged → State-provided details (CPT/ICD-10, NPI) entered → PA submitted → PA approved → Billing configured → Convert to resident
- Monthly Attendance Report submitted to state Medicaid
- EDWP form sent to case manager for electronic sign-off

### ALF Room Management
- Room types: Private, Semi-private
- Room statuses: AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, HOLD
- Bed census: Real-time tracking against state license capacity
- Waitlist management when no beds available
- Room hold management (hold/release)
- On admission: HOLD → OCCUPIED, census updated
- On discharge: OCCUPIED → AVAILABLE, census updated

### Resident Statuses
- ACTIVE — Currently receiving care
- ON_HOLD — In-progress (going through patient setup)
- NEW_ARRIVAL — Recently converted, not yet fully active
- DISCHARGED — Completed discharge process
- DECEASED

### Lead Statuses
- PROSPECT → QUALIFIED → DOCUMENTATION → VISIT_SCHEDULED → CONVERTING → CONVERTED
- Alternative paths: NURTURE, NOT_QUALIFIED, CLOSED

### Lead Sources
- Caring.com, A Place for Mom (websites)
- Referral
- Walk-in
- Phone Call

### Service Types Affecting Workflows
- **ADH**: Day program, transportation needed (Verida), attendance tracking critical, EDWP forms
- **ALF**: Residential, room/bed management, move-in/discharge, A La Carte vs Blended billing
- **MC**: Behavioral tracking, cognitive assessments, elopement risk, specialized incident reporting
- **IL**: Minimal clinical, optional medication module, vitals + progress notes
- **Home Care**: In-home visits, EVV (Electronic Visit Verification)

### Billing Types
- MEDICAID — State-funded, requires PA (Prior Authorization), CPT/ICD-10 codes, state-mandated rates
- PRIVATE_PAY — Multiple payers possible, split billing (equal/custom), rate cards
- INSURANCE — Insurance details, eligibility verification
- MIXED — Combinations of above (Insurance+Medicaid, Insurance+Copay, Medicaid+Copay)

---

## Acceptance Criteria & Test Scenario Patterns

Every user story in this project follows a structured format with:
1. **Acceptance Criteria** — If/Then/Else conditions covering all functional paths
2. **Positive Functional Tests** — Verify happy path works correctly
3. **Negative Tests** — Invalid inputs, missing fields, unauthorized access
4. **UI Scenarios** — Layout, styling, labels, responsiveness, Figma compliance
5. **Edge Cases** — Boundary values, rapid clicks, browser behaviors, concurrent users
6. **Security Tests** — HTTPS, XSS, SQL injection, brute-force protection, token security
7. **Performance Scenarios** — Page load times (<3s), API response times (<2s), email delivery (<30s-60s)

---

## Figma Design Reference Areas
- Login screens (split-layout with care facility background)
- Dashboard (stats bar, tables, calendars, charts)
- Lead Management (list, add/edit forms, activity timeline, call/SMS, visit scheduling, rate cards)
- ALF Lead-to-Resident flow (patient info, payment types, case manager steps, billing, room layout)
- Resident Face Sheet (header + 11 tabbed sections)
- Discharge flow (4-step wizard)
- Document management & Attendance
- Calendar (day/week/month views, events, activities)
- Family Portal (login, dashboard, vitals, medications, tickets, chat, documents)

---

## External Integrations (Planned/Configured)
- **Verida** — State transportation provider integration (route/trip management for ADH members)
- **RingCentral** — Phone/call integration with auto-transcription
- **DocuSign/E-Signature** — Document signing workflows
- **Payroll Systems** — ADP, Gusto, Paychex, QuickBooks export
- **State Medicaid Systems** — PA submission, attendance reporting, EDWP forms
- **AI/ML** — Call summarization, progress note generation, risk scoring, care plan suggestions
