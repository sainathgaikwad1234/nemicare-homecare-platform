# Nemicare HomeCare Platform - Overview

## Project
- **Name**: Nemicare HomeCare Platform
- **Domain**: Healthcare — Assisted Living Facility (ALF), Adult Day Health (ADH), Home Care
- **Client**: Sam Shah (Nemicare)
- **Architecture**: Monorepo with separate backend, frontend, and automation projects

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Node.js + Express + TypeScript | Express 4.18, TS 5.3 |
| ORM | Prisma | 5.0 |
| Database | PostgreSQL | 15 (Alpine) |
| Cache/Queue | Redis + Bull | Redis 7, Bull 4.11 |
| Frontend | React + TypeScript | React 18.2 |
| UI Library | Material-UI (MUI) | 5.14 |
| State | Redux Toolkit + React Context (auth) | RTK 1.9 |
| Routing | React Router DOM | 6.20 |
| Forms | React Hook Form + Yup | RHF 7.49 |
| Build | Vite | 5.0 |
| Auth | JWT (access + refresh tokens) | jsonwebtoken 9.0 |
| Validation | Joi | 17.11 |
| Logging | Winston | 3.11 |
| Security | Helmet, CORS, Rate Limiting | Helmet 7.1 |
| Testing (E2E) | Playwright | 1.49 |
| Testing (Unit) | Jest + Supertest | Jest 29.7 |
| Containerization | Docker + Docker Compose | Compose 3.8 |
| Perf Testing | k6 | - |

## Architecture

```
HomeCare-Project-Development/
├── backend/          # Express API (port 3001)
│   ├── prisma/       # Schema + migrations + seed
│   ├── src/
│   │   ├── config/   # Constants, settings
│   │   ├── middleware/# auth, rbac, audit, validation, errors, logger
│   │   ├── routes/   # auth, lead, resident, charting, attendance, discharge, patientSetup
│   │   ├── services/ # auth, lead, resident, charting, attendance, discharge, patientSetup
│   │   ├── types/    # TypeScript types
│   │   └── utils/    # bcrypt, jwt, helpers
│   └── Dockerfile
├── frontend/         # React SPA (port 3000)
│   └── src/
│       ├── components/  # DataTable, FormDialog, Layout, ProtectedRoute
│       ├── contexts/    # AuthContext, ResidentContext
│       ├── pages/       # Login, Dashboard, LeadManagement, ResidentManagement
│       ├── hooks/       # useChartingData (API-connected charting data hook)
│       └── services/    # api client, auth, lead, resident, attendance, charting services
├── automation/       # Playwright test framework
│   ├── pages/        # Page Object Model (BasePage, LoginPage)
│   ├── tests/        # e2e, api, visual
│   ├── explorer/     # Site crawler/analyzer
│   └── fixtures/     # Test data, auth setup
├── tests/performance/# k6 load/stress/spike/soak tests
├── agents/           # AI QA agent definitions (17 agents)
├── project-docs/     # MoMs, SRS, figma screens, user stories, acceptance criteria
├── templates/        # Bug report, test case, MoM, user story, test strategy
├── checklists/       # Regression, release, smoke test
└── docker-compose.yml
```

## Multi-Tenancy Model
- Company → Facility → Users/Residents/Leads
- All data scoped by `companyId`, optionally `facilityId`
- RBAC: permission-based (e.g., `leads.read`, `residents.create`)

## Current Implementation Status
- **Auth**: Login, refresh token, profile, logout — DONE
- **Leads**: Full CRUD + convert-to-resident — DONE
- **Residents**: Full CRUD + discharge — DONE
- **Frontend**: Login, Dashboard, Lead Management, Resident Management pages — DONE (Figma-matched, API-connected)
- **Layout**: Dark blue horizontal nav header (no sidebar), pill-style active tab, `#1e3a5f` theme
- **Dashboard**: Stats bar, Today's Members table + Attendance chart (side-by-side), PA Auth + Vitals calendar grids
- **Leads Page**: Data table with checkboxes, avatars, status chips, Add/Edit/Delete, search, pagination, API-driven filtering
- **Residents Page**: Data table with tabs, CRUD, discharge, search, pagination, API-driven filtering
- **DB Seed**: 3 users (admin/manager/staff), sample leads + resident, `prisma.seed` configured in package.json
- **Docker**: PostgreSQL + Redis running via docker-compose
- **Charting**: Full CRUD for 12 charting types (vitals, allergies, medications, care plans, events, progress notes, services, tickets, inventory, incidents, pain scale, face-to-face) — DONE
- **Attendance**: Daily/weekly roster, check-in/out, mark absent — DONE
- **Discharge**: Full discharge workflow with approval — DONE
- **Patient Setup**: 7-step onboarding wizard (case/agency, documents, case manager, transportation, billing, bed availability, assessment) — DONE
- **Resident Detail**: Face sheet page with 11+ tabs, Figma-matched — DONE
- **Visits, Billing, Documents, Employees**: Schema defined, routes NOT implemented
- **Rooms**: Schema defined, route commented out

## Key Ports
- Frontend: 3000
- Backend: 3001
- PostgreSQL: 5432
- Redis: 6379
