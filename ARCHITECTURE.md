# Nemicare HomeCare Platform - Architecture Design Document

**Phase**: Phase 1 (Foundation)  
**Document**: Architecture Decision Records (ADRs)  
**Version**: 1.0  
**Date**: April 4, 2026  
**Status**: APPROVED FOR IMPLEMENTATION

---

## 📐 ARCHITECTURE OVERVIEW

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Browser)                      │
│  ┌─────────────┬──────────┬──────────┬──────────────────────┐   │
│  │ Facility    │ Family   │ HRMS     │ Super Admin          │   │
│  │ Portal      │ Portal   │ Portal   │ Portal               │   │
│  └─────┬───────┴────┬─────┴────┬─────┴──────────┬──────────┘   │
└────────┼────────────┼──────────┼────────────────┼───────────────┘
         │            │          │                │
        HTTPS + TLS 1.3
         │            │          │                │
┌────────▼──────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                           │
│  ┌────────────────────────────────────────────────────┐      │
│  │ Express.js + Node.js (Port 3001)                   │      │
│  ├────────────────────────────────────────────────────┤      │
│  │ Middleware Stack:                                  │      │
│  │ 1. CORS, Rate Limiting, Request logging            │      │
│  │ 2. JWT Authentication, RBAC                        │      │
│  │ 3. Request Validation (Joi/Zod)                    │      │
│  │ 4. Error Handling, Audit Logging                   │      │
│  └────────────────────────────────────────────────────┘      │
└────────┬─────────────────────────────────────────────────────┘
         │
    ┌────┴──────────┬──────────┬──────────┐
    │               │          │          │
┌───▼──────┐ ┌─────▼──┐ ┌────▼────┐ ┌──▼────────┐
│ Services │ │  Cache │ │ Queue   │ │  3rd-party│
│ Layer    │ │ (Redis)│ │ (Bull)  │ │                      │
├──────────┤ └────────┘ └─────────┘ │ Integrations
│ Auth     │                        ├─ Medicaid API
│ Lead Mgmt│       PostgreSQL    │ │ ├─ Verida
│ Resident │       Database      │ │ ├─ Stripe/Square
│ Billing  │   (Primary Data)    │ │ ├─ DocuSign
│ Charting │                        │ ├─ Twilio/SendGrid
│ Clinical │                        │ └─ S3 (Documents)
└──────────┘                        └────────────────
```

### Technology Stack (LOCKED)

#### Frontend
```
Framework:           React 18.2+
Language:            TypeScript 5.0+
State Management:    Redux Toolkit 1.9+
Routing:             React Router 6.8+
HTTP Client:         Axios 1.3+
UI Library:          Material-UI 5.12+ (MUI)
Forms:               React Hook Form 7.42+
Validation:          Zod 3.20+
Testing:             Jest 29+, React Testing Library 14+, Playwright 1.40+
Build Tool:          Vite 4.0+
Package Manager:     npm 9+
```

#### Backend
```
Runtime:             Node.js 18.12 LTS+
Framework:           Express.js 4.18+
Language:            TypeScript 5.0+
ORM:                 Prisma 4.10+
Database:            PostgreSQL 14+
Authentication:      jsonwebtoken 9.0+, bcrypt 5.1+
Validation:          Joi 17.9+ or Zod 3.20+
Logging:             Winston 3.8+ or Pino 8.11+
HTTP Client:         Axios 1.3+ (for integrations)
Testing:             Jest 29+, Supertest 6.3+
API Docs:            Swagger UI 4.15+, @nestjs/swagger
Environment:         dotenv 16.0+
Caching:             Redis 7.0+
Job Queue:           Bull 4.10+
Encryption:          crypto-js 4.1+
Package Manager:     npm 9+
```

#### DevOps & Infrastructure
```
Containerization:    Docker 20.10+, Docker Compose 2.0+
Version Control:     Git 2.38+
Repository:          GitHub/GitLab
CI/CD:               GitHub Actions / GitLab CI
Secrets Management:  AWS Secrets Manager or GitHub Secrets
Cloud Compute:       AWS ECS, Lambda (optional) or Heroku
Database Hosting:    AWS RDS (PostgreSQL) or Heroku PostgreSQL
File Storage:        AWS S3 or Local (development)
Monitoring:          DataDog 7.0+ or Sentry 23.0+
Logging:             ELK Stack (optional) or CloudWatch
Email Delivery:      SendGrid 6.0+
SMS Delivery:        Twilio 3.8+
API Management:      AWS API Gateway (optional)
```

---

## 🗄️ DATABASE ARCHITECTURE

### Database: PostgreSQL 14+

#### Connection Details
```yaml
Host:               localhost (dev) / RDS endpoint (prod)
Port:               5432
Database:           nemicare_dev / nemicare_prod
SSL:                Required in production (sslmode=require)
Pool Size:          Min: 10, Max: 100
Connection Timeout: 10 seconds
Idle Timeout:       30 seconds
Statement Timeout:  60 seconds (prevent runaway queries)
```

#### Schema Design (15 Tables)

**Normalization**: 3NF (Third Normal Form)  
**Primary Keys**: All INT SERIAL (auto-increment)  
**Foreign Keys**: Enforced at database level  
**Indexes**: Composite indexes for common queries  
**Soft Deletes**: deleted_at timestamp for compliance

### Table Definitions (Prisma Schema)

```prisma
// === MULTI-TENANCY ===
model Company {
  id                  Int      @id @default(autoincrement())
  name                String   @unique
  legalName           String?
  ein                 String?
  website             String?
  phone               String?
  address             String?
  city                String?
  state               String?
  zip                 String?
  country             String   @default("USA")
  timezone            String   @default("America/Chicago")
  active              Boolean  @default(true)
  
  // Relations
  facilities          Facility[]
  users               User[]
  roles               Role[]
  leads               Lead[]
  residents           Resident[]
  visits              Visit[]
  billings            Billing[]
  chartings           Charting[]
  documents           Document[]
  employees           Employee[]
  timesheets          Timesheet[]
  auditLogs           AuditLog[]
  medicaidConfigs     MedicaidConfig[]
  integrationLogs     IntegrationLog[]
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?
  
  @@index([name])
  @@index([createdAt])
}

