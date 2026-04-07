# Nemicare HomeCare - WEEKLY EXECUTION CHECKLIST

**Purpose**: Track weekly progress against phased plan  
**Usage**: Team lead updates every Friday  
**Duration**: Weeks 1-26  

---

## PHASE 1: MVP (WEEKS 1-10)

### WEEK 1 (Apr 9-13) - Design Review & Kickoff

**Objectives**: Align on architecture, get all developers productive

- [ ] **Architecture**
  - [ ] Database schema reviewed & approved (20+ tables, Prisma)
  - [ ] API endpoints documented (80+ for Phase 1)
  - [ ] Component architecture finalized
  - [ ] Authentication flow designed
  - [ ] HIPAA compliance checklist reviewed

- [ ] **Team**
  - [ ] All 5 developers onboarded
  - [ ] Git repos created (backend, frontend)
  - [ ] Development environment setup doc completed
  - [ ] Slack/Teams channel created
  - [ ] Sprint board (Jira/GitHub Projects) created
  - [ ] Code review process agreed

- [ ] **Infrastructure**
  - [ ] AWS/Heroku account provisioned
  - [ ] Database (PostgreSQL) created & accessible
  - [ ] Docker Compose structure created
  - [ ] GitHub Actions CI/CD skeleton set up

- [ ] **Deliverables**
  - [ ] Architecture decision document finalized
  - [ ] Tech stack confirmed (Node 18, React 18, PostgreSQL 14, etc.)
  - [ ] Kick-off meeting completed

**Success Criteria**:
- ✅ Architecture approved by all leads
- ✅ Team understands Phase 1 scope (250-300 stories)
- ✅ All developers can run `git clone` and see project structure

---

### WEEK 2 (Apr 16-20) - Setup & Scaffolding

**Objectives**: All developers have working dev environment

- [ ] **Backend Scaffold**
  - [ ] Express.js app initializes successfully
  - [ ] Prisma ORM configured
  - [ ] Database migrations run without error
  - [ ] Health check endpoint works (`GET /health`)
  - [ ] Middleware skeleton in place (auth, RBAC, error handling)
  - [ ] Winston/Pino logging configured
  - [ ] Environment variables (.env) template created
  - [ ] TypeScript configured

- [ ] **Frontend Scaffold**
  - [ ] React + Vite project initialized
  - [ ] Redux store configured
  - [ ] React Router set up
  - [ ] Material-UI imported & working
  - [ ] TypeScript configured
  - [ ] Page structure (layout, header, sidebar) created
  - [ ] API service layer scaffolded

- [ ] **Testing Infrastructure**
  - [ ] Jest configured (backend & frontend)
  - [ ] Playwright installed & working
  - [ ] Sample unit test passing
  - [ ] Sample E2E test passing
  - [ ] Code coverage reporting working

- [ ] **CI/CD & Deployment**
  - [ ] GitHub Actions workflow created (lint, test, build)
  - [ ] Docker images build successfully
  - [ ] Docker Compose services start (`docker-compose up`)
  - [ ] Deployment to dev environment working

- [ ] **Documentation**
  - [ ] README.md updated (dev setup instructions)
  - [ ] Architecture doc finalized
  - [ ] API contract template created
  - [ ] HIPAA compliance checklist created

**Success Criteria**:
- ✅ All 5 developers can `npm install && npm start` locally
- ✅ Database creates 20+ tables
- ✅ Backend health check at http://localhost:3001/health
- ✅ Frontend loads at http://localhost:3000
- ✅ CI/CD pipeline passes all checks
- ✅ Docker setup works for new devs

**Blockers?** None should exist - reach out immediately if setup fails

---

### WEEK 3 (Apr 23-27) - Authentication & RBAC

**Objectives**: User system working, RBAC enforced

- [ ] **Backend - Auth Service**
  - [ ] POST /auth/login endpoint (JWT token returned)
  - [ ] POST /auth/password/reset working
  - [ ] POST /auth/register working
  - [ ] JWT validation middleware working
  - [ ] bcrypt password hashing working
  - [ ] Session management (refresh tokens) designed

