# Gap Analysis: User Stories vs Built Features
## Generated: 2026-04-05
## Total Active Stories: 151 (Removed stories excluded)

### Legend
- ✅ = Fully built and matching Figma
- 🔶 = Partially built (UI exists but incomplete/not matching Figma)
- ❌ = Not built
- 🔧 = Stub only (correct shell, no functionality)

---

## 1. LEAD MANAGEMENT / CRM (32 stories)

### CRM - Lead Management (10 stories)
| Row | Title | Status | Figma |
|-----|-------|--------|-------|
| 11 | Lead Intake (capture source) | ✅ Source chips in Add Lead form | Leads.png |
| 12 | Assign service type (ADH/ALF) | ✅ ADH/ALF dropdown on New Lead button | Leads.png |
| 13 | Lead Assignment (to sales team) | 🔶 Lead Owner dropdown exists but no team member API | Add New Lead.png |
| 19 | Add Lead | ✅ 3-section modal form | Add New Lead.png |
| 20 | Lead List | ✅ Table with Lead ID, Phone, all columns | Leads.png |
| 21 | Import & Export Lead List | 🔧 Import icon exists, no functionality | Leads.png |
| 22 | Add Filter on lead list | 🔧 Filter icon exists, no filter panel | Filter.png |
| 23 | Edit Lead | ✅ Edit dialog works | - |
| 24 | Lead Activity (view timeline) | ✅ All Activities tab with timeline | Activity.png |
| 25 | Reject Lead with reason | ✅ Free-text reject modal | Modal.png |

### CRM - Communication (6 stories)
| Row | Title | Status | Figma |
|-----|-------|--------|-------|
| 26 | Call Lead (call type, notes) | 🔧 Circle icon in sidebar, no Start Call modal built | Start Call.png |
| 27 | AI Call Summary | 🔧 Call Summary tab exists, no AI integration | Call Summary.png |
| 28 | SMS Lead | 🔧 Circle icon in sidebar, no chat built | Start Chat.png |
| 29 | AI SMS Summary | 🔧 SMS Summary tab exists, no AI integration | ChatSummary.png |
| 30 | Private Notes | ✅ Notes modal + Notes tab with private flag | Notes.png |
| 31 | Public Notes | ✅ Notes modal + Notes tab | Notes.png |

### CRM - Visit Management (6 stories)
| Row | Title | Status | Figma |
|-----|-------|--------|-------|
| 32 | Schedule Facility Tour Visit | 🔧 Schedule tab stub, no Schedule Visit modal | Schedule Visit.png |
| 33 | View Visit - Calendar view | 🔧 Schedule tab with calendar controls, static | notes-2/3.png |
| 34 | View Visit - List View | ❌ Not built | notes-4/5.png |
| 35 | Edit Scheduled Visit | ❌ Not built | - |
| 36 | Filter Scheduled Visit | ❌ Not built | Filter.png |
| 37 | Visit Notes | ❌ Not built | Post Visit Notes.png |

### CRM - Rate & Pricing (2 stories)
| Row | Title | Status | Figma |
|-----|-------|--------|-------|
| 38 | Rate Card (Private Pay) | 🔧 "Send Rate Card" button, no rate card display | ALF Rate Card.png |
| 39 | Rate Card (Medicaid) | ❌ Not built | ALF Rate Card-1.png |

### CRM - Documentation (5 stories)
| Row | Title | Status | Figma |
|-----|-------|--------|-------|
| 43 | View & send documents | ❌ Planned for Document Management module | - |
| 44 | Document Status | ❌ Not built | - |
| 45 | Resend Document | ❌ Not built | - |
| 46 | View and Sign Documents | ❌ Not built | Container-7.png (signature) |
| 47 | Remind Signature | ❌ Not built | - |

### CRM - ADH Lead Management (1 story)
| Row | Title | Status | Figma |
|-----|-------|--------|-------|
| 48 | View Qualification Score | ❌ Not built | - |

---

## 2. RESIDENT - INPROGRESS (15 stories)

### ADH, ALF: (If Medicaid) Resident - InProgress (4 stories)
| Row | Title | Status | Figma |
|-----|-------|--------|-------|
| 40 | Select Case Agency | ✅ 3x2 grid with agency cards + status states | Send to Case Manager.png |
| 41 | Referral Form Notes | 🔧 No notes field on agency step | - |
| 42 | Select CM and send documents | 🔶 CM selection exists, doc sending partial | Send to Case Manager-4/5/6/7.png |
| 50 | Send Verida request | 🔶 Transportation form exists (ADH step) | Container.png |

### Resident - InProgress (10 stories)
| Row | Title | Status | Figma |
|-----|-------|--------|-------|
| 51 | Add CM to Verida | ❌ Not built | - |
| 52 | Escalation Capability | ❌ Not built | - |
| 53 | Add State-provided Details | ❌ Not built | - |
| 54 | View Frequency history | ❌ Not built | - |
| 55 | Track PA Status | ❌ Not built | - |
| 56 | PA Rejection Resubmission | ❌ Not built | - |
| 59 | Convert Lead to New Arrival | ✅ Move to Residents modal with New/Transfer | Move to Residents.png |
| 60 | Convert New Arrival to Active | ❌ No "Convert to Active" button | - |
| 61 | Lead Activity Overview | ✅ Activity timeline in Lead Detail | Activity.png |
| 62 | View Activity Summary | ✅ "View Summary" expand/collapse | Activity.png |

### ADH, ALF - Resident - InProgress (1 story)
| Row | Title | Status | Figma |
|-----|-------|--------|-------|
| 58 | Add Billing & Clearance | ✅ Billing step with 4 payment types | Step 3 Billing.png |

---

## 3. ALF - RESIDENT - INPROGRESS (8 stories)