// === FACILITY ===
model Facility {
  id                  Int      @id @default(autoincrement())
  companyId           Int
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  name                String
  facilityType        FacilityType // ALF, ADH, HOME_CARE, MIXED
  licenseNumber       String?
  licenseExpiry       DateTime?
  address             String
  city                String
  state               String
  zip                 String
  phone               String?
  email               String?
  
  // Capacity
  capacityAlf         Int      @default(0)
  capacityAdh         Int      @default(0)
  capacityHomeCare    Int      @default(0)
  
  // Certification
  medicaidApproved    Boolean  @default(false)
  stateLicenseNumber  String?
  npiNumber           String?
  
  active              Boolean  @default(true)
  brandingLogoUrl     String?
  
  // Relations
  users               User[]
  rooms               Room[]
  leads               Lead[]
  residents           Resident[]
  visits              Visit[]
  billings            Billing[]
  chartings           Charting[]
  documents           Document[]
  employees           Employee[]
  medicaidConfigs     MedicaidConfig[]
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?
  
  @@unique([companyId, name])
  @@index([companyId])
  @@index([state, city])
}

// === AUTHENTICATION & AUTHORIZATION ===
model Role {
  id                  Int      @id @default(autoincrement())
  companyId           Int?
  company             Company? @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  name                String
  description         String?
  permissions         Json     // Array of permission keys
  active              Boolean  @default(true)
  
  users               User[]
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@unique([companyId, name])
}