- [ ] **Backend - RBAC**
  - [ ] 8 roles created (Facility Admin, Care Staff, Family, etc.)
  - [ ] Role-permission mapping table created
  - [ ] POST /roles endpoint (create/update)
  - [ ] Middleware to check permissions working
  - [ ] Example: Care Staff can't access Billing API
  - [ ] Audit logging on all permission checks

- [ ] **Backend - Users**
  - [ ] POST /users (create user, assign role)
  - [ ] GET /users (list users in company)
  - [ ] PUT /users/:id (update user)
  - [ ] DELETE /users/:id (soft delete)
  - [ ] GET /users/me (current user profile)
  - [ ] All endpoints RBAC-protected

- [ ] **Backend - Audit Logging**
  - [ ] Audit table created & migrations run
  - [ ] Middleware logs all POST/PUT/DELETE actions
  - [ ] Logs include: user ID, action, resource, timestamp
  - [ ] Audit logs cannot be modified or deleted
  - [ ] Example: Creating a resident logged

- [ ] **Frontend - Login/Auth**
  - [ ] Login page UI (email, password form)
  - [ ] POST to /auth/login successful
  - [ ] JWT token stored in localStorage
  - [ ] Login token added to all API requests
  - [ ] Logout functionality working
  - [ ] Password reset flow UI & logic

- [ ] **Frontend - Dashboard**
  - [ ] Dashboard page loads
  - [ ] Sidebar navigation visible
  - [ ] Role-based menu items shown (e.g., Billing only for Facility Admin)
  - [ ] User profile dropdown working

- [ ] **Testing**
  - [ ] 50+ unit tests for auth (login, token, password reset)
  - [ ] 50+ unit tests for RBAC (permission checks)
  - [ ] 15+ E2E tests (login flow, permission denial, logout)
  - [ ] Security tests (SQL injection, XSS, CSRF)
  - [ ] Coverage: Auth 90%+, RBAC 90%+

- [ ] **Documentation**
  - [ ] API contracts for auth endpoints finalized
  - [ ] RBAC matrix documented (which role can do what)
  - [ ] Auth troubleshooting guide created

**Success Criteria**:
- ✅ User can login with email/password
- ✅ RBAC prevents unauthorized access
- ✅ All changes audit-logged
- ✅ 0 security vulnerabilities
- ✅ Code coverage 90%+
- ✅ All 15+ E2E tests passing

---

### WEEK 4 (Apr 30-May 4) - Facility Portal Foundation

**Objectives**: Facility/Company structure working, basic portal UI

- [ ] **Backend - Company & Facility**
  - [ ] POST /companies (create company - super admin only)
  - [ ] GET /companies/:id (get company details)
  - [ ] POST /facilities (create facility under company)
  - [ ] GET /facilities (list for company)
  - [ ] PUT /facilities/:id (update facility)
  - [ ] All endpoints RBAC-protected

- [ ] **Backend - User-Facility Assignment**
  - [ ] Users assigned to specific facilities
  - [ ] Care Staff can only see their assigned facility
  - [ ] Facility Admins see all users in their facility
  - [ ] Super Admins see all companies/facilities
  - [ ] Audit logs track assignments

- [ ] **Frontend - Facility Portal**
  - [ ] Facility portal UI (header, sidebar, main content area)
  - [ ] Sidebar shows current facility name
  - [ ] Navigation menu (Leads, Residents, Visits, Billing, Charting, etc.)
  - [ ] Current user name & role displayed
  - [ ] Responsive design (mobile-friendly)
  - [ ] Accessible (WCAG 2.1 AA)

- [ ] **Frontend - Multi-Facility Support**
  - [ ] User can switch facilities (dropdown)
  - [ ] UI updates when switching
  - [ ] Only assigned facilities shown

- [ ] **Testing**
  - [ ] 50+ unit tests (company, facility, RBAC)
  - [ ] 15+ E2E tests (facility access flows)
  - [ ] Accessibility tests

