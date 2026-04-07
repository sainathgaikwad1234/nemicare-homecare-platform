# Resident Management API Documentation

## Overview

The Resident Management API enables managing resident records including admission, updates, discharge. All endpoints require authentication (JWT Bearer token).

**Base URL**: `/api/v1/residents`

**Required Headers**: `Authorization: Bearer {accessToken}`

---

## Endpoints

### 1. Get All Residents (Paginated)

```http
GET /api/v1/residents
```

**Purpose**: Retrieve a paginated list of residents for the authenticated user's company.

**Query Parameters**:
- `page` (optional, default: 1): Page number for pagination
- `pageSize` (optional, default: 20, max: 100): Number of records per page
- `status` (optional): Filter by resident status (ACTIVE, DISCHARGED, TEMPORARY_ABSENCE)
- `facilityId` (optional): Filter by specific facility

**Required Permission**: `residents.read`

**Example Request**:
```bash
curl -X GET "http://localhost:3001/api/v1/residents?page=1&pageSize=20&status=ACTIVE" \
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
      "id": "resident-001",
      "firstName": "James",
      "lastName": "Williams",
      "middleName": "Michael",
      "email": "james.williams@email.com",
      "phone": "(312) 555-0106",
      "address": "456 Oak Street",
      "city": "Chicago",
      "state": "IL",
      "zipCode": "60602",
      "dateOfBirth": "1940-01-10T00:00:00Z",
      "gender": "MALE",
      "medicareId": "Medicare123456",
      "medicaidId": "Medicaid123456",
      "status": "ACTIVE",
      "admissionDate": "2024-01-15T00:00:00Z",
      "admissionType": "NEW_ARRIVAL",
      "facility": {
        "id": "facility-001",
        "name": "Demo Facility - Central"
      },
      "room": {
        "id": "room-001",
        "roomNumber": "101",
        "type": "SEMI_PRIVATE"
      },
      "visits": [
        {
          "id": "visit-001",
          "visitDate": "2024-04-03T10:00:00Z",
          "visitType": "SCHEDULED",
          "status": "COMPLETED"
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
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

---

### 2. Get Single Resident

```http
GET /api/v1/residents/:id
```

**Purpose**: Retrieve detailed information about a specific resident including medical history.

**URL Parameters**:
- `id` (required): Resident ID

**Required Permission**: `residents.read`

**Example Request**:
```bash
curl -X GET "http://localhost:3001/api/v1/residents/resident-001" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json"
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": "resident-001",
    "firstName": "James",
    "lastName": "Williams",
    "middleName": "Michael",
    "email": "james.williams@email.com",
    "phone": "(312) 555-0106",
    "address": "456 Oak Street",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60602",
    "dateOfBirth": "1940-01-10T00:00:00Z",
    "gender": "MALE",
    "ssn": "***-**-1234",
    "medicareId": "Medicare123456",
    "medicaidId": "Medicaid123456",
    "emergencyContactName": "Sarah Williams",
    "emergencyContactPhone": "(312) 555-0107",
    "emergencyContactRelationship": "Daughter",
    "primaryPhysicianName": "Dr. Sarah Lee",
    "primaryPhysicianPhone": "(312) 555-0200",
    "allergies": ["Penicillin", "Nuts"],
    "medicalConditions": ["Hypertension", "Diabetes Type 2"],
    "currentMedications": ["Lisinopril", "Metformin"],
    "status": "ACTIVE",
    "admissionDate": "2024-01-15T00:00:00Z",
    "admissionType": "NEW_ARRIVAL",
    "facility": {
      "id": "facility-001",
      "name": "Demo Facility - Central",
      "address": "123 Healthcare Blvd",
      "city": "Chicago",
      "state": "IL",
      "phone": "(312) 555-0101",
      "email": "central@homecaregroup.com"
    },
    "room": {
      "id": "room-001",
      "roomNumber": "101",
      "type": "SEMI_PRIVATE",
      "capacity": 2,
      "status": "OCCUPIED"
    },
    "primaryPhysician": {
      "id": "user-doctor-001",
      "firstName": "Sarah",
      "lastName": "Lee",
      "email": "dr.sarah.lee@hospital.com",
      "phone": "(312) 555-0200"
    },
    "visits": [
      {
        "id": "visit-001",
        "visitDate": "2024-04-03T10:00:00Z",
        "visitType": "SCHEDULED",
        "status": "COMPLETED",
        "notes": "Routine check-in",
        "visitedBy": {
          "firstName": "John",
          "lastName": "Caregiver"
        }
      }
    ],
    "admittedBy": {
      "id": "user-manager-001",
      "firstName": "Jane",
      "lastName": "Manager",
      "email": "manager@demo.nemicare.local"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-04-02T15:45:00Z"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456"
  }
}
```

---

### 3. Create Resident

```http
POST /api/v1/residents
```

**Purpose**: Create a new resident record (typically from a converted lead or manual admission).

**Required Permission**: `residents.create`

**Required Fields**:
- `firstName`, `lastName`, `address`, `city`, `state`, `zipCode`: Basic info
- `dateOfBirth`, `gender`: Demographics
- `emergencyContactName`, `emergencyContactPhone`, `emergencyContactRelationship`: Emergency contact
- `companyId`, `facilityId`: Company and facility
- `admissionDate`: When admitted
- `admissionType`: NEW_ARRIVAL, TRANSFER, or READMISSION

**Optional Fields**:
- `middleName`, `email`, `phone`: Contact info
- `ssn`, `medicareId`, `medicaidId`: Insurance
- `primaryPhysicianName`, `primaryPhysicianPhone`: Physician contact
- `allergies`, `medicalConditions`, `currentMedications`: Medical arrays
- `roomId`: Room assignment

**Example Request**:
```bash
curl -X POST "http://localhost:3001/api/v1/residents" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Robert",
    "lastName": "Johnson",
    "middleName": "James",
    "email": "robert.johnson@email.com",
    "phone": "(312) 555-0104",
    "address": "456 Healthcare St",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60601",
    "dateOfBirth": "1945-03-15",
    "gender": "MALE",
    "ssn": "123-45-6789",
    "medicareId": "Medicare555",
    "emergencyContactName": "Sarah Johnson",
    "emergencyContactPhone": "(312) 555-0108",
    "emergencyContactRelationship": "Daughter",
    "primaryPhysicianName": "Dr. Michael Chen",
    "primaryPhysicianPhone": "(312) 555-0201",
    "allergies": ["Penicillin"],
    "medicalConditions": ["Hypertension"],
    "currentMedications": ["Lisinopril"],
    "companyId": "company-001",
    "facilityId": "facility-001",
    "admissionDate": "2024-04-04",
    "admissionType": "NEW_ARRIVAL",
    "roomId": "room-001"
  }'