model User {
  id                  Int      @id @default(autoincrement())
  companyId           Int
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  facilityId          Int?
  facility            Facility? @relation(fields: [facilityId], references: [id], onDelete: SetNull)
  
  email               String   @unique
  firstName           String
  lastName            String
  phone               String?
  
  // Authentication
  passwordHash        String
  passwordResetToken  String?
  passwordResetExpires DateTime?
  otpSecure           String?
  otpEnabled          Boolean  @default(false)
  
  // Session
  lastLogin           DateTime?
  loginAttempts       Int      @default(0)
  accountLocked       Boolean  @default(false)
  accountLockedUntil  DateTime?
  
  active              Boolean  @default(true)
  
  // Relations
  roleId              Int
  role                Role     @relation(fields: [roleId], references: [id])
  leads               Lead[]   @relation("AssignedLeads")
  residents           Resident[] @relation("NextOfKin")
  caseManagerFor      Resident[] @relation("CaseManager")
  charting            Charting[] @relation("SignedBy")
  documents           Document[] @relation("SignedBy")
  timesheets          Timesheet[] @relation("ApprovedBy")
  auditLogs           AuditLog[]
  employee            Employee?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?
  
  @@index([companyId])
  @@index([facilityId])
  @@index([email])
}

// === LEAD MANAGEMENT (CRM) ===
model Lead {
  id                  Int      @id @default(autoincrement())
  companyId           Int
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  facilityId          Int
  facility            Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  
  firstName           String
  lastName            String
  phone               String?
  email               String?
  dob                 DateTime?
  gender              Gender?
  
  // Lead source & qualification
  source              LeadSource
  referredBy          String?
  status              LeadStatus
  qualificationScore  Int      @default(0)
  qualifiedAt         DateTime?
  
  // Assignment
  assignedToId        Int?
  assignedTo          User?    @relation("AssignedLeads", fields: [assignedToId], references: [id], onDelete: SetNull)
  
  // Service interest
  interestedIn        ServiceType?
  requiredServices    Json?    // Array
  
  // Activity tracking
  lastContactDate     DateTime?
  nextFollowupDate    DateTime?
  notes               String?
  
  // Conversion
  convertedToResidentId Int?
  resident            Resident? @relation("ConvertedLead", fields: [convertedToResidentId], references: [id], onDelete: SetNull)
  convertedAt         DateTime?
  
  active              Boolean  @default(true)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?
  
  @@index([companyId])
  @@index([facilityId])
  @@index([assignedToId])
  @@index([status])
  @@index([qualifiedAt])
}

// === RESIDENT MANAGEMENT ===
model Resident {
  id                  Int      @id @default(autoincrement())
  companyId           Int
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  facilityId          Int
  facility            Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  
  // Demographics
  firstName           String
  lastName            String
  middleName          String?
  dob                 DateTime
  gender              Gender
  ssn                 String?  // Encrypted
  
  // Contact
  phone               String?
  email               String?
  address             String?
  city                String?
  state               String?
  zip                 String?
  
  // Emergency contact
  emergencyContactName String?
  emergencyContactPhone String?
  emergencyContactRelationship String?
  
  // Medical
  allergies           Json?    // Array
  medicalConditions   Json?    // Array
  currentMedications  Json?    // Array
  primaryPhysicianName String?
  primaryPhysicianPhone String?
  
  // Lifecycle
  admissionDate       DateTime
  admissionType       AdmissionType
  status              ResidentStatus
  dischargeDate       DateTime?
  dischargeReason     String?
  
  // Billing
  billingType         BillingType
  medicaidNumber      String?
  insuranceCompany    String?
  insurancePolicyNumber String?
  
  // Service
  primaryService      ServiceType
  visitFrequency      Int      @default(1)
  
  // Relations
  nextOfKinId         Int?
  nextOfKin           User?    @relation("NextOfKin", fields: [nextOfKinId], references: [id], onDelete: SetNull)
  
  caseManagerId       Int?
  caseManager         User?    @relation("CaseManager", fields: [caseManagerId], references: [id], onDelete: SetNull)
  
  createdById         Int
  createdBy           User?    @relation(fields: [createdById], references: [id])
  
  convertedFromLead   Lead?    @relation("ConvertedLead")
  visits              Visit[]
  billings            Billing[]
  chartings           Charting[]
  documents           Document[]
  
  notes               String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?
  
  @@index([companyId])
  @@index([facilityId])
  @@index([status])
  @@index([admissionDate])
  @@index([ssn])
}

