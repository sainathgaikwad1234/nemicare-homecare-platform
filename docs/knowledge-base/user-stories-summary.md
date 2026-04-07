# Nemicare Platform — Complete User Stories Summary

**Generated:** 2026-04-04 (updated with full extraction)
**Source:** project-docs/user-stories/ + project-docs/acceptance-criteria-test-scenarios/
**Total:** ~1,018 user stories | 809 with detailed acceptance criteria & test scenarios

---

## Scope Overview

| Portal | User Stories | With AC | Status Breakdown |
|--------|-------------|---------|------------------|
| Facility Portal | 703 | 503 | New ~430, Removed ~160, Retained ~85, Phase 2 ~50 |
| Family Portal | 106 | 116 | New 81, Retained 12, Removed 9, Modified 4 |
| HRMS Portal | 136 | 135 | New 112, Removed 13, Retained 8 |
| Super Admin Portal | 73 | 55 | New 44, Retained 16, Removed 12 |
| **Total** | **~1,018** | **~809** | |

### What we've built: ~30 stories (~3% of total)

---

## FACILITY PORTAL (703 stories — 28 categories)

### Login (6 stories)
- Welcome email with Set Password link
- First-time password setup
- OTP 2FA on login (6-digit email OTP)
- Resend OTP
- Secure login with credentials
- Forgot password / reset

### Lead Management (~52 stories)
- **Lead Intake**: Capture source (Caring.com, A place for mom, Referral, Walk-in)
- **Lead CRUD**: Add, edit, view, list, import/export leads
- **Lead Assignment**: Assign to sales team, assign service type (ADH/ALF)
- **Lead Follow-up**: Document notes, track follow-ups
- **Lead Qualification**: Track qualification score, win/loss reasons
- **Lead Communication**: Call lead (pre/in-call notes), AI call summary, SMS, private/public notes
- **Visit Management**: Schedule facility tour, calendar/list view, edit/filter visits, visit notes
- **Rate & Pricing**: View/send private pay rate card, Medicaid rates
- **Documentation**: View/send patient documents, document status, resend, sign
- **Lead Activity**: Activity overview timeline (created, visit, call, SMS, scheduled)
- **Reject Lead**: Reject with reason

### Resident InProgress (~15 stories)
- Select Case Agency & request case manager
- Referral form notes
- Send documents to case manager
- Send Verida transport request (state transport)
- Add state-provided details (CPT/ICD-10, NPI)
- Track PA status (Submitted/Under Review/Approved/Denied)
- PA rejection resubmission
- Add billing & clearance details
- Convert Lead → New Arrival → Active
- View frequency history

### Resident Management (~10 stories)
- **Resident List**: All, Active, In-progress, New Arrivals, Discharged
- **Filter & Search**: Filter and search residents
- **Import & Export**: Import/export resident list
- **View Demographics**: Resident header bar with basic details
- **Manage Details**: Update profiles, payers, contacts, preferences
- **Frequency Schedule**: View/edit service days
- **Transportation Tracking**: View auth expiration, usage progress
- **Attendance Tracking**: Monthly attendance card with progress bar

### Room Management — ALF (~8 stories)
- Bed availability check (private/semi-private vs state license)
- View bed census (occupied, available, on hold)
- Room assignment (filter floor, room type, assign)
- Waitlist management (move to waitlist, view, notify, track duration)
- Room hold management (hold/release room)

### ADH — Daily Operations & Attendance (~19 stories)
- Check-in / check-out for day program
- Full-day, half-day, partial attendance recording
- Absence tracking with reason codes
- EDWP form completion and email to state
- View attendance roster
- Track EDWP sign-off status
- Activity recording (therapy, personal care, meals, social)
- Copy activities from template
- View daily activity summary
- Monthly attendance report export

### Transportation (~7 stories)
- Route/trip assignment (Verida integration)
- Assign/reassign trip drivers
- View driver capacity
- Trip attendance tracking (CSV import)
- Update trip status (transported/no-show)
- Standing order renewal (60-day alert)
- Modify standing order

### Patient Charting — Common ADH & ALF (~35 stories)
- **Medications**: Add, edit, view list, search/filter
- **Vitals**: Add, edit, view list, search/filter
- **Allergies**: Add, edit, view list, search/filter
- **Progress Notes**: Add, edit, view list, search/filter
- **Activities**: Add, edit, view list, search/filter
- **Documents**: Add, edit, view list, search/filter
- **Minor Incidents**: Add, edit, view list
- **Major Incidents**: Add, edit, view list