**Success Criteria**:
- ✅ Facility can be created & assigned users
- ✅ RBAC enforced at facility level
- ✅ Portal loads for different users
- ✅ Mobile/responsive working
- ✅ All tests passing

---

### WEEK 5-6 (May 7-18) - Lead Management (CRM)

**Objectives**: Lead CRUD complete, qualification scoring working

**WEEK 5: Core Lead Features**

- [ ] **Backend - Lead CRUD**
  - [ ] POST /leads (create lead)
  - [ ] GET /leads (list with pagination, filters)
  - [ ] GET /leads/:id (single lead detail)
  - [ ] PUT /leads/:id (update lead)
  - [ ] DELETE /leads/:id (soft delete)
  - [ ] All endpoints RBAC-protected

- [ ] **Backend - Lead Status & Assignment**
  - [ ] Lead statuses: NEW, QUALIFIED, INTERESTED, CONTACTED, CONVERTED
  - [ ] PUT /leads/:id (update status)
  - [ ] PUT /leads/:id/assign (assign to user)
  - [ ] Users can only view/edit assigned leads (+ facility admins)

- [ ] **Backend - Qualification Scoring**
  - [ ] Score algorithm implemented
  - [ ] POST /leads/:id/score (recalculate)
  - [ ] Score 0-100 based on age, income, condition, location
  - [ ] Automatic flagging: >70 = QUALIFIED, <30 = NOT_QUALIFIED
  - [ ] Audit logs score changes

- [ ] **Backend - Lead Source**
  - [ ] Lead sources: Website, Referral, Call, Walk-in, etc.
  - [ ] Track lead source in database
  - [ ] Reporting on lead sources (later)

- [ ] **Frontend - Lead List**
  - [ ] Lead list page (table view)
  - [ ] Columns: Name, Status, Score, Assigned To, Created Date
  - [ ] Filters: Status, Score Range, Assigned User
  - [ ] Pagination (50 leads per page)
  - [ ] Search by name/phone/email
  - [ ] Sort by any column

- [ ] **Frontend - Lead Creation**
  - [ ] Lead creation form (modal or page)
  - [ ] Fields: Name, DOB, Gender, Email, Phone, Address, Insurance
  - [ ] Form validation
  - [ ] Success message after creation
  - [ ] Auto-calculate score after creation

- [ ] **Frontend - Lead Detail**
  - [ ] Lead detail page (read-only initially)
  - [ ] Display all lead fields
  - [ ] Show score + qualification status
  - [ ] Show assigned user

- [ ] **Testing**
  - [ ] 100+ unit tests (CRUD, scoring, status)
  - [ ] 20+ E2E tests (lead workflows)
  - [ ] Edge cases (duplicate detection, invalid scores)
  - [ ] Coverage 90%+

**WEEK 6: Advanced Lead Features**

- [ ] **Backend - Lead Activities**
  - [ ] Activity types: Call, Email, Note, Meeting, SMS
  - [ ] POST /leads/:id/activity (log activity)
  - [ ] GET /leads/:id/activities (timeline)
  - [ ] Activity summary (last contact date, next follow-up)

- [ ] **Backend - Lead Follow-up**
  - [ ] Scheduled follow-up date tracking
  - [ ] PUT /leads/:id/follow-up (schedule)
  - [ ] GET /leads/follow-ups (list due for follow-up)
  - [ ] Notifications (stub for Phase 2)

- [ ] **Backend - Lead Conversion**
  - [ ] POST /leads/:id/convert (convert to resident)
  - [ ] Creates new resident record from lead
  - [ ] Updates lead status to CONVERTED
  - [ ] Audit logs conversion
  - [ ] Moves lead to historical (not in active list)

- [ ] **Backend - Import/Export**
  - [ ] POST /leads/import (CSV upload)
  - [ ] Parse CSV and create leads in bulk
  - [ ] Validation (required fields, duplicate check)
  - [ ] Import report (success count, error list)
  - [ ] POST /leads/export (download all leads as CSV)
  - [ ] Export includes all fields + score

- [ ] **Frontend - Lead Activities**
  - [ ] Activity timeline on lead detail page
  - [ ] Add activity form
  - [ ] Show activity history chronologically