// === ROOM/BED MANAGEMENT (ALF) ===
model Room {
  id                  Int      @id @default(autoincrement())
  facilityId          Int
  facility            Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  
  roomNumber          String
  description         String?
  capacity            Int      @default(1)
  status              RoomStatus @default(AVAILABLE)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@unique([facilityId, roomNumber])
}

// === VISIT & SCHEDULING ===
model Visit {
  id                  Int      @id @default(autoincrement())
  companyId           Int
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  facilityId          Int
  facility            Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  residentId          Int
  resident            Resident @relation(fields: [residentId], references: [id], onDelete: Cascade)
  
  // Scheduling
  scheduledDate       DateTime
  scheduledTimeStart  DateTime?
  scheduledTimeEnd    DateTime?
  durationMinutes     Int?
  
  // Actual attendance
  actualCheckinTime   DateTime?
  actualCheckoutTime  DateTime?
  attended            Boolean?
  
  // Details
  visitType           VisitType
  serviceCode         String?  // CPT code
  
  // Assignment
  assignedStaffId     Int?
  assignedStaff       User?    @relation(fields: [assignedStaffId], references: [id])
  
  // Status
  status              VisitStatus
  cancellationReason  String?
  notes               String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([residentId])
  @@index([scheduledDate])
  @@index([facilityId])
  @@index([status])
}

// === BILLING ===
model Billing {
  id                  Int      @id @default(autoincrement())
  companyId           Int
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  facilityId          Int
  facility            Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  residentId          Int
  resident            Resident @relation(fields: [residentId], references: [id], onDelete: Cascade)
  
  // Period
  billingPeriodStart  DateTime
  billingPeriodEnd    DateTime
  
  // Amounts
  totalVisits         Int      @default(0)
  totalUnits          Decimal  @default(0) // 15-min units
  unitRate            Decimal
  subtotal            Decimal
  tax                 Decimal  @default(0)
  adjustments         Decimal  @default(0)
  totalAmount         Decimal
  
  // Type
  billingType         BillingType
  splitConfig         Json?    // Multiple payers
  
  // Payment
  status              BillingStatus
  invoiceNumber       String?  @unique
  sentDate            DateTime?
  paidDate            DateTime?
  amountPaid          Decimal  @default(0)
  paymentMethod       String?
  
  // Medicaid
  paNumber            String?  // Prior Auth
  
  notes               String?
  createdById         Int
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([residentId])
  @@index([billingPeriodStart])
  @@index([status])
  @@index([invoiceNumber])
}

// === CLINICAL CHARTING ===
model Charting {
  id                  Int      @id @default(autoincrement())
  companyId           Int
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  facilityId          Int
  facility            Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  residentId          Int
  resident            Resident @relation(fields: [residentId], references: [id], onDelete: Cascade)
  
  chartDate           DateTime
  chartTime           DateTime
  
  chartType           ChartType
  content             String   // Rich text
  vitals              Json?    // { bp, heart_rate, temperature, etc }
  observations        String?
  
  signedById          Int?
  signedBy            User?    @relation("SignedBy", fields: [signedById], references: [id], onDelete: SetNull)
  signatureDate       DateTime?
  
  status              ChartingStatus
  
  createdById         Int
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([residentId])
  @@index([chartDate])
  @@index([chartType])
}

// === DOCUMENTS & E-SIGNATURES ===
model Document {
  id                  Int      @id @default(autoincrement())
  companyId           Int
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  facilityId          Int
  facility            Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  residentId          Int?
  resident            Resident? @relation(fields: [residentId], references: [id], onDelete: SetNull)
  
  documentType        DocumentType
  title               String
  version             Int      @default(1)
  
  fileUrl             String   // S3 or local
  fileSize            Int?
  mimeType            String?
  
  status              DocumentStatus
  requiresSignature   Boolean  @default(false)
  
  signedById          Int?
  signedBy            User?    @relation("SignedBy", fields: [signedById], references: [id], onDelete: SetNull)
  signedAt            DateTime?
  signatureProvider   String?  // DocuSign, Adobe Sign
  signatureEnvelopeId String?
  
  createdById         Int
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([residentId])
  @@index([documentType])
  @@index([status])
}

