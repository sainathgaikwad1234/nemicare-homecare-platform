# Data Models

## Prisma Schema — PostgreSQL

| Model | Key Fields | Relations | HIPAA/PHI | Status |
|-------|-----------|-----------|-----------|--------|
| Company | name, legalName, ein, address, timezone | → Facility[], User[], Lead[], Resident[] | No | Active |
| Facility | name, facilityType (ALF/ADH/HOME_CARE/MIXED), licenseNumber, capacity, npiNumber | → Company, User[], Room[], Lead[], Resident[] | No | Active |
| User | email (unique), passwordHash, loginAttempts, accountLocked | → Company, Facility?, Role, Lead[], Resident[] | Yes (email) | Active |
| Role | name, permissions (JSON array) | → Company?, User[] | No | Active |
| Lead | firstName, lastName, phone, email, dob, gender, source, status, qualificationScore | → Company, Facility, User (assignedTo), Resident? | Yes | Active |
| Resident | firstName, lastName, dob, ssn, allergies, medicalConditions, currentMedications, admissionDate, billingType, medicaidNumber | → Company, Facility, User (nextOfKin, caseManager), Visit[], Billing[], Charting[], Document[] | Yes (SSN, medical) | Active |
| Room | roomNumber, capacity, status (AVAILABLE/OCCUPIED/RESERVED/MAINTENANCE) | → Facility | No | Schema only |
| Visit | scheduledDate, visitType, serviceCode (CPT), attended, actualCheckin/out | → Company, Facility, Resident | Yes | Schema only |
| Billing | billingPeriod, totalAmount, billingType, invoiceNumber, paNumber (Prior Auth) | → Company, Facility, Resident | Yes | Schema only |
| Charting | chartDate, chartType, content, vitals (JSON), signedBy, signatureDate | → Company, Facility, Resident, User | Yes (clinical) | Schema only |
| Document | documentType, fileUrl, requiresSignature, signedBy, signatureEnvelopeId | → Company, Facility, Resident?, User | Yes | Schema only |
| Employee | employeeIdNumber, positionTitle, licenseType, baseSalary, hourlyRate | → Company, Facility, User (1:1), Timesheet[] | Yes (PII) | Schema only |
| Timesheet | periodStart/End, regularHours, overtimeHours, status | → Company, Facility, Employee, User (approvedBy) | No | Schema only |
| AuditLog | actionType, entityType, entityId, oldValues, newValues, ipAddress | → Company, User? | No (metadata) | Active |
| MedicaidConfig | state, paRequired, apiUrl, serviceCodes, autoSubmitClaims | → Company, Facility | Yes (credentials) | Schema only |
| IntegrationLog | integrationType, status, requestBody, responseBody, errorMessage | → Company | No | Schema only |

## Key Enums

| Enum | Values |
|------|--------|
| FacilityType | ALF, ADH, HOME_CARE, MIXED |
| LeadStatus | PROSPECT, QUALIFIED, DOCUMENTATION, VISIT_SCHEDULED, CONVERTING, CONVERTED, NURTURE, NOT_QUALIFIED, CLOSED |
| LeadSource | WEBSITE, REFERRAL, CALL, FAMILY, ADVERTISEMENT, OTHER |
| ResidentStatus | ACTIVE, ON_HOLD, DISCHARGED, DECEASED |
| BillingType | MEDICAID, PRIVATE_PAY, INSURANCE, MIXED |
| ServiceType | ALF, ADH, HOME_CARE, MC, IL |
| VisitType | MEDICAL, SOCIAL, THERAPY, ACTIVITY, MEAL, OTHER |
| ChartType | PROGRESS_NOTE, DAILY_LOG, ASSESSMENT, CARE_PLAN, INCIDENT_REPORT |
| ActionType | CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT |

## Soft Delete Pattern
- Models with `deletedAt` (nullable DateTime): Company, Facility, User, Lead, Resident
- All queries filter `deletedAt: null`
- Delete operations set `deletedAt = now()` instead of hard delete