- [ ] **Frontend - Lead Import/Export**
  - [ ] Import page: Upload CSV file
  - [ ] Progress bar, import report
  - [ ] Export button: Downloads CSV with all leads

- [ ] **Backend - Rate Card (Basic)**
  - [ ] Rate card for facility (room type → price)
  - [ ] GET /facilities/:id/rate-card
  - [ ] PUT /facilities/:id/rate-card (update)
  - [ ] Sample rates for Medicaid/Private Pay

- [ ] **Frontend - Rate Card UI**
  - [ ] Display facility rate card
  - [ ] Edit rates (for facility admin)

- [ ] **Testing**
  - [ ] 50+ more unit tests (activities, conversion, import/export)
  - [ ] 20+ E2E tests (full lead workflows)
  - [ ] Import accuracy test (100 leads imported correctly)
  - [ ] Export validation (CSV format correct)

**Success Criteria**:
- ✅ Lead can be created, scored, assigned, converted
- ✅ Qualification score accurate
- ✅ All 80+ lead-related test scenarios passing
- ✅ Import/export working
- ✅ Performance: List loads 1000+ leads <2s
- ✅ <50ms per API request (p95)
- ✅ Code coverage 90%+

---

### WEEK 7-8 (May 21-Jun 1) - Resident Management

**Objectives**: Resident CRUD, admission, lifecycle complete

**WEEK 7: Core Resident Features**

- [ ] **Backend - Resident CRUD**
  - [ ] POST /residents (create resident)
  - [ ] GET /residents (list with filters, pagination)
  - [ ] GET /residents/:id (single resident)
  - [ ] PUT /residents/:id (update)
  - [ ] DELETE /residents/:id (soft delete)
  - [ ] All RBAC-protected