// === EMPLOYEE & PAYROLL ===
model Employee {
  id                  Int      @id @default(autoincrement())
  companyId           Int
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  facilityId          Int
  facility            Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  userId              Int      @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  employeeIdNumber    String?
  positionTitle       String?
  department          String?
  employmentType      EmploymentType
  hireDate            DateTime
  terminationDate     DateTime?
  
  // Licensing
  licenseType         String?
  licenseNumber       String?
  licenseExpiry       DateTime?
  
  // Compensation
  baseSalary          Decimal?
  hourlyRate          Decimal?
  payFrequency        PayFrequency
  
  ssn                 String?  // Encrypted
  
  status              EmploymentStatus
  
  timesheets          Timesheet[]
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([facilityId])
  @@index([employeeIdNumber])
  @@index([status])
}

model Timesheet {
  id                  Int      @id @default(autoincrement())
  companyId           Int
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  facilityId          Int
  facility            Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  employeeId          Int
  employee            Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  
  periodStart         DateTime
  periodEnd           DateTime
  
  regularHours        Decimal  @default(0)
  overtimeHours       Decimal  @default(0)
  paidLeaveHours      Decimal  @default(0)
  unpaidLeaveHours    Decimal  @default(0)
  totalHours          Decimal  @default(0)
  
  status              TimesheetStatus
  submittedById       Int?
  submittedAt         DateTime?
  approvedById        Int?
  approvedBy          User?    @relation("ApprovedBy", fields: [approvedById], references: [id], onDelete: SetNull)
  approvedAt          DateTime?
  
  notes               String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([employeeId])
  @@index([periodStart, periodEnd])
}

// === AUDIT & COMPLIANCE ===
model AuditLog {
  id                  Int      @id @default(autoincrement())
  companyId           Int
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  userId              Int?
  user                User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  actionType          ActionType
  entityType          String
  entityId            Int?
  
  oldValues           Json?
  newValues           Json?
  
  ipAddress           String?
  userAgent           String?
  
  timestamp           DateTime @default(now())
  
  @@index([userId])
  @@index([entityType, entityId])
  @@index([timestamp])
}

// === INTEGRATIONS ===
model MedicaidConfig {
  id                  Int      @id @default(autoincrement())
  companyId           Int
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  facilityId          Int
  facility            Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  
  state               String
  programName         String?
  paRequired          Boolean  @default(true)
  paLeadTimeDays      Int      @default(5)
  
  apiUrl              String?
  apiKey              String?  // Encrypted
  username            String?
  passwordEncrypted   String?
  
  serviceCodes        Json?    // CPT/ICD mapping
  
  autoSubmitClaims    Boolean  @default(false)
  claimSubmissionFrequency String @default("MONTHLY")
  
  active              Boolean  @default(true)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@unique([companyId, facilityId])
}

model IntegrationLog {
  id                  Int      @id @default(autoincrement())
  companyId           Int
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  integrationType     IntegrationType
  status              IntegrationStatus
  
  requestBody         Json?
  responseBody        Json?
  errorMessage        String?
  
  retryCount          Int      @default(0)
  nextRetry           DateTime?
  
  timestamp           DateTime @default(now())
  
  @@index([integrationType])
  @@index([status])
  @@index([timestamp])
}

// === ENUMS ===
enum FacilityType {
  ALF
  ADH
  HOME_CARE
  MIXED
}

enum LeadStatus {
  PROSPECT
  QUALIFIED
  DOCUMENTATION
  VISIT_SCHEDULED
  CONVERTING
  CONVERTED
  NURTURE
  NOT_QUALIFIED
  CLOSED
}

enum LeadSource {
  WEBSITE
  REFERRAL
  CALL
  FAMILY
  ADVERTISEMENT
  OTHER
}

enum ServiceType {
  ALF
  ADH
  HOME_CARE
  MC
  IL
}

enum Gender {
  M
  F
  OTHER
  PREFER_NOT_SAY
}