### Patient Charting — ADH Specific (~12 stories)
- Face Sheet (Care Plans, Allergies, Medications, Vitals, Progress Notes, Events, Activities)
- Care Plan CRUD + search/filter
- Events CRUD + search/filter
- Pain Scale CRUD + search/filter

### Patient Charting — ALF Specific (~15 stories)
- Face Sheet (Tickets, Allergies, Medications, Vitals, Progress Notes, Incidents, Activities)
- Services CRUD + search/filter
- Support/Maintenance Tickets CRUD + search/filter
- Inventory CRUD + search/filter
- Face-to-Face Notes with CNA + RN approval workflow

### Payment/Billing Configuration (~25 stories)
- **Payment Types**: Medicaid, Private Pay, Insurance, Insurance+Medicaid, Insurance+Copay, Medicaid+Copay
- **Medicaid Path**: PA process, billing details, edit
- **Private Pay Path**: Multiple payers, edit, payment method (Card/Cash/Check/MO)
- **Insurance Path**: Add/edit insurance details
- **Mixed Billing**: Insurance+Medicaid split, Copay+Insurance, Medicaid+Copay
- **Payment Split**: Equal split or custom split, generate split invoices
- **Service Model**: A La Carte vs Blended Rate
- **Rate Card**: Generate, view, edit, apply discount, send with welcome email
- **Security Deposit**: Collect, process receipt, send receipt

### Pre-Admission Assessment (~7 stories)
- Schedule RN assessment
- Add/edit assessment details
- Send for RN signature
- Care level decision
- Approve/reject admission
- Notify decline decision
- Release room hold on decline

### Admission Processing (~5 stories)
- Room assignment finalization
- Update room status (HOLD → OCCUPIED)
- Set move-in date
- Activate resident status
- Update census report

### Discharge Process (~20 stories)
- **Step 1**: Initiate discharge, fill details, add events, mandatory survey
- **Step 2**: Notification & care coordination (parent, caregiver, team, case manager)
- **Step 3**: Staff discharge survey (final evaluation)
- **Step 4**: Discharge confirmation preview
- **Financial Closing**: Final billing invoice, outstanding balances, security deposit deductions, refund calculation, 3-level approval, send refund
- **Room Release**: Release room, update census
- **Record Archival**: 7-year retention for compliance

### Respite Care (~8 stories)
- Add/edit respite resident, room assignment, deposit collection
- Vitals, medications, discharge, room release

### Independent Living (~10 stories)
- IL-filtered resident view
- Medication module visibility
- Vitals, progress notes, allergies CRUD

### Memory Care (~14 stories)
- Behavior event logging (wandering, aggression)
- Care plan adjustments

### Dashboard (~29 stories)
- Summary cards, resident stats, alerts, operational monitoring

### Document Management (~42 stories)
- Folder hierarchy, upload, sharing, permissions, audit trail

### Settings (~76 stories)
- Profile, data import, facility config, roles & permissions

### Scheduling (~5 stories)
- Multi-facility filtering, calendar views

### Analytics & Reports (~14 stories)
- Monthly attendance, clinical reports, CSV/PDF export

### AI & Automation (~19 stories)
- AI route optimization for transportation
- Predictive analytics

### Communication (~17 stories)
- Internal messaging (Inbox, Sent, Archive), compose, patient-linked messages
- Tasks: view/share/sign/upload documents, completion tracking

### Encounter (~15 stories) — REMOVED
- Start encounter, SOAP/narrative charting, templates, sign & lock (all Removed status)

### Billing & Revenue Cycle (~47 stories) — PHASE 2
- Automated charges, claim submission, ERA import, denial management
- Invoices, receipts, AR management, payment posting
- Batch claims, reconciliation, write-off rules

### MAR - Medication Admin Records (~12 stories) — PHASE 2
- Medication order profile, MAR views, administration outcomes
- High-risk double-check, PRN documentation, missed dose alerts

### Security & Compliance (~3 stories)
- RBAC, MFA, comprehensive audit logs

### Intake Forms (~7 stories)
- Previous intake forms, multi-step wizard, configurable forms by program/state

### Service Plan (~7 stories) — REMOVED
- Templates, goal/intervention entry, review dates, signatures

### Contacts & Assessments (~37 stories)
- Contact management, care team, assessment tools (pain scale, fall risk, PHQ-9)
- Profile details, enrollment, multi-program support

### Facility Compliance (~4 stories)
- Compliance dashboard, recurring schedules, digital logs, photo attachments

### Telehealth (~3 stories)
- Video calling, appointment URL sharing, EMR invite

### Audit Log (~3 stories)
- View, download, search/filter audit logs