- [ ] **Backend - Resident Demographics**
  - [ ] Full name, DOB, SSN, Gender
  - [ ] Contact info (email, phone, address)
  - [ ] Emergency contacts (name, phone, relationship)
  - [ ] Insurance info (Medicaid #, policy #, etc.)

- [ ] **Backend - Resident Status**
  - [ ] Statuses: Application, Admitted, Active, On Hold, Discharged
  - [ ] Track status changes & timestamps
  - [ ] Audit log status changes

- [ ] **Backend - Duplicate Detection**
  - [ ] Check for existing residents:
    - [ ] Same first name + last name + DOB
    - [ ] Same SSN
    - [ ] Same phone + name
  - [ ] POST /residents/duplicate-check
  - [ ] Return list of similar residents
  - [ ] Prevent creation if exact match & user confirms

- [ ] **Backend - Medical History**
  - [ ] Allergies (list, severity)
  - [ ] Medical conditions (list, active/inactive)
  - [ ] Medications (current list)
  - [ ] Equipment/supplies in use
  - [ ] GET /residents/:id/medical-history
  - [ ] PUT /residents/:id/medical-history

- [ ] **Frontend - Resident List**
  - [ ] Resident list page (table)
  - [ ] Columns: Name, DOB, Status, Admission Date, Room
  - [ ] Filters: Status, Facility, Assigned Care Staff
  - [ ] Search by name/SSN
  - [ ] Pagination (100 per page)

- [ ] **Frontend - Resident Creation**
  - [ ] Multi-step form (demographics → medical → emergency contacts)
  - [ ] Duplicate detection warning
  - [ ] Terms of admission (checkbox)
  - [ ] Submit creates resident

- [ ] **Frontend - Resident Detail**
  - [ ] Tabbed interface: Demographics, Medical, Contacts, Insurance
  - [ ] Edit capability (for facility admin)
  - [ ] Show key info prominently
  - [ ] Change status button (Admit/On Hold/Discharge)

- [ ] **Testing**
  - [ ] 100+ unit tests (CRUD, duplicate detection, validation)
  - [ ] 20+ E2E tests (resident workflows)
  - [ ] Duplicate detection accuracy test

**WEEK 8: Advanced Resident Features**

- [ ] **Backend - Admission Workflow**
  - [ ] POST /residents/:id/admit (change to ADMITTED)
  - [ ] Update: admission date, room assignment, care plan
  - [ ] Generate initial assessment
  - [ ] Trigger (ready for Phase 2): Insurance verification

- [ ] **Backend - Resident Documents**
  - [ ] Document types: Admission, Insurance, Medical Records, etc.
  - [ ] Store document references/links
  - [ ] Document upload/download (Phase 2)

- [ ] **Backend - Resident Import/Export**
  - [ ] POST /residents/import (CSV bulk import)
  - [ ] POST /residents/export (download all residents)
  - [ ] Validate required fields, check duplicates
  - [ ] Import report

- [ ] **Frontend - Admission Flow**
  - [ ] Admit resident modal/page
  - [ ] Select room
  - [ ] Confirm insurance info
  - [ ] Set initial care plan
  - [ ] Generate documents

- [ ] **Frontend - Import/Export**
  - [ ] Import CSV page
  - [ ] Export all residents as CSV

- [ ] **Backend - Room Management**
  - [ ] Room table (facility_id, room_number, resident_id)
  - [ ] GET /facilities/:id/rooms
  - [ ] Room capacity tracking
  - [ ] Resident-to-room assignments

- [ ] **Frontend - Room Assignment**
  - [ ] Show available rooms when admitting
  - [ ] Room occupancy dashboard (summary of full/empty)

- [ ] **Testing**
  - [ ] 60+ more unit tests (admission, import/export)
  - [ ] 20+ E2E tests (full resident workflows)
  - [ ] Import accuracy (500 residents imported)

**Success Criteria**:
- ✅ Resident can be created, admitted, updated
- ✅ Duplicate detection works 99%+
- ✅ Medical history tracked
- ✅ Import/export working
- ✅ Performance: List 5000+ residents <2s
- ✅ All acceptance criteria passing
- ✅ Code coverage 90%+

---

### WEEK 9 (Jun 4-8) - Billing (SIMPLE) & Charting

**Objectives**: Billing started, charting foundation

**WEEK 9A: Simple Billing**

- [ ] **Backend - Rate Card**
  - [ ] Rate card CRUD (create, update, view)
  - [ ] Fields: Facility, Room Type, Service Type, Rate/Day
  - [ ] Support Private Pay + Medicaid (simple, not split)
  - [ ] Audit log changes

- [ ] **Backend - Visit/Service Tracking**
  - [ ] Visit records: Date, Type, Duration, Resident
  - [ ] Service units: Count visits per month
  - [ ] GET /residents/:id/services (current month)

- [ ] **Backend - Billing Generation**
  - [ ] POST /billing (create bill for resident)
  - [ ] Auto-calculate: Units × Rate
  - [ ] Bill statuses: DRAFT, SENT, PAID
  - [ ] Bill date range (e.g., June 1-30)
  - [ ] GET /billing (list bills for facility)

- [ ] **Backend - Invoice Generation**
  - [ ] Convert bill to invoice (PDF)
  - [ ] Invoice includes: Resident info, dates, rate, total, payment instructions
  - [ ] GET /billing/:id/invoice (download PDF)

- [ ] **Backend - Payment Recording**
  - [ ] POST /billing/:id/payment (record payment)
  - [ ] Fields: Date, Amount, Method (check, ACH, CC)
  - [ ] Update bill status to PAID
  - [ ] Validate: payment doesn't exceed bill amount

- [ ] **Frontend - Billing Page**
  - [ ] List of bills (Resident, Amount, Status, Due Date)
  - [ ] Filters: Status, Date Range, Resident
  - [ ] Create bill button
  - [ ] Send invoice (generates & marks SENT)
  - [ ] View/download invoice

- [ ] **Frontend - Payment Recording**
  - [ ] Record payment form (on bill detail)
  - [ ] Fields: Date, Amount, Method
  - [ ] Update bill status display

- [ ] **Testing**
  - [ ] 80+ unit tests (billing calculation, payment)
  - [ ] 15+ E2E tests (billing workflows)
  - [ ] Calculation accuracy: 100%

**WEEK 9B: Charting Foundation**

- [ ] **Backend - Charting CRUD**
  - [ ] POST /charting (create chart entry)
  - [ ] Chart types: Vitals, Progress Note, Incident, Care Plan
  - [ ] GET /charting (list by resident, paginated)
  - [ ] GET /charting/:id (view single chart)
  - [ ] PUT /charting/:id (update draft - not signed)
  - [ ] All RBAC-protected

- [ ] **Backend - Vitals Recording**
  - [ ] Vital types: BP (systolic/diastolic), HR, Temp, Weight, O2 Sat
  - [ ] POST /residents/:id/vitals (record vitals)
  - [ ] Timestamp each entry
  - [ ] Normal ranges for validation

- [ ] **Backend - Progress Notes**
  - [ ] POST /charting (chart_type = PROGRESS_NOTE)
  - [ ] Rich text content (plain text for MVP)
  - [ ] Facility staff can create & edit

- [ ] **Backend - Medication List**
  - [ ] GET /residents/:id/medications
  - [ ] PUT /residents/:id/medications (update)
  - [ ] Track active medications
  - [ ] Audit changes

- [ ] **Backend - HIPAA Access Control**
  - [ ] Only assigned care staff can view resident charts
  - [ ] Facility admin can view all charts in facility
  - [ ] Log all chart access (who viewed, when)
  - [ ] Cannot copy/export chart data (MVP)

- [ ] **Backend - Chart Encryption**
  - [ ] Chart content encrypted at rest (AES-256)
  - [ ] Decrypt on successful auth
  - [ ] Keys managed securely (Phase 2 depth)

- [ ] **Frontend - Vitals Entry**
  - [ ] Quick entry form for vitals
  - [ ] Show previous vitals (trend)
  - [ ] Normal ranges indicated (UI hint: green/yellow/red)

- [ ] **Frontend - Progress Notes**
  - [ ] Simple text editor (rich text optional)
  - [ ] Create new note button
  - [ ] Notes list (reverse chronological)

- [ ] **Frontend - Medication List**
  - [ ] Display current medications
  - [ ] Add/remove medications (for facility admin)

- [ ] **Frontend - Chart Audit**
  - [ ] View audit log of who accessed chart (HIPAA)
  - [ ] Timestamps of all accesses

- [ ] **Testing**
  - [ ] 80+ unit tests (charting, vitals, HIPAA access)
  - [ ] 15+ E2E tests (charting workflows)
  - [ ] Security: Cannot access other resident's charts
  - [ ] Access logging verified

**Success Criteria**:
- ✅ Billing calculated correctly
- ✅ Invoice PDF generates
- ✅ Payment recorded in system
- ✅ Charting data encrypted
- ✅ HIPAA access control enforced
- ✅ All changes audit-logged
- ✅ Code coverage 90%+

---

### WEEK 10 (Jun 11-15) - Integration Testing, UAT, Launch

**Objectives**: All Phase 1 features integrated, tested, approved for launch

- [ ] **Integration Testing**
  - [ ] Leads → Residents conversion flow (end-to-end)
  - [ ] Residents → Billing flow (end-to-end)
  - [ ] Charting tied to residents (correct access)
  - [ ] RBAC across all modules (users can/can't access correctly)
  - [ ] Audit logging across all operations

- [ ] **Performance Testing**
  - [ ] Load test: 1000 concurrent users
  - [ ] API response time <50ms (p95)
  - [ ] Page load time <2s (FCP, Lighthouse)
  - [ ] Database query optimization (no N+1 queries)
  - [ ] Memory leaks check

- [ ] **Security Audit** (HIPAA Compliance)
  - [ ] Authentication: Password storage (bcrypt), JWT (secure), MFA ready
  - [ ] Authorization: RBAC enforced on all APIs
  - [ ] Data Encryption: Data at rest (AES-256), in transit (HTTPS)
  - [ ] Audit Logging: All changes logged, immutable
  - [ ] Patient Data: Not exported, not copied, encrypted
  - [ ] Checklist: HIPAA Security Rule (Administrative, Physical, Technical)
  - [ ] Checklist: OWASP Top 10 (SQL injection, XSS, CSRF, etc.)
  - [ ] Third-party penetration test (optional, Phase 2)

- [ ] **Acceptance Testing (UAT)**
  - [ ] Recruit 2-3 pilot users (facility staff)
  - [ ] Provide UAT environment
  - [ ] Conduct training session
  - [ ] User executes 50+ acceptance criteria
  - [ ] Document findings (bugs, usability issues)
  - [ ] Fix critical/high issues
  - [ ] Get sign-off: "System is ready to use"

- [ ] **Documentation**
  - [ ] API documentation finalized (OpenAPI)
  - [ ] User guide (how to use Facility Portal)
  - [ ] Troubleshooting guide
  - [ ] Operations guide (how to deploy, monitor, back up)
  - [ ] Security & compliance documentation

- [ ] **Deployment Readiness**
  - [ ] Database backup & recovery tested
  - [ ] Monitoring & alerting configured (Sentry/DataDog)
  - [ ] Logging aggregation working
  - [ ] Health check endpoints live
  - [ ] Rollback procedure documented & tested
  - [ ] Support runbook created (incident response)

- [ ] **Go-Live Requirement: All Green**
  - [ ] 0 critical bugs
  - [ ] 0-3 high bugs (documented, low impact)
  - [ ] 95%+ acceptance criteria passing
  - [ ] Performance targets met
  - [ ] Security audit passing
  - [ ] UAT sign-off obtained
  - [ ] Team trained & confident
  - [ ] Monitoring live

**Launch Week Activities**:
- Monday: Final code review, merge all PRs
- Tuesday: Full integration test, fix any issues
- Wednesday: Security audit, compliance check
- Thursday: UAT with pilot users
- Friday: Go-live decision, monitor system 24/7

**After Launch**:
- [ ] Monitor system metrics (uptime, errors, performance)
- [ ] Capture user feedback
- [ ] Fix bugs discovered in production (real users)
- [ ] Plan Phase 2 (starts next Monday or after stabilization week)

**Success Criteria**:
- ✅ 0 critical bugs in production
- ✅ 99%+ uptime (or <1 hour downtime)
- ✅ Users successfully logging in & using features
- ✅ No data loss or corruption
- ✅ HIPAA/security requirements holding
- ✅ System scalable (ready for 100+ facilities)

---

## PHASE 2: REVENUE FEATURES (WEEKS 11-16)

### WEEK 11-12: Multi-Payer Billing Architecture

- [ ] **Design Phase 2 billing (Medicaid + Private Pay split)**
  - [ ] Medicaid vs Private Pay determination logic
  - [ ] Smart billing split (50/50, 60/40, custom)
  - [ ] A La Carte vs bundled rates
  - [ ] Insurance coordination (primary/secondary)
  - [ ] Refund workflow (3-level approval)
  - [ ] Medicaid claims format (PA-specific)

- [ ] **Medicaid Integration Planning**
  - [ ] PA submission APIs documented
  - [ ] PA tracking database schema
  - [ ] Error handling (submission failures)
  - [ ] State-specific rules (PA Medicaid quirks)

- [ ] **Development Team Expanded**
  - [ ] Add healthcare consultant (Medicaid expert)
  - [ ] Backend team focuses on complex billing
  - [ ] Frontend team focuses on ALF operations

**Key Success Metrics**:
- ✅ Design approved by stakeholders
- ✅ Team understands multi-payer complexity
- ✅ Medicaid consultant on board
- ✅ Sprint planning complete

---

### WEEK 13-14: Medicaid Integration & ALF Operations

- [ ] **Medicaid Integration Completion**
  - [ ] PA submission API implemented
  - [ ] PA tracking in database
  - [ ] Claim submission format (working with state)
  - [ ] Response handling (approved/denied/pending)

- [ ] **ALF Operations**
  - [ ] Bed management (available, occupied, blocked)
  - [ ] Waitlist management
  - [ ] Room reassignment
  - [ ] Census reporting

- [ ] **Testing**
  - [ ] All Medicaid scenarios tested
  - [ ] ALF operations tested
  - [ ] Integration with billing verified

**Success Criteria**:
- ✅ Medicaid PAs submitted & tracked
- ✅ ALF operations functional
- ✅ All tests passing

---

### WEEK 15-16: Full Discharge & Family Portal

- [ ] **Discharge Process** (All 14 steps)
  - [ ] Initiate discharge
  - [ ] Calculate refunds
  - [ ] Deduct deposits
  - [ ] Final billing
  - [ ] Refund approval (3-level)
  - [ ] Record archival
  - [ ] Document generation

- [ ] **Family Portal MVP**
  - [ ] Dashboard (resident status, alerts)
  - [ ] View clinical data (if permitted)
  - [ ] Messaging to facility staff

- [ ] **Testing & Launch Phase 2**
  - [ ] Full integration testing
  - [ ] Performance testing
  - [ ] UAT with multi-payer scenarios
  - [ ] Security audit
  - [ ] Go-live decision

**Success Criteria**:
- ✅ Discharge process complete
- ✅ Family portal working
- ✅ All 150-200 Phase 2 stories delivered
- ✅ System stable for 100+ facilities

---

## PHASE 3: ADVANCED FEATURES (WEEKS 17-26)

### WEEK 17-20: HRMS (Human Resources Management System)

- [ ] **Employee Management**
  - [ ] Employee profiles
  - [ ] Licensing & credentials
  - [ ] Background check status

- [ ] **Shift Scheduling**
  - [ ] Create shift templates
  - [ ] Assign staff to shifts
  - [ ] Conflict detection

- [ ] **Timesheet Management**
  - [ ] Staff clock in/out
  - [ ] Timesheet approval
  - [ ] Overtime tracking

- [ ] **Testing & Deployment**
  - [ ] HRMS fully tested
  - [ ] Integration with payroll prepared

**Success Criteria**:
- ✅ HRMS MVP functional
- ✅ Scheduling working
- ✅ Timesheets trackable

---

### WEEK 21-24: Advanced Reporting & Super Admin Portal

- [ ] **Reporting Suite**
  - [ ] Census reports
  - [ ] Financial reports (by payer type)
  - [ ] Compliance reports
  - [ ] Lead conversion funnel

- [ ] **Super Admin Portal**
  - [ ] Company management
  - [ ] Facility setup
  - [ ] Master data configuration
  - [ ] Audit log access

- [ ] **Integrations**
  - [ ] Verida (transportation)
  - [ ] RingCentral (calls/SMS)
  - [ ] Optional: Telehealth

**Success Criteria**:
- ✅ All reports working
- ✅ Super Admin portal live
- ✅ Key integrations active

---

### WEEK 25-26: Final Stabilization & Scale

- [ ] **Performance Optimization**
  - [ ] Database pagination perfected
  - [ ] Caching strategy implemented
  - [ ] Frontend code splitting
  - [ ] API response optimization

- [ ] **Final Testing**
  - [ ] Regression testing (all 650+ stories)
  - [ ] Load testing (10,000+ concurrent users)
  - [ ] Compliance audit (HIPAA 100%)

- [ ] **Documentation & Launch**
  - [ ] Final documentation
  - [ ] Training materials
  - [ ] Operations runbooks
  - [ ] Support playbooks

**Success Criteria**:
- ✅ All 650+ stories delivered
- ✅ Platform ready for enterprise scale
- ✅ HIPAA fully compliant
- ✅ Performance targets sustained
- ✅ Full team trained
- ✅ Documentation complete

---

## ✅ SUMMARY

This checklist ensures:
- **Week-by-week accountability** (what gets done each week)
- **Clear deliverables** (PR reviews, tests, documentation)
- **Success criteria** (how we know it's done)
- **No surprises** (blockers identified early)

Use this to track sprint retrospectives every Friday. Update status, capture blockers, plan next week.

**For Scrum Masters**: Convert each week into 2-week sprints if preferred. Adjust for team pace.

---

**Status**: READY TO TRACK  
**Last Updated**: April 4, 2026