enum ResidentStatus {
  ACTIVE
  ON_HOLD
  DISCHARGED
  DECEASED
}

enum AdmissionType {
  NEW_ARRIVAL
  READMISSION
  TRANSFER
}

enum BillingType {
  MEDICAID
  PRIVATE_PAY
  INSURANCE
  MIXED
}

enum BillingStatus {
  DRAFT
  SUBMITTED
  APPROVED
  SENT
  PAID
  OVERDUE
}

enum VisitType {
  MEDICAL
  SOCIAL
  THERAPY
  ACTIVITY
  MEAL
  OTHER
}

enum VisitStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum ChartType {
  PROGRESS_NOTE
  DAILY_LOG
  ASSESSMENT
  CARE_PLAN
  INCIDENT_REPORT
}

enum ChartingStatus {
  DRAFT
  COMPLETED
  SIGNED
  ARCHIVED
}

enum DocumentType {
  ADMISSION_FORM
  CARE_PLAN
  CONSENT
  CONTRACT
  ASSESSMENT
  RELEASE
  OTHER
}

enum DocumentStatus {
  DRAFT
  SENT_FOR_SIGNATURE
  SIGNED
  EXECUTED
  ARCHIVED
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
}

enum EmploymentStatus {
  ACTIVE
  ON_LEAVE
  TERMINATED
}

enum PayFrequency {
  WEEKLY
  BIWEEKLY
  MONTHLY
}

enum TimesheetStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
  PAID
}

enum RoomStatus {
  AVAILABLE
  OCCUPIED
  RESERVED
  MAINTENANCE
}

enum ActionType {
  CREATE
  READ
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  EXPORT
}

enum IntegrationType {
  MEDICAID
  VERIDA
  STRIPE
  SQUARE
  ESIGN
  EMAIL
  SMS
}

enum IntegrationStatus {
  SUCCESS
  FAILURE
  RETRY
  PENDING
}
```

### Database Migrations

```bash
# Initialize Prisma
npx prisma init

# Create migrations
npx prisma migrate dev --name init

# Apply migrations to production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# View database in prisma studio
npx prisma studio
```

---

## 🔌 API ARCHITECTURE

### RESTful Design Principles

#### Base Endpoint
```
https://api.nemicare.io/v1
```

#### Standard Request/Response Format

**Request Header**:
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json",
  "X-Request-ID": "<UNIQUE_REQUEST_ID>"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": 200,
  "data": { ... },
  "meta": {
    "timestamp": "2026-04-04T10:30:00Z",
    "requestId": "req-123abc"
  }
}
```

**Error Response (4xx/5xx)**:
```json
{
  "success": false,
  "status": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  },
  "meta": {
    "timestamp": "2026-04-04T10:30:00Z",
    "requestId": "req-123abc"
  }
}
```

#### Pagination
```
GET /residents?page=1&limit=20&sort=createdAt&order=desc
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "total": 500,
    "page": 1,
    "limit": 20,
    "pages": 25
  }
}
```

#### Filtering
```
GET /residents?status=ACTIVE&facilityId=5&billingType=MEDICAID
```

### 80+ API Endpoints (Overview)

#### Authentication (7 endpoints)
```
POST   /auth/register              Register new user
POST   /auth/login                 Login with email/password
POST   /auth/otp/send              Send OTP
POST   /auth/otp/verify            Verify OTP code
POST   /auth/password/reset-request Request password reset
POST   /auth/password/reset        Complete password reset
POST   /auth/logout                Logout user
```

#### Leads (12 endpoints)
```
POST   /leads                      Create lead
GET    /leads                      List leads (with filters, pagination)
GET    /leads/:id                  Get lead detail
PUT    /leads/:id                  Update lead
DELETE /leads/:id                  Delete lead
POST   /leads/:id/convert          Convert lead to resident
POST   /leads/:id/assign           Assign lead to staff
POST   /leads/:id/score            Recalculate lead score
GET    /leads/import               Bulk import (CSV)
POST   /leads/export               Bulk export (CSV)
POST   /leads/:id/follow-up        Schedule follow-up
```

