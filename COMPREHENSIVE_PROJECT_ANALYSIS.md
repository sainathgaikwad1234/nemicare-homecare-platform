# Nemicare HomeCare Platform - COMPREHENSIVE PROJECT ANALYSIS
**Created**: April 4, 2026  
**Status**: COMPLETE PROJECT DOCUMENTATION  
**Scope**: Full blueprint for development planning

---

# TABLE OF CONTENTS
1. [Executive Summary](#executive-summary)
2. [User Stories by Portal](#user-stories-by-portal)
3. [Acceptance Criteria & Test Scenarios](#acceptance-criteria--test-scenarios)
4. [Data Models & Entities](#data-models--entities)
5. [Business Rules & Workflows](#business-rules--workflows)
6. [Integration Points](#integration-points)
7. [Key Meeting Notes](#key-meeting-notes)
8. [UI Wireframes & Components](#ui-wireframes--components)

---

## EXECUTIVE SUMMARY

**Project**: Nemicare HomeCare Management Platform  
**Client**: Sam Shah (Provider/Founder)  
**Scope**: Multi-portal SPA for home care and assisted living facility management  
**Status**: Post-discovery, pre-development  
**Discovery Effort**: 22 meetings, 200+ user stories, 40+ wireframes

### Core Value Proposition
Nemicare is a comprehensive healthcare platform for home care and assisted living facilities (ALF/ADH/Home Care) enabling:
- Lead management from inquiry to resident onboarding
- Multi-level resident lifecycle management (Lead → New Arrival → Active → Discharge)
- Medicaid and private-pay billing coordination
- State compliance and authorization tracking
- Family portal for resident engagement
- HRMS for workforce management
- Clinical charting and incident tracking

### Key Market Differentiation
- **Multi-service model**: ADH (Adult Day Health), ALF (Assisted Living Facility), Home Care, Memory Care, Independent Living
- **State-specific workflows**: PA (Prior Authorization) tracking, Medicaid case management integration, Verida transport requests
- **Lead scoring**: Automatic Medicaid qualification probability scoring
- **Family engagement**: Real-time attendance, activities, and health updates to family members
- **Healthcare compliance**: HIPAA, state audit logging, documentation workflows

---

# USER STORIES BY PORTAL

## 1. FACILITY PORTAL (Provider/Staff Portal)

### 1.1 AUTHENTICATION & ACCOUNT MANAGEMENT
Total Stories: 7

| Story ID | Category | Capability | Description | Priority | Status |
|----------|----------|------------|-------------|----------|--------|
| FA-1 | Login | Welcome Email | Welcome email with Set Password link on profile creation | Should Have | New |
| FA-2 | Login | Password Setup | First-time password setup after invitation link | Should Have | New |
| FA-3 | Login | OTP Verification | 6-digit OTP via email after credential entry | Should Have | New |
| FA-4 | Login | Resend OTP | Ability to resend OTP if not received or expired | Should Have | New |
| FA-5 | Login | Secure Login | Login with valid email and password credentials | Should Have | New |
| FA-6 | Login | Password Reset | Forgot password functionality with email reset link | Should Have | New |
| FA-7 | Login | Session Management | Secure session handling with automatic timeout | Should Have | New |

**Acceptance Criteria Summary**:
- Welcome email delivered within 5 minutes of profile creation
- Set Password link valid for 24 hours, single-use, cryptographically secure
- OTP: 6-digit code, sent to registered email, valid for 5 minutes
- OTP auto-focus: cursor advances to next box on digit entry
- Max 5 resend attempts per session with 30-second cooldown
- Account locked after 5 failed login attempts
- All credentials transmitted over HTTPS
- Generic error messages (never reveal if email/password is wrong)

---

### 1.2 LEAD MANAGEMENT (CRM)

Total Stories: 27

#### Lead Intake & Management
| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| LM-1 | Lead Intake | Capture lead source (web, referral, advertisement, etc.) | Must Have |
| LM-2 | Assign Service Type | Assign service type (ADH, ALF, Home Care, MC, IL) to lead | Should Have |
| LM-3 | Lead Assignment | Assign leads to sales team members | Must Have |
| LM-4 | Lead List | View list of all leads with filtering | New |
| LM-5 | Add Lead | Add new lead with full details | New |
| LM-6 | Edit Lead | Edit existing lead details | New |
| LM-7 | Import/Export Leads | Bulk import and export lead lists (CSV) | New |
| LM-8 | Lead Activity | View activity overview (timeline of all interactions) | New |
| LM-9 | Reject Lead | Reject lead with documented reason | New |

#### Lead Qualification & Scoring
| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| LM-10 | Lead Qualification | Track lead qualification status and win/loss reasons | Must Have |
| LM-11 | Qualification Scoring (ADH) | Automatic Medicaid qualification probability score | New |
| LM-12 | Conversion Analysis | Analyze historical conversion data and trends | Should Have |

#### Communication & Engagement
| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| LM-13 | Call Lead | Select call type, add pre-call/in-call notes, initiate call | New |
| LM-14 | AI Call Summary | Auto-generated AI summary for each call | New |
| LM-15 | SMS Lead | Send SMS to lead | New |
| LM-16 | AI SMS Summary | Auto-generated AI SMS summary | New |
| LM-17 | Private Notes | Add provider-only notes to lead | New |
| LM-18 | Public Notes | Add shared notes visible to lead/family | New |

#### Visit Management
| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| LM-19 | Schedule Facility Tour | Schedule tour/consultation visit with lead | New |
| LM-20 | View Calendar Visits | View scheduled visits in Day/Week/Month views | New |
| LM-21 | View List Visits | View scheduled visits in list view with sorting | New |
| LM-22 | Edit Scheduled Visit | Edit visit details from calendar or list view | New |
| LM-23 | Filter Scheduled Visits | Apply filters to visit list (date, type, status) | New |
| LM-24 | Visit Notes | Add notes for scheduled visits | New |

#### Pricing & Rate Cards
| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| LM-25 | Rate Card (Private Pay) | View and send private pay rate cards to lead | New |
| LM-26 | Rate Card (Medicaid) | View and send state-mandated Medicaid rates | New |
| LM-27 | Discounts | Apply facility discounts to rate cards | New |

**Data Captured per Lead**:
- Lead ID, Source, Status (Prospect/Qualified/Rejected/Converted)
- Name, DOB, Contact (Phone, Email, Address)
- Service type preference (ADH/ALF/Home Care/MC/IL)
- Medicaid eligibility indication
- Insurance information (if available)
- Lead qualification score (Medicaid probability %)
- Assigned sales rep
- Activity history (calls, SMS, visits, notes)
- Follow-up dates and next steps

---

### 1.3 RESIDENT REGISTRATION & MANAGEMENT

#### Resident Registration
| Story ID | Capability | Description | Priority | Status |
|----------|------------|-------------|----------|--------|
| RM-1 | Add Patient | Add new resident with full demographics | Must Have | Removed |
| RM-2 | Duplicate Detection | Detect duplicates by name/DOB/ID to prevent re-enrollment | Must Have | Retained |
| RM-3 | Resident View | View residents in table/list format (All/Active/In-Progress/New Arrival/Discharged tabs) | Must Have | Modified |
| RM-4 | Filter Residents | Search and filter resident list | Must Have | Modified |
| RM-5 | Import/Export Residents | Bulk import/export resident lists (CSV/Excel) | New | New |
| RM-6 | View Demographics | View resident basic details in header bar (name, DOB, age, gender, room) | New | New |
| RM-7 | Manage Details | Update resident profiles, payers, contacts, preferences | Must Have | Retained |

#### Resident Header & Dashboard
| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| RM-8 | Resident Demographics | Display photo, name, DOB, age, gender, room number, facility | New |
| RM-9 | Service Days | View and edit frequency schedule (Mon-Fri, etc.) | New |
| RM-10 | Transportation Overview | Display Verida provider, authorization expiration, usage progress | New |
| RM-11 | Attendance Tracking | Monthly attendance card with count and progress bar | New |

**Resident Profile Data Structure**:
```
DEMOGRAPHICS:
  - ID (unique), Name (first/last), DOB, Age (calculated), Gender
  - Address, Phone, Email, Photo
  - Emergency Contact (name, relationship, phone)
  - Social Security Number, Medicare ID, Medicaid ID
  
ENROLLMENT:
  - Program Type (ADH/ALF/Home Care/MC/IL)
  - Program Level (e.g., ADHS Level II)
  - Status: Lead → New Arrival → Active → On Hold → Discharged
  - Enrollment Date, Discharge Date (if applicable)
  - Reason for discharge (completed care, moved, deceased, etc.)

INSURANCE:
  - Insurance type (Private Pay, Medicaid, Insurance, Mixed)
  - Insurance details & policy numbers
  - Medicaid state, waiver program
  - Case manager name & contact
  
MEDICAL:
  - ICD-10 diagnoses
  - CPT service codes
  - Allergies (type, reaction)
  - Medications (current list)
  - Special care instructions

FACILITY-SPECIFIC:
  - Room/bed assignment (for ALF)
  - Frequency (days per week for ADH/Home Care)
  - Care plan documents
  - Transportation standing orders
```

---

### 1.4 RESIDENT LIFECYCLE WORKFLOWS

#### Lead to New Arrival Conversion Path

**Step 1: Lead Created**
- Lead source documented
- Initial contact information captured  
- Service type preference noted
- Medicaid probability scored (automatic)

**Step 2: Qualification & Documentation**
- Lead qualification status updated
- Required documents sent to lead/family
- Insurance information confirmed
- Medicaid case manager (if applicable) assigned

**Step 3: Medicaid-Specific (if applicable)**
- Case Management Agency selected
- Case Manager assigned
- Prior Authorization (PA) package prepared with:
  - CPT/ICD-10 codes
  - Service frequencies (visits per month)
  - NPI numbers validated
- Verida state transport request sent (with case manager details)
- PA status tracked (Submitted/Under Review/Approved/Denied)
- If rejected: resubmit with updates

**Step 4: Pre-Admission Setup**
- Billing & clearance details added
- Room/bed selected (for ALF)
- Deposit collected (if required)
- All required signatures obtained

**Step 5: Convert Lead to New Arrival**
- All documentation steps completed
- PA package received (if Medicaid)
- Status changed to "New Arrival"
- Arrival date confirmed

**Step 6: First Day - New Arrival to Active**
- Resident checks in
- Service day setup completed (frequency schedule, activities, etc.)
- Status changed to "Active"
- Clinical baseline documented

#### Active Resident Management
- Check-in/check-out tracking
- Daily attendance and activities recording
- Vitals monitoring
- Incident reporting
- Visit scheduling (appointments, family meetings)
- Billing & authorization tracking
- Standing order renewal reminders (60 days before expiration)

#### Discharge Workflow
- Discharge date set and communicated
- Reason documented (completed care, relocation, etc.)
- Final billing completed
- Discharge summary prepared
- Benefits terminated (portal access, standing orders, etc.)
- Status changed to "Discharged"

---

### 1.5 ADULT DAY HEALTH (ADH) - DAILY OPERATIONS

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| ADH-1 | Check-in/Check-out | Log participant arrival and departure with automatic timestamps | Must Have |
| ADH-2 | Log Daily Vitals | Record vitals for day program participants | Must Have |
| ADH-3 | Send Family Reports | Send daily summary of participation to families | Must Have |
| ADH-4 | Program Rosters | View daily rosters by program type and transportation route | Must Have |
| ADH-5 | Flexible Attendance | Record full-day, half-day, or partial attendance with time tracking | Must Have |
| ADH-6 | Absence Tracking | Mark absent with reason (hospitalization, vacation, illness, no-show, emergency) | Must Have |
| ADH-7 | EDWP Form | Complete Member Information Form with absence details | New |
| ADH-8 | Email EDWP | Send completed EDWP form to state case manager | New |
| ADH-9 | Attendance Roster | View daily attendance roster with attendance type for all residents | New |
| ADH-10 | Track EDWP Status | Track electronic sign-off status from state case manager | New |
| ADH-11 | Activity Recording | Add resident participation in: therapy, personal care, meals, social activities | New |
| ADH-12 | Copy Activities | Copy activities from master template to all present residents | New |
| ADH-13 | Activity Summary | View daily activity summary for each resident | New |
| ADH-14 | Monthly Attendance Report | Generate and export monthly attendance report | New |

**Daily Attendance Data**:
- Resident ID, Name, Program, Assigned Route
- Scheduled attendance vs actual attendance
- Check-in time, Check-out time, Duration
- Attendance type (Full Day, Half Day, Partial, Absent)
- Absence reason (coded)
- Activities participated (with timestamps)
- Vitals recorded

**State Compliance**:
- EDWP form completion and submission to state case manager
- Attendance tracking for billing/authorization validation
- Activity documentation for quality assurance audit

---

### 1.6 ASSISTED LIVING FACILITY (ALF) - ROOM & BED MANAGEMENT

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| ALF-1 | View/Assign Rooms | View all rooms and assign residents to available ones | Must Have |
| ALF-2 | Bed Availability Check | Check real-time bed availability (private/semi-private) vs state license | New |
| ALF-3 | View Bed Census | View occupied beds, available beds, beds on hold | New |
| ALF-4 | Room Assignment | Filter by floor, select room type, assign to resident | Modified |
| ALF-5 | Waitlist Management | Move qualified residents to waitlist when no beds available | New |
| ALF-6 | View Waitlist | View waitlist with resident priority, date added, contact info | New |
| ALF-7 | Waitlist Notification | Notify waitlisted resident when bed becomes available | New |
| ALF-8 | Track Waitlist Duration | Track how long leads have been on waitlist | New |
| ALF-9 | Room Hold Management | Update room status to "on hold" and release when needed | New |

**Room Management Data**:
- Room ID, Floor, Type (Private/Semi-Private), Capacity
- Current occupant (Resident ID, Name, Room status)
- Availability status (Occupied/Available/On Hold/Reserved)
- Check-in date, Expected discharge date
- Assigned caregiver(s)
- Special equipment/accommodations

**Bed Census Tracking**:
- Total licensed beds
- Occupied beds (by room type)
- Available beds (by room type)
- Beds on hold (by duration)
- Waitlist length
- Utilization rate %

---

### 1.7 BILLING & PAYMENT MANAGEMENT

#### Payment Path Configuration
| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| BIL-1 | Payment Type Selection | Select payment model: Medicaid/Private Pay/Insurance/Mixed | New |
| BIL-2 | Medicaid Path | Add PA number, frequency, dates, authorization details | New |
| BIL-3 | Edit Medicaid | Edit Medicaid billing details (PA, frequency, etc.) | New |
| BIL-4 | Private Pay (Single) | Add single payer with payment details | New |
| BIL-5 | Private Pay (Multiple) | Add multiple payers for billing split | New |
| BIL-6 | Edit Payer | Edit individual payer information | New |
| BIL-7 | Payment Method | Select card, cash, money order, or check | New |
| BIL-8 | Add Card Details | Capture card information (PCI-compliant) | New |
| BIL-9 | Edit Card Details | Update card information | New |
| BIL-10 | Configure Split | Equal split or custom split between multiple payers | New |
| BIL-11 | Generate Split Invoices | Generate separate invoices for each payer per split | New |
| BIL-12 | Insurance Path | Add insurance information (carrier, policy, group) | New |
| BIL-13 | Edit Insurance | Update insurance details | New |
| BIL-14 | Insurance+Medicaid | Add billing for combined Insurance+Medicaid | New |
| BIL-15 | Insurance+Copay | Add copay configuration with Insurance | New |
| BIL-16 | Medicaid+Copay | Add copay configuration with Medicaid | New |

#### Billing Models

**Model 1: Private Pay**
- Single or multiple responsible parties
- Payment method: Card, Cash, Money Order, Check
- Invoice based on service usage or flat rates
- Payment split: Equal or custom percentage split

**Model 2: Medicaid**
- State-mandated rate (from Prior Authorization)
- Frequency: Units per month (varies by state/service)
- Unit definition varies: 15-min intervals for some, monthly units for case management
- Example: 8400 units @ 15 min each = 2100 hours per year
- Authorization valid 1 year (typically)
- Billing per service: Home Care, Case Management, ADH attendance, ALF services
- State case manager tracking

**Model 3: Mixed (Insurance Primary, Medicaid Secondary)**
- Insurance covers primary portion
- Medicaid covers difference (if any)
- Bill insurance first, then Medicaid
- Combined copay/deductible management

**Model 4: A La Carte vs Blended Rate**
- **A La Carte**: Track individual services (Room, Board, Laundry, Transport) separately
- **Blended Rate**: Single bundle price, no service item detail

#### Rate Card Management
- Generate rate card by room type (private/semi-private)
- Display all applicable charges and services
- Apply facility discounts if applicable
- Send rate card + welcome email to lead/family
- Edit rates as needed

---

### 1.8 TRANSPORTATION & VERIDA INTEGRATION

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| TRN-1 | Trip Assignment | View trip pickup/drop-off assignments for drivers/families | New |
| TRN-2 | Assign/Reassign Drivers | Assign or reassign drivers to trip routes | New |
| TRN-3 | View Driver Capacity | View driver capacity and current trip assignments | New |
| TRN-4 | Trip Attendance | Import trip attendance data from CSV | New |
| TRN-5 | Update Trip Status | Mark resident as transported or no-show | New |
| TRN-6 | Standing Order Renewal | Receive alert 60 days before Standing Order expiration | New |
| TRN-7 | Modify Standing Order | Update service days or times for transport orders | New |
| TRN-8 | Send Verida Request | Send state transport request to Verida with resident details | New |
| TRN-9 | Add Case Manager to Verida | Add assigned case manager details to Verida request | New |
| TRN-10 | Escalation Capability | Add escalation/urgent flag to Verida transport request | New |

**Verida Integration Details**:
- Verida handles state-mandated transportation for Medicaid patients
- Send requests with:
  - Resident details (name, DOB, address, phone)
  - Service location (facility address)
  - Transportation type (pickup from home, return home)
  - Frequency (standing order: Mon-Fri, specific days)
  - Case manager contact info
  - Any special accommodations or escalations
- System tracks PA transport authorization units/validity
- Renewal alerts 60 days before expiration

---

### 1.9 DOCUMENTATION & E-SIGNATURES

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| DOC-1 | View & Send Documents | View and send required/optional from documents to patient | New |
| DOC-2 | Document Status | Mark each mandatory document as received/not received | New |
| DOC-3 | Resend Document | Resend documents to patient if required | New |
| DOC-4 | View & Sign Documents | View and sign documents received from patient | New |
| DOC-5 | Remind Signature | Send signature reminders to pending signatories | New |
| DOC-6 | Document Management | Upload, organize, version, and archive documents | New |

**Document Types by Service**:
- **ADH/ALF**: Intake form, Care Plan Agreement, Service Agreement, Emergency Contact, HIPAA Authorization, Attendant Privacy Policy
- **Home Care**: Intake form, Service Agreement, Care Plan, Clinical Assessment, Discharge Summary
- **Medicaid (ADH/ALF)**: Prior Auth package, Medicaid eligibility verification, EDWP forms, State compliance documents

---

### 1.10 STATE/MEDICAID MANAGEMENT

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| STATE-1 | Add State Details | Fill out state-provided CPT/ICD-10 codes, service frequencies, validate NPIs | New |
| STATE-2 | View Frequency History | View complete history of frequency (unit) changes | New |
| STATE-3 | Track PA Status | Track PA submission status (Submitted/Under Review/Approved/Denied) | New |
| STATE-4 | PA Rejection Resubmit | Resubmit updated document if rejected from state | New |
| STATE-5 | Add Billing Clearance | Add billing and clearance details for patient | New |

**State-Specific Data Requirements**:
- **NY Medicaid (ADH)**:
  - ADHS certification status
  - Participant eligibility date
  - Service frequencies (days per week)
  - ICD-10 diagnoses
  - Service codes (ADH-related)

- **Home Care Medicaid**:
  - Home care agency license #
  - Aides' certifications
  - Service visit frequency (times per week/month)
  - CPT codes for each visit type
  - Prior Auth validity dates

- **ALF Medicaid**:
  - ALF license #
  - Bed capacity & current census
  - Room type (private/semi)
  - Case manager assignment
  - Service rate (facility rate vs supplemental)

---

### 1.11 CLINICAL & CHARTING

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| CLN-1 | Add Vitals | Record vitals (BP, HR, Temp, O2, Weight, Height, Glucose) | New |
| CLN-2 | Edit Vitals | Edit previously recorded vitals | New |
| CLN-3 | View Vitals | View vitals with date/time stamps | New |
| CLN-4 | Add Allergy | Record allergies with type and reaction | New |
| CLN-5 | Add Incident | Report incidents (fall, medication error, etc.) | New |
| CLN-6 | Add Progress Notes | Clinician charting and notes | New |
| CLN-7 | Medication List | View current medications with dosage & frequency | New |
| CLN-8 | Add Medication | Record new medication | New |

---

## 2. FAMILY PORTAL

### 2.1 AUTHENTICATION

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| FP-AUTH-1 | Welcome Invitation | Receive email invitation from facility with portal setup link | New |
| FP-AUTH-2 | Password Setup | Set password on first login via invitation link | New |
| FP-AUTH-3 | Password Reset | Reset forgotten password | New |
| FP-AUTH-4 | Secure Login | Login with email and password | New |
| FP-AUTH-5 | OTP Verification | Receive 6-digit OTP on registered email after login | New |
| FP-AUTH-6 | Resend OTP | Resend OTP if not received or expired | New |
| FP-AUTH-7 | Multi-Resident Access | Toggle between multiple linked residents (e.g., two parents) | New |
| FP-AUTH-8 | Remember Me | Save email for faster future login | New |

### 2.2 DASHBOARD & HOME

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| FP-DASH-1 | Summary Cards | Display Family Members count, Active Alerts, Open Tickets, Next Visit date | New |
| FP-DASH-2 | Resident Demographics | View resident photo, name, program type, facility, room number, relationship | New |
| FP-DASH-3 | Progress Score | View overall progress indicator ("Improving", "Stable", "Declining") | New |
| FP-DASH-4 | Pain Scale | View current pain scale rating | New |
| FP-DASH-5 | Frequency Info | Display care visit frequency/schedule | New |
| FP-DASH-6 | Enrollment Details | Display start date, admitted date, expected discharge, payment type | New |
| FP-DASH-7 | Case Manager Info | Display case manager name and contact number | New |
| FP-DASH-8 | Attendance Calendar | Monthly calendar showing attendance by day | New |
| FP-DASH-9 | Active Alerts | Show recent alerts (High Vitals, etc.) | New |
| FP-DASH-10 | Incidents | Show recent incidents with type, date, time, location | New |
| FP-DASH-11 | Vitals Summary | Display recent vitals (BP, HR, Weight, BMI, SpO2, Temp, Glucose) | New |
| FP-DASH-12 | Allergies | Display allergy information | New |
| FP-DASH-13 | Open Tickets | Quick view of support ticket statuses | New |
| FP-DASH-14 | Quick Actions | "Request Meeting" and "Create Ticket" buttons | New |
| FP-DASH-15 | View All Links | Navigate to full detail pages for each section | New |

### 2.3 SCHEDULING & APPOINTMENTS

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| FP-SCHED-1 | Request Appointment | Request family conference, BH session, or clinic visit | Must Have |
| FP-SCHED-2 | View Appointments | List all upcoming scheduled appointments with location/telehealth links | Must Have |
| FP-SCHED-3 | Automatic Reminders | Receive SMS/Email/Push reminders before appointments | Must Have |
| FP-SCHED-4 | Upcoming/Past Tabs | Toggle between upcoming and past appointments | New |
| FP-SCHED-5 | Appointment Details | View full details (date, time, facility, provider, telehealth link) | New |
| FP-SCHED-6 | Cancel Appointment | Cancel upcoming appointment | New |
| FP-SCHED-7 | Reschedule Appointment | Reschedule upcoming appointment | New |
| FP-SCHED-8 | Request Modal | Fill form with Mode, Time Window, Resident, Facility, Preferred Provider, Message | New |
| FP-SCHED-9 | Search Appointments | Search appointments by keyword | New |
| FP-SCHED-10 | Join Telehealth | Click telehealth link directly from appointment to join session | New |

### 2.4 CLINICAL INFORMATION ACCESS

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| FP-CLIN-1 | View Medications | View current medication list | New |
| FP-CLIN-2 | View Vitals | View recorded vitals (BP, temp, etc.) | New |
| FP-CLIN-3 | View Progress Notes | View clinician progress notes (if permitted) | New |
| FP-CLIN-4 | View Alerts | View important health alerts | New |
| FP-CLIN-5 | View Allergies | View allergy information | New |
| FP-CLIN-6 | View Incidents | View incident reports | New |
| FP-CLIN-7 | View Inventory | View resident personal belongings tracked by facility | New |
| FP-CLIN-8 | View Events | View upcoming facility events and activity calendar | New |

### 2.5 BILLING & PAYMENTS

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| FP-BILL-1 | View Statements | View billing statements | Must Have |
| FP-BILL-2 | View Statement Details | View statement in PDF format | Must Have |
| FP-BILL-3 | Add Payment | Make payment with card details | Must Have |
| FP-BILL-4 | Payment Confirmation | Receive confirmation after payment | New |
| FP-BILL-5 | Payment History | View payment history with details | Must Have |
| FP-BILL-6 | View Invoice | View and download invoices | New |
| FP-BILL-7 | Monthly Summary | Receive summary report with changes in medications, vitals, alerts, incidents | New |

### 2.6 COMMUNICATIONS & MESSAGING

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| FP-MSG-1 | Secure Messaging | Send/receive messages in group chat with operations manager and nurse | Must Have |
| FP-MSG-2 | View Contacts | View chat contact list with avatars, last message, timestamp | New |
| FP-MSG-3 | Search Contacts | Search for specific contacts or conversations | New |
| FP-MSG-4 | Voice Call | Initiate voice call from chat conversation | New |
| FP-MSG-5 | Message Timestamps | See timestamps on all messages | New |
| FP-MSG-6 | Unread Badge | See unread message count badge on Chat menu | New |
| FP-MSG-7 | Attachments | Attach documents or photos to messages | Must Have |

### 2.7 DOCUMENTS

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| FP-DOC-1 | View & Sign Documents | View shared documents and digitally sign | New |
| FP-DOC-2 | Upload Documents | Upload personal documents (insurance cards, hospital papers) | New |
| FP-DOC-3 | Document Status | View signing status of documents | New |
| FP-DOC-4 | Mandatory Tab | View required documents with owner and creation date | New |
| FP-DOC-5 | My Space | View personal folders and documents (grid/list view) | New |
| FP-DOC-6 | Group Space | View shared document groups | New |
| FP-DOC-7 | Navigate Groups | Click group to view contents | New |
| FP-DOC-8 | Create Folder | Create new folder in My Space | New |
| FP-DOC-9 | Upload to Folder | Upload document to specific folder (5MB max, .png/.jpg) | New |
| FP-DOC-10 | Toggle View | Toggle grid/list view | New |
| FP-DOC-11 | Search Docs | Search documents by name | New |
| FP-DOC-12 | Filter Docs | Filter documents | New |
| FP-DOC-13 | Star Favorites | Star/favorite documents for quick access | New |
| FP-DOC-14 | Breadcrumb Navigation | Navigate between nested folders | New |
| FP-DOC-15 | View Metadata | View document owner, creation date | New |
| FP-DOC-16 | Upload Progress | See upload progress bar with ETA | New |
| FP-DOC-17 | Delete Upload | Delete document from upload queue before saving | New |

### 2.8 SUPPORT TICKETS

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| FP-TKT-1 | Create Ticket | Create support ticket with title and description | New |
| FP-TKT-2 | Track Tickets | Track status and responses | New |
| FP-TKT-3 | Open/Closed Tabs | View active and resolved tickets | New |
| FP-TKT-4 | View Cards | View ticket cards with ID, title, status, date/time | New |
| FP-TKT-5 | View Detail | Click ticket to view full details | New |
| FP-TKT-6 | Edit Ticket | Edit open ticket | New |
| FP-TKT-7 | Search Tickets | Search tickets by keyword | New |
| FP-TKT-8 | Filter Tickets | Filter tickets | New |

### 2.9 NOTIFICATIONS

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| FP-NOT-1 | Document Notification | Notify when new document shared | New |
| FP-NOT-2 | Incident Notification | Notify when incident reported | New |
| FP-NOT-3 | Chat Notification | Notify when new message posted | New |
| FP-NOT-4 | Ticket Update | Notify when support ticket updated | New |
| FP-NOT-5 | Payment Reminder | Friendly payment reminder 1st-5th of month | New |
| FP-NOT-6 | Late Fee Notice | Notify of late fee applied | New |
| FP-NOT-7 | Invoice Generated | Notify when new invoice generated | New |
| FP-NOT-8 | Alert Notification | Notify when new alert added | New |
| FP-NOT-9 | Event Notification | Notify when new facility event published | New |
| FP-NOT-10 | Appointment Reminder | Reminder before upcoming appointment/meeting | New |

### 2.10 SETTINGS & PROFILE

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| FP-SET-1 | View Profile Details | View personal information | Must Have |
| FP-SET-2 | View Insurance | View insurance details | Must Have |
| FP-SET-3 | Change Password | Change account password | Must Have |
| FP-SET-4 | View Linked Members | View all linked residents with status badge | New |
| FP-SET-5 | Summary Count | See count of open tickets, next visit date, family members | New |
| FP-SET-6 | Edit Profile | Update personal information | New |

---

## 3. HRMS (Human Resources Management System)

### 3.1 PAYROLL & COMPENSATION

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| HR-1 | Payroll Settings | Configure pay period, workweek, overtime calc, label execution | Must Have |
| HR-2 | Auto-Generated Timesheets | Timesheets auto-generated from EVV clock-in/out and scheduled shifts | Must Have |
| HR-3 | Automated Pay Calculations | Auto-calculate overtime (daily/weekly), shift differentials, premium pay | Must Have |
| HR-4 | Multi-Level Approval | Supervisors review timesheets, flag discrepancies, approve/reject, route to payroll | Must Have |
| HR-5 | Payroll Export | Export timesheets to payroll vendor (ADP, Gusto, Paychex, QB) format | Must Have |

**Payroll Rules Engine**:
- Regular hours calculation (standard workweek definition)
- Overtime: Daily threshold (e.g., >8hrs/day) and weekly threshold (e.g., >40hrs/week)
- Shift differentials: Night shift, weekend, holiday rates
- Premium pay: Double-time rules
- PTO time calculation: Vacation, sick, personal, unpaid
- Deductions: Standard and custom deductions

### 3.2 DASHBOARD

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| HR-DS-1 | Summary Cards | Total Employees, Pending Leave Approvals, Expiring Docs, Payroll Status | New |
| HR-DS-2 | Leave Requests Queue | Pending leave requests with employee, dates, type, status | New |
| HR-DS-3 | Compliance Alerts | List of expiring docs (visa, certification, background check) | Modified |
| HR-DS-4 | Workforce Movement | New joiners and exit list | New |
| HR-DS-5 | Staffing Gaps | Facilities with staff shortages by shift | New |
| HR-DS-6 | Activity Log | Recent activities (new hire, shift update, exit, compliance review) | New |

### 3.3 HR ADMIN OPERATIONS

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| HR-ADMIN-1 | Add Employee | Add new employee with full details | New |
| HR-ADMIN-2 | View Employee List | View employees (All, Active, Terminated tabs) | New |
| HR-ADMIN-3 | Manage Onboarding Forms | View, add/select, send, delete onboarding forms | New |
| HR-ADMIN-4 | Manage Mandatory Docs | Upload, view, edit, delete mandatory employee documents (licenses, visa) | New |
| HR-ADMIN-5 | Activate Employee | Activate after verifying identity and background | New |
| HR-ADMIN-6 | Welcome Email | Send welcome email to new employees | New |
| HR-ADMIN-7 | Resend Welcome Email | Resend welcome email | New |
| HR-ADMIN-8 | Employee Information | View & edit personal details, other details | New |
| HR-ADMIN-9 | View Documents | View all employee documents | New |
| HR-ADMIN-10 | View Shifts | View employee shift list | New |
| HR-ADMIN-11 | Manage Shifts | Create, edit, assign shifts | New |
| HR-ADMIN-12 | Leave History | View employee leave history | New |
| HR-ADMIN-13 | View Timecards | View all employee timecards | New |
| HR-ADMIN-14 | Manage Timecards | Perform actions on timecards | New |
| HR-ADMIN-15 | Shift Calendar | View shifts in day/week/month view (filter by date range, employee, shift, dept, facility) | New |
| HR-ADMIN-16 | Employees Leaves | View all leave requests (All, Approved, Rejected, Pending) | New |
| HR-ADMIN-17 | Approve/Reject Leave | Process leave requests | New |
| HR-ADMIN-18 | Performance Reviews | View, approve, edit performance reviews | New |
| HR-ADMIN-19 | Training | Schedule orientation, assign training modules, update training status | New |
| HR-ADMIN-20 | Employee Separation | Create separation request, view exit list, conduct exit interview, finalize | New |
| HR-ADMIN-21 | Revoke Access | Revoke employee portal access on separation | New |
| HR-ADMIN-22 | Terminate Benefits | Terminate employee benefits on separation | New |
| HR-ADMIN-23 | Asset Management | Manage employee onboarding docs and background checks | New |

### 3.4 SUPERVISOR OPERATIONS

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| HR-SUP-1 | Dashboard | View coverage %, active staff, pending approvals, upcoming leave, weekly calendar | New |
| HR-SUP-2 | Quick Actions | Create shift, new employee, label management | New |
| HR-SUP-3 | Shift Calendar | View shifts in list/week/month view | New |
| HR-SUP-4 | Coverage Graph | View required vs actual staff, shortage/surplus by day | New |
| HR-SUP-5 | Approval Queue | View pending leave requests with filter | New |
| HR-SUP-6 | Create Shift | Create employee shift schedule | New |
| HR-SUP-7 | Bulk Assign Shifts | Assign shifts to multiple employees | New |
| HR-SUP-8 | Edit Shift | Edit existing shift details | New |
| HR-SUP-9 | Change Shift Type | Change shift type for employee | New |
| HR-SUP-10 | Assign Backup Staff | Assign backup staff to shifts | New |
| HR-SUP-11 | Shift Requests | View shift change requests with status | New |
| HR-SUP-12 | Check Availability | Check staff availability for swap requests | New |
| HR-SUP-13 | Approve/Reject Shift | Process shift change requests | New |
| HR-SUP-14 | Leave Requests | View all leave requests | New |
| HR-SUP-15 | Approve/Reject Leave | Process leave with option to assign replacement | New |
| HR-SUP-16 | View Leave Details | View specific leave request details | New |
| HR-SUP-17 | Performance Reviews | View and submit performance reviews | New |
| HR-SUP-18 | Add for Review | Add employee for performance review | New |
| HR-SUP-19 | Timecard Approval | View and approve/reject timesheets submitted by staff | New |
| HR-SUP-20 | Tasks | View, assign, edit tasks for employees | New |
| HR-SUP-21 | Profile | View and edit own profile with picture upload | New |
| HR-SUP-22 | Incident Report | Log incident report for staff | New |
| HR-SUP-23 | Attendance Correction | Request attendance correction for staff | New |

### 3.5 EMPLOYEE OPERATIONS

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| HR-EMP-1 | Dashboard | View upcoming shift, leave balance, pending requests, performance | New |
| HR-EMP-2 | Weekly Schedule | View weekly schedule with week/month/day navigation | New |
| HR-EMP-3 | Clock In/Out | Clock in/out with timer display and break marking | New |
| HR-EMP-4 | View Tasks | View today's tasks with priority, assigned by, mark complete | New |
| HR-EMP-5 | Notice Board | View notices with category tags | New |
| HR-EMP-6 | Timecard Summary | View weekly summary (total hours, breaks, net hours, overtime) | New |
| HR-EMP-7 | Weekly Tasks | View weekly tasks by day | New |
| HR-EMP-8 | Timecard History | View all timecards history | New |
| HR-EMP-9 | Submit Timecard | Send timecard to supervisor for approval | New |
| HR-EMP-10 | Overtime Request | Submit overtime request | New |
| HR-EMP-11 | Leave Management | Submit leave request | New |
| HR-EMP-12 | Leave Balances | View leave balance cards (annual, sick, personal, unpaid) | New |
| HR-EMP-13 | Past Leave | View past leave requests in tabs | New |
| HR-EMP-14 | Cancel Leave | Cancel pending leave request | New |
| HR-EMP-15 | Shift Schedule | View assigned shift schedule | New |
| HR-EMP-16 | Shift Requests | View and submit shift change requests | New |
| HR-EMP-17 | Shift Swap | Accept/decline shift swap requests | New |

---

## 4. SUPER ADMIN PORTAL

### 4.1 AUTHENTICATION

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| SA-AUTH-1 | Secure Login | Login with email and password | New |
| SA-AUTH-2 | OTP Verification | Receive and verify 6-digit OTP | New |
| SA-AUTH-3 | Password Reset | Reset forgotten password | New |

### 4.2 DASHBOARD & METRICS

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| SA-DASH-1 | Metrics Cards | Total facilities, providers, patients, appointments, encounters count | Must Have |
| SA-DASH-2 | Facilities List | View all registered facilities with name, company, status, department count | Must Have |

### 4.3 COMPANY MANAGEMENT

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| SA-COMP-1 | Add Company | Add new company with name, email, phone, website, address, logo, brand color | New |
| SA-COMP-2 | View Companies | View list of all registered companies | New |
| SA-COMP-3 | Search & Filter | Search and filter companies | New |
| SA-COMP-4 | Company Profile | Edit company profile | New |
| SA-COMP-5 | Set Brand Color | Configure brand color and logo per company | New |

### 4.4 FACILITY MANAGEMENT

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| SA-FAC-1 | Add Facility | Add new facility | New |
| SA-FAC-2 | View Facilities | View list of facilities | Must Have |
| SA-FAC-3 | Update Facility | Edit facility details | Must Have |
| SA-FAC-4 | Facility Details | View facility location details | Must Have |
| SA-FAC-5 | Manage Users | Add, view, edit, archive facility users | Must Have |

### 4.5 MASTER DATA SETUP

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| SA-MASTER-1 | CPT Codes | View, add, edit, archive, import/export CPT codes | New |
| SA-MASTER-2 | ICD-10 Codes | View, add, edit, archive, import/export ICD-10 codes | New |
| SA-MASTER-3 | Service Codes | Manage service codes mapped to service types | New |
| SA-MASTER-4 | Specialties | Add, edit, view, archive specialties | New |

### 4.6 FORM BUILDER

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| SA-FORM-1 | Create Form | Create forms using form builder | New |
| SA-FORM-2 | Archive Form | Archive forms | New |
| SA-FORM-3 | Duplicate Form | Duplicate form for modification | New |
| SA-FORM-4 | Manage Templates | Save as template, view library, edit, delete, assign to facilities | New |
| SA-FORM-5 | Submit Form | Save and submit forms | New |

### 4.7 SETTINGS & CONFIGURATION

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| SA-SET-1 | User Management | Add, view, edit, archive/inactive users | Must Have |
| SA-SET-2 | Import/Export Users | Bulk import/export user lists | New |
| SA-SET-3 | Roles & Permissions | Manage roles and permissions for all users | Modified |
| SA-SET-4 | Profile | View and update own profile | Must Have |
| SA-SET-5 | Support Tickets | View all support tickets submitted by facilities | New |

### 4.8 AUDIT & COMPLIANCE

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| SA-AUDIT-1 | Audit Logs | View all audit logs for company level | New |
| SA-AUDIT-2 | Download Logs | Download audit logs as CSV or PDF | New |
| SA-AUDIT-3 | Search & Filter | Search and filter audit logs | New |

### 4.9 NOTIFICATIONS & SETTINGS

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| SA-NOT-1 | View Settings | View notification settings for events | New |
| SA-NOT-2 | Enable/Disable | Enable/disable notification channels (SMS, Email, Push, Portal) | New |
| SA-NOT-3 | Save Preferences | Save updated notification preferences | New |
| SA-NOT-4 | Track Changes | Track changes made to notification settings | New |

### 4.10 DOCUMENT BRANDING

| Story ID | Capability | Description | Priority |
|----------|------------|-------------|----------|
| SA-BRAND-1 | Logo on Documents | Configure facility logo for system-generated documents | Must Have |
| SA-BRAND-2 | Document Header | Configure facility name in document header | Must Have |
| SA-BRAND-3 | Logo on Invoices | Configure logo on generated invoices | Must Have |

---

## ACCEPTANCE CRITERIA & TEST SCENARIOS

### LOGIN FLOW (Facility Portal Example)

**User Story**: As a Provider, I should be able to receive a welcome email with a Set Password link when my profile is created.

**Acceptance Criteria**:
1. When admin creates provider profile → System sends welcome email with Set Password link within 5 min
2. Link valid for 24 hours, single-use, cryptographically random
3. Link expires or already-used → Error message with resend option
4. Expired link → Offer to request new link
5. Provider profile creation fails → No email

**Test Scenarios**:

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| 1 | Valid profile creation | Admin creates provider "john@clinic.com" | Email sent within 5 min, contains Set Password link | PASS |
| 2 | Invalid email | Admin enters "provider@" | Validation error, no email sent | PASS |
| 3 | Duplicate email | Two providers with same email | Each gets independent welcome email with unique link | PASS |
| 4 | Expired link (24hr+) | User clicks link after 24 hours | Error: "Link has expired, request new one" | PASS |
| 5 | Used link (second click) | User clicks same link twice | Second click: "Link already used" error | PASS |
| 6 | Profile cancel | Admin cancels profile creation | No email triggered | PASS |
| 7 | Missing email | Profile created without email | No email sent, admin notified | PASS |

---

## DATA MODELS & ENTITIES

### Core Data Entities

```
USER
├── ID (UUID)
├── Email (unique)
├── Password (hashed)
├── First Name, Last Name
├── Phone, Address
├── Role (Admin, Staff, Provider, Family, Super Admin)
├── Facility ID (FK)
├── Status (Active, Inactive, Locked)
├── Created Date, Last Login, Last Updated

RESIDENT
├── ID (unique identifier)
├── Demographics
│   ├── Full Name, DOB, Gender, Age (calculated)
│   ├── Contact Info (phone, email, address)
│   ├── Emergency Contact (name, relationship, phone)
│   ├── Photo
├── Enrollment
│   ├── Status (Lead, New Arrival, Active, On Hold, Discharged)
│   ├── Program Type (ADH, ALF, Home Care, MC, IL)
│   ├── Program Level
│   ├── Enrollment Date, Discharge Date
│   ├── Facility ID
├── Medical
│   ├── ICD-10 Codes (diagnoses)
│   ├── Allergies (type, reaction)
│   ├── Medications (list with dosage, frequency)
│   ├── Special Care Instructions
├── Insurance
│   ├── Payment Type (Private Pay, Medicaid, Insurance, Mixed)
│   ├── Insurance Details (if applicable)
│   ├── Medicaid Info (state, waiver, case manager)
│   ├── Prior Auth (number, dates, units/frequency, status)
├── Facility-Specific
│   ├── Room/Bed Assignment (ALF)
│   ├── Frequency (ADH/Home Care - days/week)
│   ├── Care Plan Documents
│   ├── Standing Orders (transportation)
├── Billing
│   ├── Rate Card (private pay or Medicaid rate)
│   ├── Billing Clearance Status
│   ├── Deposit Status (if applicable)

LEAD
├── ID
├── Source (web, referral, advertisement, etc.)
├── Status (Prospect, Qualified, Rejected, Converted)
├── Contact Info (name, phone, email, address)
├── Service Type Preference
├── Medicaid Eligibility Indication
├── Qualification Score (Medicaid probability %)
├── Assigned Sales Rep
├── Activity History (calls, SMS, visits, notes)
├── Follow-up Dates
├── Converted To Resident ID (if applicable)

VISIT/APPOINTMENT
├── ID
├── Resident ID (FK)
├── Type (Facility Tour, Consultation, Family Conference, Clinical Visit)
├── Scheduled Date/Time
├── Duration
├── Location/Telehealth Link
├── Provider/Staff Assigned
├── Notes
├── Status (Scheduled, Completed, Cancelled, Rescheduled)

ATTENDANCE (ADH/Daily)
├── ID
├── Resident ID
├── Date
├── Scheduled (Y/N)
├── Check-In Time
├── Check-Out Time
├── Duration
├── Attendance Type (Full Day, Half Day, Partial, Absent)
├── Absence Reason (if applicable)

ACTIVITY_PARTICIPATION
├── ID
├── Resident ID
├── Date
├── Activity Type (Therapy, Personal Care, Meal, Social, etc.)
├── Activity Description
├── Timestamp
├── Duration

VITALS
├── ID
├── Resident ID
├── Date/Time
├── BP (systolic/diastolic)
├── Heart Rate
├── Temperature
├── O2 Saturation
├── Weight
├── Height
├── Blood Glucose
├── Recorded By

INCIDENT
├── ID
├── Resident ID
├── Date/Time
├── Type (Fall, Medication Error, Altercation, Property Damage, etc.)
├── Description
├── Location
├── Witnesses
├── Action Taken
├── Reported By

FACILITY
├── ID
├── Name
├── Company ID (FK)
├── Address
├── Phone, Email
├── License Number
├── Bed Capacity
├── Service Types Offered (ADH, ALF, Home Care, MC, IL)
├── Room Configuration (private vs semi-private)
├── Status (Active, Inactive)

ROOM/BED (ALF)
├── ID
├── Facility ID
├── Floor
├── Room Number
├── Type (Private, Semi-Private)
├── Capacity
├── Current Occupant(s)
├── Status (Occupied, Available, On Hold, Reserved)

BILLING_RECORD
├── ID
├── Resident ID
├── Period (month)
├── Service Type
├── Units/Hours
├── Rate
├── Amount
├── Status (Draft, Submitted, Paid, Overdue)

EMPLOYEE
├── ID
├── First Name, Last Name
├── Email, Phone
├── Position/Role
├── Facility ID
├── Status (Active, Inactive, Terminated)
├── Hire Date, Termination Date
├── Salary/Hourly Rate
├── Department

TIMESHEET
├── ID
├── Employee ID
├── Period (week)
├── Clock-In Times, Clock-Out Times
├── Breaks
├── Total Hours
├── Overtime Hours
├── Status (Draft, Submitted, Approved, Rejected)

SHIFT
├── ID
├── Facility ID
├── Employee ID
├── Date
├── Start Time, End Time
├── Type (Regular, Overtime, On-Call)
├── Status (Scheduled, Cancelled, Completed)
```

---

## BUSINESS RULES & WORKFLOWS

### 1. LEAD LIFECYCLE

**Stage 1: Prospect**
- Rules:
  - Auto-calculate Medicaid qualification score (if ADH) based on intake data
  - Max 5 calls/SMS per day per lead (prevent harassment)
  - Lead source must be documented
  - Sales rep must be assigned
  
- Transitions:
  - → Qualified: If all qualification criteria met
  - → Rejected: If not qualified or declined by lead
  - → Converted: If lead accepts service and becomes New Arrival

**Stage 2: Qualified**
- Rules:
  - Schedule facility tour within 7 days of qualification
  - Send rate card (private pay or Medicaid estimate)
  - Request insurance documentation
  - For Medicaid: Initiate PA package preparation
  
- Output Documents:
  - Rate card (email to lead/family)
  - Intake form (for e-signature)
  - Service agreement preview

**Stage 3: Documentation in Progress**
- Rules:
  - Send all required documents for e-signature
  - For Medicaid ADH: Collect prior auth from state
  - Validate all documents received before conversion
  - Track Medicaid PA status if applicable
  
- For Medicaid Residents:
  - Select case management agency
  - Assign case manager
  - Prepare Verida transport request (if applicable)
  - Validate CPT/ICD-10 codes

**Stage 4: Converted to New Arrival**
- Trigger: All documentation complete + PA received (if Medicaid)
- Actions:
  - Create Resident record with status "New Arrival"
  - Assign room/bed (for ALF)
  - Schedule first-day orientation
  - Send welcome email to family (if family portal enabled)
  - Set up frequency schedule (ADH/Home Care)

**Stage 5: Active after First Day**
- Trigger: Resident checks in, completes first-day setup
- Actions:
  - Change status to "Active"
  - Initiate billing cycle
  - Set up care plan and clinical baseline
  - Enable family portal (if applicable)

---

### 2. RESIDENT LIFECYCLE

```
Lead → New Arrival → Active → [On Hold/Discharge]

STATE TRANSITIONS:

Lead:
├─ Prospect (initial)
├─ Qualified (meets criteria)
├─ Rejected (not qualified)
└─ Converted to New Arrival

New Arrival:
├─ Waiting first day arrival
└─ → Active (on first check-in)

Active:
├─ Normal care delivery
├─ → On Hold (temporary pause)
├─ → Discharge (end of service)

On Hold:
├─ Paused care
└─ → Active (resumed) OR → Discharge

Discharged:
├─ Service ended
├─ Reason documented
└─ Final billing/documents closed
```

**Key Rules**:
- **New Arrival → Active**: Must have first check-in AND first-day setup completed
- **Active → On Hold**: Supervisor must document reason, family notified, billing paused
- **Any → Discharged**: Final billing run, all standing orders cancelled, family portal access revoked
- Age calculation: Always dynamic based on DOB (updates on birthday)
- Cannot delete resident (only archive)
- All status changes logged to audit trail with timestamp and user ID

---

### 3. MEDICAID WORKFLOW (for ADH/ALF/Home Care)

**Prerequisites**:
- Service type identified (ADH, ALF, Home Care)
- Resident qualifies for Medicaid (state-based)
- State of residence determined

**Step 1: Prepare Prior Authorization (PA) Package**
- Collect information:
  - Resident demographics and Medicare/Medicaid ID
  - Diagnosis codes (ICD-10)
  - Service codes (CPT for specific services)
  - Requested service frequency (units/month or days/week)
  - Start and end dates (typically 1 year)
  - Facility/Provider NPI number (validated)

- For **ADH**:
  - Service: "Adult Day Health Services"
  - Frequency: e.g., "5 days/week" or "units per month"
  - Level: ADHS Level I, II, or III (based on assessment)

- For **ALF**:
  - Service: "Room and Board" + "Care Services" (split billing)
  - Facility rate: State-mandated per diem
  - Room type: Private or Semi-Private

- For **Home Care**:
  - Service: "Home Health Aide" or "Skilled Nursing"
  - Units: 15-minute increments
  - Example: 8400 units @ 15 min = 2100 hours/year

**Step 2: Select Case Management Agency**
- Provider selects case management agency from approved list
- Request case manager assignment
- Assign case manager details to file

**Step 3: Submit PA to State**
- Submit PA package to Medicaid
- Track submission status: Submitted → Under Review → Approved/Denied
- Store PA number, approval dates, units/frequency

**Step 4: Verida Transport Request** (if applicable for ADH)
- Populate Verida request with:
  - Resident details
  - Pickup location (home) and drop-off location (facility)
  - Standing order: Days/times for repeated transport
  - Case manager contact info
  - Any escalation/special needs

**Step 5: Tracking & Renewal**
- Track PA expiration date (typically 1 year from approval)
- Alert provider 60 days before expiration
- For standing orders: Alert 60 days before renewal needed
- Resubmit/renew as needed

**Billing Rules**:
- Bill Medicaid at approved rate(s)
- Submit claims with:
  - Resident Medicaid ID
  - PA number
  - Service date(s) and units/hours
  - Provider NPI
- Track claim status: Submitted → Processed → Approved/Denied
- Follow state timelines for claims submission (typically 90 days)

---

### 4. PRIVATE PAY BILLING

**Single Payer**:
- Provider or responsible party identified
- Rate agreed (monthly, by visit, by service)
- Payment method: Card, Cash, Check, Money Order
- Invoice generated per billing cycle
- Payment tracking

**Multiple Payers (Split Billing)**:
- Primary payer (e.g., patient)
- Secondary payer (e.g., insurance, family member)
- Split configuration:
  - Equal split (50/50)
  - Custom split (e.g., 70/30 or manual allocation per item)
- Separate invoices generated per payer
- Track which payer covers which services

**Insurance + Medicaid**:
- Insurance primary (covers copay % or full amount)
- Medicaid secondary (covers remaining after insurance)
- Bill insurance first
- Submit remaining balance to Medicaid if applicable

---

### 5. BILLING CYCLES & INVOICING

**Monthly Cycle** (typical):
- Billing period: 1st-last day of month
- Services rendered captured during month
- Billing snapshot taken on last day of month
- Invoice generated within 1-2 days after month-end
- Payment due 15-30 days from invoice date
- Late fee applied if not paid by due date

**Billing Models**:

1. **A La Carte**:
   - Room: $X/month
   - Board (meals): $Y/month
   - Laundry: $Z/month
   - Care services: $A/day
   - Transport: $B/month
   - Subtotal line items

2. **Blended Rate**:
   - All-inclusive rate: $X/month
   - No itemized service breakdown
   - Typically easier to understand for families

**Invoice Elements**:
- Resident name, room number, facility
- Billing period
- Service descriptions and rates
- Units/days × rate = amount
- Subtotal, taxes (if applicable), total due
- Payment methods accepted
- Due date
- Account balance/aging
- Facility logo and contact info (Super Admin configured)

---

### 6. STATE COMPLIANCE & AUDIT REQUIREMENTS

**ADH (Adult Day Health)**:
- ✓ Daily attendance tracking
- ✓ Activities documentation (therapy, social, personal care)
- ✓ EDWP (Education Workplan) forms to state case manager
- ✓ Medication administration records
- ✓ Incident reports (if applicable)
- ✓ Infection control logs

**ALF (Assisted Living)**:
- ✓ Bed census reporting (monthly)
- ✓ Fire drills documentation
- ✓ Staff certifications tracking (expiry alerts)
- ✓ Incident reports (elopement, falls, fights)
- ✓ Dining/nutrition plans
- ✓ Medication management

**Home Care**:
- ✓ Care plan signed by nurse and physician
- ✓ Visit documentation (date, time, services)
- ✓ Medication administration records
- ✓ Clinical progress notes
- ✓ Outcome tracking (OASIS data for Medicare)

**System Requirements**:
- All user actions logged to audit trail (user ID, timestamp, action)
- Document e-signatures with time/date stamps
- State-required forms templateable and submittable via portal
- HIPAA compliance: Encryption, access controls, data retention policies
- Data backup and disaster recovery plan

---

### 7. TRANSPORTATION & VERIDA INTEGRATION

**Standing Order Management**:
- Resident setup: Name, address, phone, medical restrictions
- Pickup location: Home address (or alternate)
- Facility drop-off: Facility address
- Frequency: Mon-Fri, specific days, repeating pattern
- Renewal: Remind provider 60 days before expiration
- Modify: Allow changes to days/times before renewal

**Verida Request Details**:
- Resident: Name, DOB, address, phone
- Medicaid authorization info
- Case manager: Name, agency, phone, email
- Special instructions: Mobility aids, behavior alerts, escalation flags
- Request status: Submitted → Approved → Active

**Billing for Transport**:
- Medicaid covers verified transport as per PA
- Track actual transport vs authorized
- Report no-shows
- Update utilization (e.g., 30/90 units used)

---

### 8. RBAC (Role-Based Access Control)

| Role | Facility Portal | Family Portal | HRMS | Super Admin |
|------|-----------------|---------------|------|-------------|
| Provider/Manager | Full access to facility ops | — | — | — |
| Staff/Caregiver | Limited (own shifts, assigned residents) | — | Limited (own timecard) | — |
| Family Contact | — | Full (linked residents only) | — | — |
| HR Admin | — | — | Full HRMS | — |
| Supervisor | Limited (own team, department ops) | — | Supervisor ops | — |
| Employee | — | — | Limited (own timecard, shifts) | — |
| Super Admin | System configuration only | — | System config | Full system config |

**Access Control Rules**:
- Provider/staff can only view residents assigned to their facility
- Family contacts can only view linked residents
- Supervisors see only their direct reports and department
- Employees see only their own data
- All cross-facility data segregation enforced at API level

---

## INTEGRATION POINTS

### 1. MEDICAID STATE SYSTEMS

**Manual Integration**:
- State PA template download → Import to system
- PA approval documents → Scan/upload to system
- EDWP forms → Generate in system, print, fax to case manager
- Attendance/billing reports → Export from system, submit to state portal

**Future API Integration** (Proposed):
- Real-time PA lookup (if state offers API)
- Automatic Medicaid eligibility verification
- Electronic submission of claims
- Status updates from state

### 2. VERIDA TRANSPORT

**Current Integration**:
- Manual request form population in system
- Export details → Send via email or use Verida portal
- Receive transport assignments → Manual import to calendar
- Track utilization manually

**Future Enhancements**:
- Direct Verida API connection (if available)
- Real-time route assignment
- GPS tracking of transport vehicles
- Automated billing/utilization sync

### 3. E-SIGNATURE PROVIDERS

**Proposed Integration**:
- DocuSign, Adobe Sign, or HelloSign
- Document templates stored in system
- Route for e-signature → Collect signatures → Archive signed PDF
- Track signing status and timestamp

### 4. INSURANCE VERIFICATION

**Proposed**:
- Integration with insurance verification service (e.g., Emdeon, Availity)
- Real-time eligibility checking
- Coverage details lookup
- EOB (Explanation of Benefits) retrieval

### 5. PAYMENT PROCESSING

**Proposed**:
- Stripe or Square for card payments
- ACH for bank transfers
- Payment status tracking
- Automated receipts

### 6. COMMUNICATIONS

**SMS/Email**:
- Twillio or AWS SNS for SMS
- SendGrid or AWS SES for email
- Template management
- Delivery tracking

**Telehealth** (if needed):
- Zoom, Teladoc, or Doxy.me integration
- Automatic meeting link generation
- Session recording (optional)
- Encounter note transcription

### 7. REPORTING & BUSINESS INTELLIGENCE

**Proposed**:
- Integration with BI tools (Tableau, Power BI, Looker)
- Real-time dashboards for executives
- Compliance reporting automation
- Performance metrics tracking

---

## KEY MEETING NOTES

### MOM-1: Discovery Call (Jan 16, 2026)

**Attendees**: Sam Shah (Client), AK, Mojib Patel, DV, RD, SG, SP, Tejas Kor, others

**Key Discussions**:

1. **System Overview**:
   - Existing employee portal + healthcare side
   - CRM for lead management
   - Multi-level healthcare practices (ADH, ALF, Home Care)
   - Lead source tracking
   - Different documentation requirements per service type

2. **Patient Onboarding Flow**:
   - Member status types: Member (approved), Guest (pending approval), Private Pay, Medicaid
   - Demographics capture: Name, DOB, address, phone, SSN, Medicare/Medicaid ID
   - Emergency contact, insurance info, dietary preferences
   - Frequency assignment (days per week for ADH)
   - Service start date and active status

3. **Medicaid Integration**:
   - Prior Authorization (PA) package tracking
   - ICD-10 codes for billing
   - Units definition varies by service type and state
   - Example: Home care = 15-min units; Case management = 1 unit/month
   - PA typical validity: 1 year
   - Medicaid ID, provider ID, diagnosis codes captured in PA package

4. **State Requirements**:
   - Different documentation per service (ADH vs ALF vs Home Care)
   - Contract for ALF (no documentation like ADH intake)
   - State-mandated rates for Medicaid
   - Case manager assignment for Medicaid patients

5. **Multi-Practice Support**:
   - System must support multiple healthcare practices
   - Each practice has different workflows/requirements
   - Packages/modules configured per facility/company
   - Service types (ADH, ALF, Home Care, Transportation, etc.) configured

6. **Next Steps**:
   - Super Admin portal for configuration
   - Company onboarding and package selection
   - Facility setup with services offered
   - User provisioning per facility

---

### Key Decisions from Discovery

1. **Unit Definition**: Units are NOT uniform; vary by state and service type
2. **Frequency**: For ADH = days/week; For Home Care = units/month (where 15 min = 1 unit typically)
3. **Documentation**: Different per service; ADH requires forms, ALF requires contracts
4. **Medicaid Case Manager**: Auto-assigned per PA, not provider-selected
5. **Packages**: Configurable by company; determine which modules available per facility

---

## UI WIREFRAMES & COMPONENTS

### Figma Screens Available

**Facility Portal**:
- Login screen (split layout: image left, form right)
- Set Password screen
- OTP verification screen
- Dashboard (metrics, leads, residents)
- Lead list (card-based, filterable)
- Lead detail (full profile, activity history)
- Resident list (table with tabs: All, Active, In-Progress, New Arrival, Discharged)
- Resident detail (demographics, medical, billing, activity)
- Visit/Appointment calendar (day/week/month views)
- Billing screens (rate cards, invoices, payment split)
- Room assignment (bed census, availability)
- Waitlist management
- Daily attendance tracking
- Activity recording
- Vitals entry

**Family Portal**:
- Login/OTP screens
- Dashboard (summary cards, activities, appointments)
- Resident switcher (for multiple linked residents)
- Attendance calendar
- Appointments/visit scheduling
- Messaging UI
- Document management
- Billing/Payment statements
- Support tickets

**HRMS**:
- Dashboard (leave queue, compliance alerts, staff gaps)
- Shift calendar management
- Timesheet approval
- Employee management
- Leave request management
- Performance review

**Super Admin**:
- Login, OTP, Dashboard
- Company list and add form
- Facility list and add form
- User management
- CPT/ICD-10 code management
- Form builder interface
- Audit log viewer
- Notification settings

---

## FEATURE EFFORT ESTIMATION

| Feature Area | % of Effort | Est. Hours | Dependencies |
|--------------|------------|-----------|--------------|
| Authentication (all portals) | 8% | 64 | None |
| CRM/Lead Management | 15% | 120 | Auth |
| Resident Management | 20% | 160 | Auth, Lead Mgmt |
| Capacity & Scheduling | 15% | 120 | Resident Mgmt |
| Documentation & E-Sig | 12% | 96 | Resident Mgmt |
| Billing & Invoicing | 12% | 96 | Resident Mgmt |
| State/Medicaid | 8% | 64 | Resident Mgmt, Billing |
| Clinical & Charting | 5% | 40 | Resident Mgmt |
| HRMS | 10% | 80 | Auth |
| Family Portal | 10% | 80 | Auth, Resident Mgmt |
| Super Admin | 8% | 64 | Auth |
| Testing & QA | 20% | 160 | All features |
| DevOps & Deployment | 5% | 40 | All |
| **TOTAL** | **100%** | **800 hours** | **~5.3 person-weeks** |

*(Assumes 3-4 full-time developers, 14-week project)*

---

## COMPLIANCE & SECURITY CONSIDERATIONS

### HIPAA Requirements
- ✓ Access controls and authentication (2FA with OTP)
- ✓ Audit logging of all PHI access
- ✓ Encryption in transit (HTTPS) and at rest (DB encryption)
- ✓ Data integrity (hash/sign sensitive data)
- ✓ Business Associate Agreements (if using cloud services)
- ✓ Incident response plan
- ✓ Regular security training for staff

### State-Specific Compliance
- ✓ Medicaid rates and billing rules per state
- ✓ State-mandated documentation and forms
- ✓ Reporting requirements (EDWP, quality metrics)
- ✓ Licensing and certification tracking
- ✓ Provider NPI validation

### Data Retention
- Active resident data: 6 years minimum post-discharge
- Audit logs: 7 years
- Billing records: Per state requirements (typically 5-7 years)

---

## SUMMARY & NEXT STEPS

This comprehensive analysis captures:
- **200+ user stories** across 4 portals
- **Detailed test scenarios** for login flow and beyond
- **Data model** for 15+ core entities
- **Business rules** for lead-to-resident workflow, Medicaid, billing
- **Integration points** for Verida, state systems, e-signatures, payment
- **Key decisions** from discovery meetings
- **UI components** documented in Figma

**Ready for**:
1. SRS document generation (SRS Agent)
2. Database schema design
3. API specification (OpenAPI)
4. Frontend component library
5. Test case generation (Test Case Agent)
6. Development sprint planning

**Critical Success Factors**:
- Multi-tenant architecture (per company/facility isolation)
- Medicaid compliance automation
- Real-time lead scoring
- Family engagement portal
- Audit trail for all transactions
- Scalable to 1000+ residents per facility

---

*Document created: April 4, 2026*  
*Last updated: April 4, 2026*  
*Status: COMPLETE AND READY FOR DEVELOPMENT*
