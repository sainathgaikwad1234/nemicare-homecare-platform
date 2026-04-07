# Lead Management API Documentation

## Overview

The Lead Management API enables creating, reading, updating, deleting, and converting leads to residents. All endpoints require authentication (JWT Bearer token).

**Base URL**: `/api/v1/leads`

**Required Headers**: `Authorization: Bearer {accessToken}`

---

## Endpoints

### 1. Get All Leads (Paginated)

```http
GET /api/v1/leads
```

**Purpose**: Retrieve a paginated list of leads for the authenticated user's company.

**Query Parameters**:
- `page` (optional, default: 1): Page number for pagination
- `pageSize` (optional, default: 20, max: 100): Number of records per page
- `status` (optional): Filter by lead status (PROSPECT, QUALIFIED, IN_PROCESS, CONVERTED, REJECTED)
- `source` (optional): Filter by lead source (WEBSITE, PHONE, REFERRAL, MARKETING, FAMILY, OTHER)
- `facilityId` (optional): Filter by specific facility
- `q` (optional): Search query (searches firstName, lastName, email, phone)

**Required Permission**: `leads.read`

**Example Request**:
```bash
curl -X GET "http://localhost:3001/api/v1/leads?page=1&pageSize=20&status=QUALIFIED" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json"
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "id": "lead-001",
      "firstName": "Robert",
      "lastName": "Johnson",
      "email": "robert.johnson@email.com",
      "phone": "(312) 555-0104",
      "status": "QUALIFIED",
      "source": "REFERRAL",
      "dateOfBirth": "1945-03-15T00:00:00Z",
      "gender": "MALE",
      "address": "456 Healthcare St",
      "city": "Chicago",
      "state": "IL",
      "zipCode": "60601",
      "facility": {
        "id": "facility-001",
        "name": "Demo Facility - Central"
      },
      "assignedTo": {
        "id": "user-001",
        "firstName": "Jane",
        "lastName": "Manager",
        "email": "manager@demo.nemicare.local"
      },
      "createdAt": "2024-04-01T10:30:00Z",
      "updatedAt": "2024-04-02T15:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456"
  }
}
```

**Error Response (400 - Validation Error)**:
```json
{
  "success": false,
  "status": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "page": "must be an integer"
    }
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456"
  }
}
```

---

### 2. Get Single Lead

```http
GET /api/v1/leads/:id
```

**Purpose**: Retrieve detailed information about a specific lead.

**URL Parameters**:
- `id` (required): Lead ID

**Required Permission**: `leads.read`

**Example Request**:
```bash
curl -X GET "http://localhost:3001/api/v1/leads/lead-001" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json"
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": "lead-001",
    "firstName": "Robert",
    "lastName": "Johnson",
    "email": "robert.johnson@email.com",
    "phone": "(312) 555-0104",
    "address": "456 Healthcare St",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60601",
    "dateOfBirth": "1945-03-15T00:00:00Z",
    "gender": "MALE",
    "source": "REFERRAL",
    "status": "QUALIFIED",
    "notes": "Strong candidate, family supportive",
    "followUpDate": "2024-04-10T14:00:00Z",
    "facility": {
      "id": "facility-001",
      "name": "Demo Facility - Central",
      "address": "123 Healthcare Blvd",
      "city": "Chicago",
      "state": "IL"
    },
    "assignedTo": {
      "id": "user-manager-001",
      "firstName": "Jane",
      "lastName": "Manager",
      "email": "manager@demo.nemicare.local",
      "phone": "(312) 555-0102"
    },
    "createdBy": {
      "id": "user-admin-001",
      "firstName": "Demo",
      "lastName": "Admin",
      "email": "admin@demo.nemicare.local"
    },
    "createdAt": "2024-04-01T10:30:00Z",
    "updatedAt": "2024-04-02T15:45:00Z"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456"
  }
}
```

**Error Response (404 - Not Found)**:
```json
{
  "success": false,
  "status": 404,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Lead not found"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456"
  }
}
```

---

### 3. Create Lead

```http
POST /api/v1/leads
```

**Purpose**: Create a new lead record.

**Required Permission**: `leads.create`

**Required Fields**:
- `firstName` (string, required): First name
- `lastName` (string, required): Last name
- `email` (string, required): Email address
- `phone` (string, required): Phone number
- `address` (string, required): Street address
- `city` (string, required): City
- `state` (string, required): State/Province
- `zipCode` (string, required): ZIP/Postal code
- `dateOfBirth` (date, required): Date of birth (ISO 8601 format)
- `gender` (string, required): MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY
- `source` (string, required): WEBSITE, PHONE, REFERRAL, MARKETING, FAMILY, or OTHER
- `companyId` (string, required): Company ID
- `facilityId` (string, required): Facility ID