### Inventory & Supplies (~4 stories) — REMOVED
- Item catalog, location-based stock, transactions, low-stock alerts

---

## FAMILY PORTAL (106 stories)

### Login & Onboarding (10 stories)
- Email invitation, password setup, OTP 2FA, profile completion, resident selection

### Dashboard (17 stories)
- Summary cards (Family Members, Alerts, Tickets, Next Visit)
- Resident demographics, progress bar, pain scale, enrollment info
- Attendance calendar, vitals, allergies, incidents, alerts
- Quick actions (Request Meet, Create Ticket)
- Multi-resident toggle

### Scheduling (11 stories)
- Appointment request/view/cancel/reschedule
- Upcoming/Past tabs, telehealth links, search

### Billing (8 stories)
- Statements, payment history, add card payment, invoices

### Clinical Module (9 stories)
- View medications, vitals, progress notes, alerts, allergies, incidents, inventory, events

### Documents (17 stories)
- My Space, Group Space, folders, upload, grid/list view, search, favorites

### Tickets (8 stories)
- Create/track tickets, Open/Closed tabs, search, filter

### Communication/Chat (6 stories)
- Secure messaging, contacts, voice call from chat

### Notifications (10 stories)
- Document, incident, chat, ticket, payment, invoice, alert, event, appointment notifications

### Settings/Profile (7 stories)
- View/edit profile, linked family members, password change

### Telehealth (3 stories)
- Joining links, encounter record, connectivity check

---

## HRMS PORTAL (136 stories)

### Core HRMS (9 stories)
- Payroll settings, compliance monitoring, PTO, timesheets, auto-generated timesheets, pay calculations, approval workflow, payroll export

### Dashboard (10 stories)
- Summary cards, leave approval queue, compliance alerts, workforce movement, staffing, activity log

### HR Admin Operations (34 stories)
- Employee CRUD, onboarding forms, mandatory documents, activation
- Shifts, leave, timecards management
- Performance reviews, training, exit management
- Shift calendar (day/week/month), reports

### Supervisor Operations (42 stories)
- Dashboard with coverage %, active staff, approval queue
- Shift management (create, assign, bulk, edit, swap)
- Leave/shift change request approval
- Performance review submission
- Timecard approval
- Task assignment and tracking

### Employee Operations (35 stories)
- Dashboard cards, weekly schedule, clock in/out
- Timecard submission, overtime requests
- Leave management (submit, view balance, cancel, track)
- Shift schedule, shift change requests
- Documents & compliance
- Tasks, profile, chat

### Messaging (6 stories)
- Chat list, search, send messages, quick actions

---

## SUPER ADMIN PORTAL (73 stories)

### Login (3 stories)
- Secure login, OTP, password reset

### Dashboard (2 stories)
- View facility/provider/patient counts

### Company Onboarding (5 stories)
- Add/view/search companies, brand color/logo

### Facility Management (6 stories)
- Add/view/edit facilities, location details, users

### Settings & Master Management (39 stories)
- Profile, users, roles & permissions
- CPT codes (CRUD + import/export)
- ICD-10 codes (CRUD + import/export)
- Service codes, specialties
- Support tickets management

### Form Builder (5 stories)
- Create, archive, duplicate forms, templates, submit

### Audit Log (3 stories)
- View, download, search/filter logs

### Document & Invoice Branding (3 stories)
- Logo and facility name on documents/invoices

### Notifications (4 stories)
- Notification settings per event per channel

### Service Configuration (3 stories)
- Configure single/dual/triple service types

---

## Implementation Priority Matrix

### Must Build First (Core Business)
1. Login (OTP, password setup) — 6 stories
2. Lead Management full flow — 52 stories
3. Resident Management + Face Sheet — 25 stories
4. Patient Charting (Vitals, Meds, Allergies, Notes) — 35 stories
5. Daily Attendance (ADH check-in/out) — 19 stories
6. Payment/Billing Configuration — 25 stories
7. Dashboard — 29 stories

### Must Build Second (Operations)
8. Discharge Process — 20 stories
9. Room Management — 8 stories
10. Document Management — 42 stories
11. Pre-Admission Assessment — 7 stories
12. Scheduling — 5 stories

### Portal Expansion
13. Family Portal — 106 stories
14. HRMS Portal — 136 stories
15. Super Admin Portal — 73 stories

### Nice to Have
16. AI & Automation — 19 stories
17. Analytics & Reports — 14 stories
18. Memory Care — 14 stories
19. Respite Care — 8 stories
20. Independent Living — 10 stories