#### Residents (15 endpoints)
```
POST   /residents                  Create resident
GET    /residents                  List residents
GET    /residents/:id              Get resident detail
PUT    /residents/:id              Update resident
DELETE /residents/:id              Delete resident
POST   /residents/:id/admit        Admit new resident
POST   /residents/:id/discharge    Discharge resident
POST   /residents/:id/on-hold      Put on hold
POST   /residents/:id/reactivate   Reactivate
GET    /residents/:id/medical-history Get med history
POST   /residents/:id/medical-history Create entry
GET    /residents/:id/documents    Get resident documents
GET    /residents/:id/visits       Get resident visits
POST   /residents/import           Bulk import
POST   /residents/export           Bulk export
```

#### Visits & Scheduling (10 endpoints)
```
POST   /visits                     Create visit
GET    /visits                     List visits
GET    /visits/:id                 Get visit detail
PUT    /visits/:id                 Update visit
DELETE /visits/:id                 Delete visit
POST   /visits/:id/checkin         Check-in (staff)
POST   /visits/:id/checkout        Check-out (staff)
GET    /visits/calendar/:date      Get calendar for date
POST   /visits/conflict-check      Check for conflicts
GET    /visits/report/utilization  Utilization report
```

#### Billing (13 endpoints)
```
POST   /billing                    Create bill
GET    /billing                    List bills
GET    /billing/:id                Get bill detail
PUT    /billing/:id                Update bill
DELETE /billing/:id                Delete bill
POST   /billing/:id/submit         Submit for approval
POST   /billing/:id/approve        Approve bill
POST   /billing/:id/send           Send invoice
POST   /billing/:id/record-payment Record payment
GET    /billing/resident/:id       Get resident bills
GET    /billing/report/aging       Aging analysis report
GET    /billing/report/revenue     Revenue report
POST   /billing/calculate          Calculate bill amount
```

#### Clinical & Charting (8 endpoints)
```
POST   /charting                   Create chart entry
GET    /charting                   List chart entries
GET    /charting/:id               Get chart detail
PUT    /charting/:id               Update chart
DELETE /charting/:id               Delete chart
POST   /charting/:id/sign          E-sign chart
GET    /charting/resident/:id      Get resident charts
POST   /charting/vitals            Record vitals
```

#### Documents & E-Signatures (8 endpoints)
```
POST   /documents                  Upload document
GET    /documents                  List documents
GET    /documents/:id              Get document
DELETE /documents/:id              Delete document
POST   /documents/:id/send-signature Send for e-signature
GET    /documents/:id/signature-status Get signature status
POST   /documents/:id/download     Download signed doc
POST   /documents/templates        Get templates
```

#### Users & RBAC (11 endpoints)
```
POST   /users                      Create user
GET    /users                      List users
GET    /users/:id                  Get user profile
PUT    /users/:id                  Update user
DELETE /users/:id                  Delete user
POST   /users/:id/password-reset   Reset user password
POST   /users/:id/enable-2fa       Enable 2FA
POST   /users/:id/deactivate       Deactivate user
GET    /roles                      Get available roles
POST   /roles                      Create custom role
PUT    /roles/:id                  Update role
```

#### Facilities (8 endpoints)
```
POST   /facilities                 Create facility
GET    /facilities                 List facilities
GET    /facilities/:id             Get facility detail
PUT    /facilities/:id             Update facility
DELETE /facilities/:id             Delete facility
POST   /facilities/:id/census      Get current census
GET    /facilities/:id/capacity    Check capacity
POST   /facilities/:id/integrations Configure integrations
```

#### Employees & HRMS (12 endpoints)
```
POST   /employees                  Create employee
GET    /employees                  List employees
GET    /employees/:id              Get employee detail
PUT    /employees/:id              Update employee
DELETE /employees/:id              Delete employee
POST   /timesheets                 Create timesheet
GET    /timesheets                 List timesheets
PUT    /timesheets/:id             Update timesheet
POST   /timesheets/:id/approve     Approve timesheet
GET    /employees/:id/schedule     Get work schedule
POST   /employees/:id/schedule     Create shift
GET    /payroll/generate           Generate payroll
```