**Optional Fields**:
- `notes` (string): Additional notes about the lead

**Example Request**:
```bash
curl -X POST "http://localhost:3001/api/v1/leads" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Margaret",
    "lastName": "Smith",
    "email": "margaret.smith@email.com",
    "phone": "(312) 555-0105",
    "address": "789 Park Avenue",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60602",
    "dateOfBirth": "1950-07-22",
    "gender": "FEMALE",
    "source": "WEBSITE",
    "companyId": "company-001",
    "facilityId": "facility-001",
    "notes": "Referred by website, interested in ALF"
  }'
```

**Success Response (201 - Created)**:
```json
{
  "success": true,
  "status": 201,
  "data": {
    "id": "lead-new-001",
    "firstName": "Margaret",
    "lastName": "Smith",
    "email": "margaret.smith@email.com",
    "phone": "(312) 555-0105",
    "address": "789 Park Avenue",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60602",
    "dateOfBirth": "1950-07-22T00:00:00Z",
    "gender": "FEMALE",
    "source": "WEBSITE",
    "status": "PROSPECT",
    "notes": "Referred by website, interested in ALF",
    "facility": {
      "id": "facility-001",
      "name": "Demo Facility - Central"
    },
    "createdBy": {
      "id": "user-manager-001",
      "firstName": "Jane",
      "lastName": "Manager"
    },
    "createdAt": "2024-04-04T12:00:00Z"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456",
    "created": true
  }
}
```

**Error Response (400 - Validation Error)**:
```json
{
  "success": false,
  "status": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "firstName": "is required",
      "email": "must be a valid email"
    }
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456"
  }
}
```

**Error Response (409 - Conflict)**:
```json
{
  "success": false,
  "status": 409,
  "error": {
    "code": "DUPLICATE_RESOURCE",
    "message": "Lead with this email already exists"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456"
  }
}
```

---

### 4. Update Lead

```http
PUT /api/v1/leads/:id
```

**Purpose**: Update an existing lead (partial update - only changed fields required).

**URL Parameters**:
- `id` (required): Lead ID

**Required Permission**: `leads.update`

**Optional Fields** (at least one required):
- `firstName` (string): First name
- `lastName` (string): Last name
- `email` (string): Email address
- `phone` (string): Phone number
- `address` (string): Street address
- `city` (string): City
- `state` (string): State/Province
- `zipCode` (string): ZIP/Postal code
- `dateOfBirth` (date): Date of birth
- `gender` (string): MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY
- `source` (string): Lead source
- `status` (string): PROSPECT, QUALIFIED, IN_PROCESS, CONVERTED, or REJECTED
- `notes` (string): Additional notes
- `followUpDate` (date): Next follow-up date

**Example Request**:
```bash
curl -X PUT "http://localhost:3001/api/v1/leads/lead-001" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "QUALIFIED",
    "followUpDate": "2024-04-15T10:00:00Z",
    "notes": "Updated: Strong candidate confirmed interest"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": "lead-001",
    "firstName": "Robert",
    "lastName": "Johnson",
    "email": "robert.johnson@email.com",
    "phone": "(312) 555-0104",
    "address": "456 Healthcare St",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60601",
    "dateOfBirth": "1945-03-15T00:00:00Z",
    "gender": "MALE",
    "source": "REFERRAL",
    "status": "QUALIFIED",
    "notes": "Updated: Strong candidate confirmed interest",
    "followUpDate": "2024-04-15T10:00:00Z",
    "facility": {
      "id": "facility-001",
      "name": "Demo Facility - Central"
    },
    "assignedTo": {
      "id": "user-manager-001",
      "firstName": "Jane",
      "lastName": "Manager"
    },
    "updatedBy": {
      "id": "user-manager-001",
      "firstName": "Jane",
      "lastName": "Manager"
    },
    "updatedAt": "2024-04-04T12:00:00Z"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456",
    "updated": true
  }
}
```

**Error Response (404 - Not Found)**:
```json
{
  "success": false,
  "status": 404,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Lead not found"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456"
  }
}
```

---

### 5. Delete Lead

```http
DELETE /api/v1/leads/:id
```

**Purpose**: Soft-delete a lead (marks as deleted, data remains in database for audit trail).

**URL Parameters**:
- `id` (required): Lead ID

**Required Permission**: `leads.delete`

**Example Request**:
```bash
curl -X DELETE "http://localhost:3001/api/v1/leads/lead-001" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json"
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "Lead deleted successfully"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456",
    "deleted": true
  }
}
```