| Row | Title | Status | Figma |
|-----|-------|--------|-------|
| 64 | Bed Availability Check | ✅ Room cards grid with Private/Semi-Private tabs | Send to CM-8/9.png |
| 65 | View Bed Census | 🔶 Room cards shown but no census summary numbers | - |
| 66 | Room Assignment | ✅ Room Layout modal + Confirm Bed Assignment | Room Layout.png, Modal-1.png |
| 67 | Waitlist Management | 🔧 "Move to Waitlist" mentioned but not built as modal | Move to waitlist.png |
| 68 | View Waitlist | 🔧 Waitlist tab exists in Residents list, no data | - |
| 69 | Waitlist Notification | ❌ Not built | - |
| 70 | Track waitlist leads | ❌ Not built | - |
| 72 | Room Hold Management | ❌ Not built | - |

---

## 4. PATIENT CHARTING - COMMON (30 stories)

| Row | Title | Status | Figma |
|-----|-------|--------|-------|
| 208-211 | Medication CRUD + Search | 🔧 Empty tab with "Add Medication" button, no table/form | Frame 1618877456-5.png, Frame 1984078383.png |
| 212-215 | Vitals CRUD + Search | 🔧 Empty tab with "Add Vitals" button, no table/form | Frame 1618877456-3.png, Converstion-1.png |
| 216-219 | Allergies CRUD + Search | 🔧 Empty tab with "Add Allergy" button, no table/form | Frame 1618877456-4.png, Frame 1984078324-1.png |
| 220-223 | Progress Notes CRUD + Search | 🔧 Empty tab with "Add Progress Notes" button, no table/form | Frame 1618877456-7.png, Frame 1984078324.png |
| 224-227 | Activities CRUD + Search | 🔧 Empty tab with "Add Activity" button, no table/form | Frame 1618877456-2.png, Converstion.png |
| 228-231 | Documents CRUD + Search | 🔧 Empty tab with "Add Document" button, no table/form | - |
| 232-234 | Minor Incidents CRUD | 🔧 Empty tab with "Report Incident" button, no form | Report New Incident.png |
| 235-237 | Major Incidents CRUD | 🔧 Same as minor incidents | Report New Incident.png |

## 5. PATIENT CHARTING - ADH (13 stories)

| Row | Title | Status | Figma |
|-----|-------|--------|-------|
| 239 | View/Add Face Sheet | 🔶 Cards exist but show empty states, not filled data | Frame 1618877456.png |
| 240-243 | Care Plan CRUD + Search | 🔧 Empty tab, no table/form | Frame 1618877456-1.png, Frame 1984078382.png |
| 244-247 | Events CRUD + Search | 🔧 Empty tab, no table/form | Frame 1618877456-6.png |
| 248-251 | Pain Scale CRUD + Search | 🔧 Header card exists, no CRUD | - |

## 6. PATIENT CHARTING - ALF (18 stories)

| Row | Title | Status | Figma |
|-----|-------|--------|-------|
| 253 | View/Add Face Sheet | 🔶 Cards exist but show empty states | Face Sheet.png |
| 254-257 | Services CRUD + Search | 🔧 Empty tab, no table/form | - |
| 258-261 | Tickets CRUD + Search | 🔧 Empty tab, no table/form | - |
| 262-265 | Inventory CRUD + Search | 🔧 Empty tab, no table/form | - |
| 266-270 | Face-to-Face Notes + CNA/RN workflow | ❌ Not built | Frame 1984078324.png |

---

## 7. SERVICE MODEL & PRICING (9 stories)
All ❌ Not built — planned for future module

## 8. ROOM ASSIGNMENT & MANAGEMENT (2 stories)
| Row | Title | Status |
|-----|-------|--------|
| 162 | Record Security Deposit | 🔶 Deposit success modal exists but no payment processing |
| 163 | Deposit Processing & Receipt | ❌ Not built |

## 9. PRE-ADMISSION ASSESSMENT (8 stories)
| Row | Title | Status |
|-----|-------|--------|
| 165 | Schedule RN Assessment | 🔶 Assessment step has scheduling form |
| 166-167 | Add/Edit Assessment Details | 🔶 Assessment form sections listed but not functional |
| 168 | Send for RN Signature | ❌ Not built |
| 170-173 | Care Level, Approve/Reject, Notify, Release | ❌ Not built |

## 10. ADMISSION PROCESSING (5 stories)
All ❌ Not built

## 11. DISCHARGE PROCESS (21 stories)
All ❌ Not built — planned for future module

---

## SUMMARY

| Category | Total | ✅ Built | 🔶 Partial | 🔧 Stub | ❌ Not Built |
|----------|-------|---------|-----------|---------|-------------|
| Lead CRM | 32 | 12 | 2 | 10 | 8 |
| Resident InProgress | 15 | 5 | 2 | 1 | 7 |
| ALF InProgress | 8 | 2 | 1 | 2 | 3 |
| Patient Charting Common | 30 | 0 | 0 | 30 | 0 |
| Patient Charting ADH | 13 | 0 | 1 | 12 | 0 |
| Patient Charting ALF | 18 | 0 | 1 | 13 | 4 |
| Other modules | 35 | 0 | 2 | 0 | 33 |
| **TOTAL** | **151** | **19 (13%)** | **9 (6%)** | **68 (45%)** | **55 (36%)** |

## NEXT PRIORITIES
1. **Patient Charting (61 stories)** — All are stubs, need real data tables + add forms
2. **Lead Communication (6 stories)** — Start Call/Chat modals need building
3. **Resident InProgress remaining (7 stories)** — PA tracking, Convert to Active
4. **ALF InProgress remaining (3 stories)** — Waitlist, Room Hold