```

**Success Response (201 - Created)**:
```json
{
  "success": true,
  "status": 201,
  "data": {
    "id": "resident-new-001",
    "firstName": "Robert",
    "lastName": "Johnson",
    "status": "ACTIVE",
    "admissionDate": "2024-04-04T00:00:00Z",
    "facility": {
      "id": "facility-001",
      "name": "Demo Facility - Central"
    },
    "room": {
      "id": "room-001",
      "roomNumber": "101"
    },
    "admittedBy": {
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

---

### 4. Update Resident

```http
PUT /api/v1/residents/:id
```

**Purpose**: Update resident information (partial update - only changed fields required).

**URL Parameters**:
- `id` (required): Resident ID

**Required Permission**: `residents.update`

**Optional Fields** (at least one required):
- Basic info: `firstName`, `lastName`, `middleName`, `email`, `phone`
- Address: `address`, `city`, `state`, `zipCode`
- Demographics: `dateOfBirth`, `gender`
- Medical: `allergies`, `medicalConditions`, `currentMedications`
- Care team: `primaryPhysicianName`, `primaryPhysicianPhone`
- Emergency: `emergencyContactName`, `emergencyContactPhone`, `emergencyContactRelationship`
- Housing: `roomId`
- Notes: `notes`

**Example Request**:
```bash
curl -X PUT "http://localhost:3001/api/v1/residents/resident-001" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "primaryPhysicianName": "Dr. Patricia Brown",
    "primaryPhysicianPhone": "(312) 555-0202",
    "currentMedications": ["Lisinopril", "Metformin", "Aspirin"],
    "roomId": "room-002",
    "notes": "Transferred to different room per request"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": "resident-001",
    "firstName": "Robert",
    "lastName": "Johnson",
    "primaryPhysicianName": "Dr. Patricia Brown",
    "primaryPhysicianPhone": "(312) 555-0202",
    "currentMedications": ["Lisinopril", "Metformin", "Aspirin"],
    "room": {
      "id": "room-002",
      "roomNumber": "102"
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

---

### 5. Delete Resident

```http
DELETE /api/v1/residents/:id
```

**Purpose**: Soft-delete a resident (marks as deleted, data remains for audit trail).

**URL Parameters**:
- `id` (required): Resident ID

**Required Permission**: `residents.delete`

**Example Request**:
```bash
curl -X DELETE "http://localhost:3001/api/v1/residents/resident-001" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json"
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "Resident deleted successfully"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456",
    "deleted": true
  }
}
```

---

### 6. Discharge Resident

```http
POST /api/v1/residents/:id/discharge
```

**Purpose**: Mark a resident as discharged (permanent status change).

**URL Parameters**:
- `id` (required): Resident ID

**Body Parameters**:
- `dischargeDate` (required, ISO date): When resident is discharged
- `dischargeReason` (required, string): Reason for discharge

**Required Permission**: `residents.discharge`

**Example Request**:
```bash
curl -X POST "http://localhost:3001/api/v1/residents/resident-001/discharge" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "dischargeDate": "2024-04-10T00:00:00Z",
    "dischargeReason": "Transferred to hospital for acute care"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": "resident-001",
    "firstName": "Robert",
    "lastName": "Johnson",
    "status": "DISCHARGED",
    "admissionDate": "2024-01-15T00:00:00Z",
    "dischargeDate": "2024-04-10T00:00:00Z",
    "dischargeReason": "Transferred to hospital for acute care",
    "facility": {
      "id": "facility-001",
      "name": "Demo Facility - Central"
    },
    "dischargedBy": {
      "id": "user-manager-001",
      "firstName": "Jane",
      "lastName": "Manager"
    },
    "updatedAt": "2024-04-04T12:00:00Z"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456",
    "discharged": true
  }
}
```

**Error Response (400 - Already Discharged)**:
```json
{
  "success": false,
  "status": 400,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Resident already discharged"
  },
  "meta": {
    "timestamp": "2024-04-04T12:00:00Z",
    "requestId": "req-abc123def456"
  }
}
```

---

## Permissions Model

| Permission | Admin | Manager | Staff |
|-----------|-------|---------|-------|
| View Residents | ✅ | ✅ | ✅ |
| Create Residents | ✅ | ✅ | ❌ |
| Update Residents | ✅ | ✅ | ✅ * |
| Delete Residents | ✅ | ✅ | ❌ |
| Discharge Residents | ✅ | ✅ | ❌ |

*Staff can update resident info for charting/notes but not room assignments or physician

---

## Database Relationships

**Resident Model References**:
- `companyId` (required) — Multi-tenant isolation
- `facilityId` (required) — Where resident lives
- `roomId` (optional) — Room assignment
- `admittedByUserId` (required) — Who admitted
- `updatedByUserId` (optional) — Last editor
- `deletedByUserId` (optional) — Who soft-deleted
- `dischargedByUserId` (optional) — Who discharged

**Related Data**:
- Visits (1-to-many) — All visits for this resident
- Room (1-to-1) — Current room assignment
- Facility (1-to-1) — Where resident is housed

---

## Error Codes Reference

| Code | Status | Scenario |
|------|--------|----------|
| VALIDATION_ERROR | 400 | Missing required fields |
| INVALID_REQUEST | 400 | Invalid room, can't discharge already discharged |
| RESOURCE_NOT_FOUND | 404 | Resident ID doesn't exist |
| FORBIDDEN | 403 | User lacks permission |
| DATABASE_ERROR | 500 | Database operation failed |

---

## Testing the API

### Quick Test (Bash Script)

```bash
#!/bin/bash

# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@demo.nemicare.local",
    "password": "Manager@123456"
  }' | jq -r '.data.accessToken')

COMPANY_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/auth/me | jq -r '.data.companyId')
FACILITY_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/auth/me | jq -r '.data.facilityId')

echo "✓ Token acquired"

# 2. Create resident
RESIDENT=$(curl -s -X POST http://localhost:3001/api/v1/residents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Test\",
    \"lastName\": \"Resident\",
    \"email\": \"test-resident-$(date +%s)@example.com\",
    \"phone\": \"(555) 123-4567\",
    \"address\": \"123 Test St\",
    \"city\": \"Test City\",
    \"state\": \"TS\",
    \"zipCode\": \"12345\",
    \"dateOfBirth\": \"1960-01-01\",
    \"gender\": \"MALE\",
    \"emergencyContactName\": \"Jane Doe\",
    \"emergencyContactPhone\": \"(555) 987-6543\",
    \"emergencyContactRelationship\": \"Daughter\",
    \"companyId\": \"$COMPANY_ID\",
    \"facilityId\": \"$FACILITY_ID\",
    \"admissionDate\": \"2024-04-04\",
    \"admissionType\": \"NEW_ARRIVAL\"
  }")

RESIDENT_ID=$(echo $RESIDENT | jq -r '.data.id')
echo "✓ Resident created: $RESIDENT_ID"

# 3. Get resident
curl -s -X GET "http://localhost:3001/api/v1/residents/$RESIDENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 4. Discharge resident (wait 1 second first)
sleep 1
curl -s -X POST "http://localhost:3001/api/v1/residents/$RESIDENT_ID/discharge" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dischargeDate": "2024-04-05",
    "dischargeReason": "Test discharge"
  }' | jq '.'

echo "✓ Test complete"
```

---

## Implementation Examples

### Frontend - React Hook

```typescript
const useResidents = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchResidents = async (facilityId?: string, status?: string) => {
    setLoading(true);
    try {
      let url = '/api/v1/residents';
      if (facilityId || status) {
        url += '?';
        if (facilityId) url += 'facilityId=' + facilityId;
        if (status) url += (facilityId ? '&' : '') + 'status=' + status;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('accessToken') }
      });
      const json = await response.json();
      setResidents(json.data);
      return json.pagination;
    } finally {
      setLoading(false);
    }
  };
  
  return { residents, loading, fetchResidents };
};
```

---

**Last Updated**: April 4, 2024  
**Version**: 1.0  
**Status**: Production Ready
