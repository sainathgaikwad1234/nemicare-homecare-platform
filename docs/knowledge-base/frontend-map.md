# Frontend Component → API Mapping

## Tech: React 18 + TypeScript + MUI 5 + Vite + React Router 6

## Design System
- **Theme**: Dark blue `#1e3a5f` primary, `#3b82f6` accent, `#f5f6fa` background
- **Navigation**: Horizontal tabs in header (no sidebar) — Home, Co Leads, Residents, Schedule, All HRMS, Documents, Attendance, Label, Label
- **Active Tab**: Pill/rounded-rect background highlight (`rgba(255,255,255,0.15)`)
- **Font**: Inter / Roboto, base 13px
- **Cards**: `border: 1px solid #e5e7eb`, `borderRadius: 6px`, no box-shadow

## Pages

| Page | Component | Route | API Calls | Auth Required |
|------|-----------|-------|-----------|---------------|
| Login | `pages/Login.tsx` | `/login` | POST `/auth/login` | No |
| Dashboard | `pages/Dashboard.tsx` | `/dashboard` | (static demo data) | Yes |
| Lead Management | `pages/LeadManagement.tsx` | `/leads` | GET/POST/PUT/DELETE `/leads` (API-connected, search/filter/paginate) | Yes |
| Resident Management | `pages/ResidentManagement.tsx` | `/residents` | GET/POST/PUT/DELETE `/residents`, POST `/residents/:id/discharge` | Yes |
| Resident Detail | `pages/ResidentDetail.tsx` | `/residents/:id` | GET `/residents/:id`, charting, discharge, setup APIs | Yes |

## Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| MainLayout | `components/Layout/MainLayout.tsx` | Header + full-width content area (no sidebar) |
| Header | `components/Layout/Header.tsx` | Dark blue top nav with horizontal icon+text tabs, search, notifications, avatar |
| Sidebar | `components/Layout/Sidebar.tsx` | **DEPRECATED** — no longer rendered, nav moved to Header tabs |
| ProtectedRoute | `components/ProtectedRoute.tsx` | Auth guard, redirects to `/login` if unauthenticated |

## Dashboard Sections (Figma-matched)
- Quick Links row: text link + filled blue buttons + outlined buttons
- Stats bar: Single white row with vertical dividers (Active Members, New Leads, Attendance MTD, Visits Today)
- Today's Members table (left) + Attendance stacked bar chart (right) — side by side
- PA Authorization calendar grid (left) + Vitals & Progress Notes calendar grid (right) — side by side
- Add Activities: Opens as right Drawer when clicking button

## Leads Page Sections (Figma-matched)
- Toolbar: search/filter/column/export icons + "New Lead" button
- Data table: checkbox, Lead #, Lead Name (avatar), Phone, Email, Created By (avatar), Service Type, Lead Date, Created Date, Status (colored chips)
- Status chips: NEW (blue), QUALIFIED (green), PROSPECT (amber), CONTACTED (pink), IN_PROCESS (indigo)
- Pagination at bottom
- Add/Edit Lead dialog: Lead Details & Status, Referral Source Details, Lead Information sections
- Row actions menu: Edit, View, Delete per row

## Residents Page Sections (API-connected)
- Tab filters: All, Active, In-Progress, New Arrivals, Discharge In-progress, Discharged
- Search bar + filter controls
- Data table: checkbox, Resident Name (avatar), Phone, Email, Service Type, Admission Date, Billing Type, Status (colored chips)
- Status chips: Active (green), New Arrival (blue), In-progress (amber), Discharge In-progress (red), Discharged (gray)
- Row actions menu: Edit, Delete, Discharge
- Add/Edit Resident dialog: first/last name, email, phone, DOB, gender, service type, billing type, admission date
- Pagination at bottom

## Shared Components

| Component | File | Purpose |
|-----------|------|---------|
| DataTable | `components/DataTable.tsx` | Generic paginated table (used by old LeadManagement, may be deprecated) |
| FormDialog | `components/FormDialog.tsx` | Generic modal form dialog |
| LeadForm | `components/Forms/LeadForm.tsx` | Old lead form (superseded by inline dialog in LeadManagement) |

## Charting Components

| Component | File | Charting Type |
|-----------|------|---------------|
| VitalsTab | `components/Charting/VitalsTab.tsx` | vitals |
| AllergiesTab | `components/Charting/AllergiesTab.tsx` | allergies |
| MedicationTab | `components/Charting/MedicationTab.tsx` | medications |
| CarePlansTab | `components/Charting/CarePlansTab.tsx` | care-plans |
| EventsTab | `components/Charting/EventsTab.tsx` | events |
| ProgressNotesTab | `components/Charting/ProgressNotesTab.tsx` | progress-notes |
| ServicesTab | `components/Charting/ServicesTab.tsx` | services |
| TicketsTab | `components/Charting/TicketsTab.tsx` | tickets |
| InventoryTab | `components/Charting/InventoryTab.tsx` | inventory |
| IncidentsTab | `components/Charting/IncidentsTab.tsx` | incidents |
| PainScaleTab | `components/Charting/PainScaleTab.tsx` | pain-scale |
| FaceToFaceNotesTab | `components/Charting/FaceToFaceNotesTab.tsx` | face-to-face |
| DocumentsTab | `components/Charting/DocumentsTab.tsx` | documents |
| DischargeWizard | `components/Discharge/DischargeWizard.tsx` | discharge workflow |

## Services

| Service | File | API Endpoints |
|---------|------|---------------|
| ApiClient | `services/api.ts` | Base HTTP client (singleton), token management, auto-refresh |
| AuthService | `services/auth.service.ts` | `/auth/login`, `/auth/refresh`, `/auth/me`, `/auth/logout` |
| LeadService | `services/lead.service.ts` | `/leads` CRUD + search/filter/paginate |
| ResidentService | `services/resident.service.ts` | `/residents` CRUD + discharge + search/filter/paginate |
| AttendanceService | `services/attendance.service.ts` | `/attendance` daily/weekly roster, check-in/out, mark absent |
| ChartingService | `services/charting.service.ts` | `/residents/:id/charting/:type` CRUD for 12 charting types |

## Hooks

| Hook | File | Purpose |
|------|------|---------|
| useChartingData | `hooks/useChartingData.ts` | Fetch/add/update/delete charting records, fallback to sample data |

## State Management
- **Auth**: React Context (`contexts/AuthContext.tsx`) — user, tokens, permissions
- **Resident**: React Context (`contexts/ResidentContext.tsx`) — provides residentId to charting tabs
- **Data**: Services call API directly (no Redux for API data yet, RTK installed but unused)

## Auth Flow
1. Login → POST `/auth/login` → store tokens in localStorage
2. ApiClient auto-attaches `Authorization: Bearer <token>` header
3. On 401 → auto-refresh via POST `/auth/refresh`
4. On refresh failure → redirect to `/login`
5. ProtectedRoute checks `isAuthenticated` (permission checks removed from routes)

## Not Yet Built
- Scheduling/Calendar pages
- Billing pages
- Document management (standalone page — documents tab exists in charting)
- Employee/HRMS pages
- Attendance page (standalone — backend API exists, no dedicated frontend page yet)
- Family Portal
- Super Admin Portal
