# Compliance & Security Map

## HIPAA Applicability: YES
This is a healthcare application managing PHI (Protected Health Information) for ALF/ADH/Home Care residents.

## PHI Fields Identified

| Model | PHI Fields | Risk Level |
|-------|-----------|------------|
| Resident | ssn, dob, allergies, medicalConditions, currentMedications, medicaidNumber, insurancePolicyNumber | High |
| Lead | dob, email, phone | Medium |
| User | email, phone | Medium |
| Charting | content (clinical notes), vitals | High |
| Billing | medicaidNumber, paNumber | Medium |
| MedicaidConfig | apiKey, passwordEncrypted | High (credentials) |
| Vital | temperature, bloodPressure, heartRate, oxygenSaturation, weight | High |
| Allergy | allergen, reaction, severity | High |
| Medication | name, dosage, prescriber | High |
| CarePlan | problem, goal, approach | High |
| ProgressNote | findings, interventions | High |
| PainScale | painLevel, location, intervention | High |
| FaceToFaceNote | findings | High |
| Incident | description, actionTaken, witnesses | High |
| Attendance | checkInTime, checkOutTime (tracks presence) | Medium |
| DischargeRecord | dischargeReason, overallBehavior, medicationCompliance, financials | High |
| PatientSetup | all step JSON data (case, documents, billing, assessment) | High |
| Visit | serviceCode (CPT codes) | Medium |

## HIPAA Safeguards Check

| Safeguard | Status | Notes |
|-----------|--------|-------|
| Audit Logging | Implemented | Every API request logged (userId, action, entity, IP, user-agent) |
| Access Controls (RBAC) | Implemented | Permission-based with role → permissions JSON |
| Authentication | Implemented | JWT with account lockout |
| Multi-tenancy Isolation | Implemented | All queries scoped by companyId |
| Encryption at Rest | NOT implemented | SSN field comment: "would be encrypted in production" |
| Encryption in Transit | Partial | HTTPS not configured in dev (would be at deployment) |
| Session Timeout | Configured | JWT 15-min expiry, refresh 7-day |
| Password Policy | Partial | Min 8 chars, bcrypt hash; no complexity/expiry enforcement |
| MFA | NOT implemented | Feature flag exists (`HIPAA_MFA_REQUIRED=false`) |
| Data Retention | Configured | 7-year audit retention in env config |
| Breach Notification | NOT implemented | No mechanism |
| BAA (Business Associate Agreement) | N/A | Application level |

## Security Middleware Stack (Order)

1. `helmet()` — Security headers
2. `cors()` — Origin whitelist
3. `express.json()` — Body parsing (10mb limit)
4. `requestMetadata` — Request ID + timestamp
5. `loggerMiddleware` — Winston logging
6. `rateLimit` — 100 req/15min
7. `auditLogger` — HIPAA audit trail

## Feature Flags (Security-related)

| Flag | Default | Purpose |
|------|---------|---------|
| FEATURE_HIPAA_AUDIT_LOGGING | true | Audit trail |
| FEATURE_HIPAA_ENCRYPTION | true | Field-level encryption |
| FEATURE_HIPAA_ACCESS_CONTROLS | true | RBAC enforcement |
| HIPAA_MFA_REQUIRED | false | Multi-factor auth |
| HIPAA_SESSION_TIMEOUT_MINUTES | 30 | Session timeout |
| HIPAA_PASSWORD_EXPIRY_DAYS | 90 | Password rotation |

## Critical Gaps for Production

1. **SSN/PHI encryption at rest** — Not implemented, only commented as TODO
2. **MFA** — Feature flag exists but not implemented
3. **Password complexity** — Only min length, no upper/lower/special requirements
4. **HTTPS/TLS** — Not configured in application (relies on infrastructure)
5. **Refresh token rotation** — Same refresh token returned on refresh (should rotate)
6. **Token blacklisting** — No mechanism to invalidate tokens on logout
