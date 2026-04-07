# API Reference

## Base URL: `/api/v1`

## Authentication

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/auth/login` | auth.routes → authService.login | No | Login with email/password |
| POST | `/auth/refresh` | auth.routes → authService.refreshToken | No | Refresh access token |
| GET | `/auth/me` | auth.routes → authService.getUserProfile | Bearer JWT | Get current user profile |
| POST | `/auth/logout` | auth.routes | Bearer JWT | Logout (client-side token clear) |

## Leads

| Method | Path | Handler | Auth | Permission | Description |
|--------|------|---------|------|------------|-------------|
| GET | `/leads` | lead.routes → leadService.getLeads | Bearer JWT | VIEW_LEADS | List leads (paginated, filterable) |
| GET | `/leads/:id` | lead.routes → leadService.getLeadById | Bearer JWT | VIEW_LEADS | Get single lead |
| POST | `/leads` | lead.routes → leadService.createLead | Bearer JWT | CREATE_LEADS | Create new lead |
| PUT | `/leads/:id` | lead.routes → leadService.updateLead | Bearer JWT | EDIT_LEADS | Update lead |
| DELETE | `/leads/:id` | lead.routes → leadService.deleteLead | Bearer JWT | DELETE_LEADS | Soft delete lead |
| POST | `/leads/:id/convert` | lead.routes → leadService.convertLeadToResident | Bearer JWT | CONVERT_LEADS | Convert lead to resident |

## Residents

| Method | Path | Handler | Auth | Permission | Description |
|--------|------|---------|------|------------|-------------|
| GET | `/residents` | resident.routes → residentService.getResidents | Bearer JWT | VIEW_RESIDENTS | List residents (paginated) |
| GET | `/residents/:id` | resident.routes → residentService.getResidentById | Bearer JWT | VIEW_RESIDENTS | Get single resident |
| POST | `/residents` | resident.routes → residentService.createResident | Bearer JWT | CREATE_RESIDENTS | Create new resident |
| PUT | `/residents/:id` | resident.routes → residentService.updateResident | Bearer JWT | EDIT_RESIDENTS | Update resident |
| DELETE | `/residents/:id` | resident.routes → residentService.deleteResident | Bearer JWT | DELETE_RESIDENTS | Soft delete resident |
| POST | `/residents/:id/discharge` | resident.routes → residentService.dischargeResident | Bearer JWT | DISCHARGE_RESIDENTS | Discharge resident |

## Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Service health check |

## Response Format

```json
{
  "success": true,
  "status": 200,
  "data": { ... },
  "pagination": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

## Error Format

```json
{
  "success": false,
  "status": 400,
  "error": { "code": "VALIDATION_ERROR", "message": "...", "details": { ... } },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

## Query Parameters (List endpoints)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page (max 100) |
| status | string | - | Filter by status enum |
| source | string | - | Filter by lead source |
| q | string | - | Search query (name, email, phone) |
| facilityId | string | - | Filter by facility |

## Not Yet Implemented
- `/rooms` (commented out in index.ts)
- `/visits`
- `/billing`
- `/charting`
- `/documents`
- `/employees`
- `/timesheets`