**Error Response (404 - Not Found)**:
```json
{
  "success": false,
  "status": 404,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Lead not found"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456"
  }
}
```

---

### 6. Convert Lead to Resident

```http
POST /api/v1/leads/:id/convert
```

**Purpose**: Convert a qualified lead into a resident record.

**URL Parameters**:
- `id` (required): Lead ID

**Query/Body Parameters**:
- `facilityId` (required): Target facility ID

**Required Permission**: `leads.convert`

**Example Request**:
```bash
curl -X POST "http://localhost:3001/api/v1/leads/lead-001/convert" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "facilityId": "facility-001"
  }'
```

**Success Response (201 - Created)**:
```json
{
  "success": true,
  "status": 201,
  "data": {
    "id": "resident-001",
    "firstName": "Robert",
    "lastName": "Johnson",
    "email": "robert.johnson@email.com",
    "phone": "(312) 555-0104",
    "address": "456 Healthcare St",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60601",
    "dateOfBirth": "1945-03-15T00:00:00Z",
    "gender": "MALE",
    "status": "ACTIVE",
    "admissionType": "ALF",
    "admissionDate": "2024-04-04T12:00:00Z",
    "facilityId": "facility-001",
    "companyId": "company-001",
    "createdAt": "2024-04-04T12:00:00Z"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456",
    "converted": true
  }
}
```

**Error Response (400 - Invalid State)**:
```json
{
  "success": false,
  "status": 400,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Lead already converted to resident"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456"
  }
}
```

---

## Authentication

All endpoints (except `/api/v1/auth/login` and `/api/v1/auth/refresh`) require a valid JWT access token.

**How to Get Token**:
1. Call `/api/v1/auth/login` with email and password
2. Receive `accessToken` in response
3. Use `Authorization: Bearer {accessToken}` header on all subsequent requests

**Token Expiry**: 15 minutes (use refresh token to get new access token)

---

## Error Codes Reference

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| INVALID_REQUEST | 400 | Invalid business logic request |
| RESOURCE_NOT_FOUND | 404 | Lead not found |
| DUPLICATE_RESOURCE | 409 | Email already exists |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| DATABASE_ERROR | 500 | Database operation failed |

---

## Rate Limiting

All endpoints are subject to rate limiting:
- **Limit**: 100 requests per 15 minutes per IP address
- **Header**: `RateLimit-Remaining` shows requests left
- **Response**: 429 Too Many Requests when limit exceeded

---

## Request/Response Headers

**Request Headers** (required for all endpoints except login):
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response Headers** (all responses include):
```
Content-Type: application/json
X-Request-Id: {requestId}
```

---

## Testing the API

### Using cURL

```bash
# 1. Login to get token
TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.nemicare.local",
    "password": "Admin@123456"
  }' | jq -r '.data.accessToken')

# 2. Get all leads
curl -X GET http://localhost:3001/api/v1/leads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 3. Create new lead
curl -X POST http://localhost:3001/api/v1/leads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "(555) 123-4567",
    "address": "123 Test St",
    "city": "Test City",
    "state": "TS",
    "zipCode": "12345",
    "dateOfBirth": "1980-01-01",
    "gender": "MALE",
    "source": "WEBSITE",
    "companyId": "company-001",
    "facilityId": "facility-001"
  }'
```

### Using Postman

1. Set up environment variable: `accessToken` = token from login
2. Import base URL: `{{baseUrl}}/api/v1/leads`
3. Add for each request: `Authorization: Bearer {{accessToken}}`
4. Use examples above as request bodies

---

## Common Issues

**Issue**: "Lead with this email already exists"
- **Cause**: Email address is already in use
- **Solution**: Use a different email or update the existing lead

**Issue**: "Insufficient permissions (FORBIDDEN)"
- **Cause**: User's role doesn't have required permission
- **Solution**: Contact administrator to grant permission

**Issue**: "Lead already converted to resident"
- **Cause**: Lead has already been converted
- **Solution**: Check resident instead or create new lead

**Issue**: Pagination returning empty
- **Cause**: Page number exceeds total pages
- **Solution**: Use page 1 or verify totalPages in response

---

## Implementation Examples

### Frontend - React Hook

```typescript
// Hook to fetch leads
const useLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchLeads = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/leads?page=' + page, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
        }
      });
      const json = await response.json();
      setLeads(json.data);
      return json.pagination;
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return { leads, loading, fetchLeads };
};
```

### Node.js - Service Call

```typescript
// Service to create lead
async function createLead(leadData, token) {
  const response = await fetch('http://localhost:3001/api/v1/leads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(leadData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }
  
  return response.json();
}
```

---

**Last Updated**: April 4, 2024  
**Version**: 1.0  
**Status**: Production Ready