#### Audit & Compliance (5 endpoints)
```
GET    /audit-logs                 Get audit logs
GET    /audit-logs/export          Export audit logs (compliance)
POST   /data-retention-policy      Configure data retention
GET    /hipaa/compliance-status    HIPAA compliance status
POST   /hipaa/audit-report         Generate audit report
```

---

## 🔒 Security Architecture

### Authentication Flow

```
1. User submits email + password
   ↓
2. Validate credentials (bcrypt compare)
   ↓
3. If invalid → lock after 5 attempts
   ↓
4. If valid → Generate JWT token (15min expiry)
   ↓
5. Return access_token + refresh_token (7day)
   ↓
6. Client stores in memory (not localStorage)
   ↓
7. Include in Authorization header on all requests
```

### JWT Payload
```json
{
  "sub": "<USER_ID>",
  "email": "<EMAIL>",
  "companyId": "<COMPANY_ID>",
  "facilityId": "<FACILITY_ID>",
  "roleId": "<ROLE_ID>",
  "permissions": [...],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Authorization Middleware

```typescript
// Example: Check RBAC permission
const authotize = (requiredPermission: string) => {
  return (req, res, next) => {
    const user = req.user; // From JWT
    const role = user.role;
    
    if (!role.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: 'You do not have permission for this action'
      });
    }
    
    next();
  };
};

// Usage
router.put('/residents/:id', authorize('EDIT_RESIDENT'), editResident);
```

---

## 🚀 Development Workflow

### Project Structure

```
nemicare-backend/
├── src/
│   ├── config/              # Configuration (database, env, etc)
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts
│   │   ├── rbac.ts
│   │   ├── errorHandler.ts
│   │   └── logger.ts
│   ├── controllers/         # Request handlers
│   │   ├── authController.ts
│   │   ├── leadController.ts
│   │   ├── residentController.ts
│   │   └── ...
│   ├── services/            # Business logic
│   │   ├── authService.ts
│   │   ├── leadService.ts
│   │   ├── residentService.ts
│   │   ├── billingService.ts
│   │   └── ...
│   ├── routes/              # API routes
│   │   ├── auth.routes.ts
│   │   ├── leads.routes.ts
│   │   ├── residents.routes.ts
│   │   └── index.ts
│   ├── utils/               # Utilities
│   │   ├── validators.ts
│   │   ├── emailService.ts
│   │   ├── errorResponses.ts
│   │   └── ...
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── server.ts            # Express app setup
│   └── index.ts             # Entry point
├── prisma/
│   ├── schema.prisma        # Prisma ORM definition
│   └── migrations/          # Database migrations
├── tests/                   # Test files
│   ├── auth.test.ts
│   ├── leads.test.ts
│   └── ...
├── .env.example             # Example env variables
├── docker-compose.yml       # Docker setup
├── Dockerfile               # Container definition
├── package.json
├── tsconfig.json
└── README.md

nemicare-frontend/
├── src/
│   ├── components/          # React components
│   │   ├── common/          # Reusable components
│   │   ├── layouts/         # Layout wrappers
│   │   ├── forms/           # Form components
│   │   ├── tables/          # Table components
│   │   └── portals/         # Portal-specific
│   │       ├── facility/
│   │       ├── family/
│   │       ├── hrms/
│   │       └── superAdmin/
│   ├── pages/               # Page components
│   ├── state/               # Redux slices
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API service layer
│   ├── utils/               # Utilities
│   ├── styles/              # Global styles
│   ├── types/               # TypeScript types
│   ├── App.tsx              # Main app component
│   └── index.tsx            # Entry point
├── tests/                   # Test files
├── public/                  # Static assets
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── vite.config.ts
├── package.json
└── README.md
```

---

**Document Version**: 1.0  
**Status**: READY FOR PHASE 1 IMPLEMENTATION  
**Next Document**: API Specifications (OpenAPI 3.0)
