# 🔧 Backend Quick Reference Guide

**Print this** and tape it above your desk! 📌

---

## 🔐 Authentication Endpoints

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@demo.nemicare.local",
  "password": "Admin@123456"
}

→ Returns: { user, accessToken, refreshToken }
```

### Get Current User
```bash
GET /api/v1/auth/me
Authorization: Bearer <accessToken>

→ Returns: User profile with permissions
```

### Refresh Token
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refreshToken>"
}

→ Returns: { accessToken, refreshToken }
```

### Logout
```bash
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>

→ Returns: { message: "Logged out successfully" }
```

---

## 📝 Test User Accounts

After `npm run db:seed`:

```
Admin:   admin@demo.nemicare.local / Admin@123456
Manager: manager@demo.nemicare.local / Manager@123456
Staff:   staff@demo.nemicare.local / Staff@123456
```

---

## 🛠️ Common Commands

```bash
# Setup
npm install
cp .env.example .env.local
docker-compose up -d postgres redis
npm run db:migrate
npm run db:seed

# Development
npm run dev                 # Watch mode (http://localhost:3001)
npm test                    # Run tests
npm run lint                # Check for errors
npm run format              # Auto-format code

# Database
npm run db:studio           # Open database browser
npm run db:migrate          # Create migration after schema change
npm run db:reset            # ⚠️ Delete all data
```

---

## 🛣️ How to Add a New Route

### 1. Create Service (src/services/feature.service.ts)
```typescript
export const featureService = {
  async create(data: any) {
    // Business logic here
    return prisma.feature.create({ data });
  },
};
```

### 2. Create Route (src/routes/feature.routes.ts)
```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errors';
import { featureService } from '../services/feature.service';

const router = Router();

router.post(
  '/',
  authenticate,                              // Add JWT check
  requirePermission('features.create'),      // Add permission check
  validate({ body: schemas.createFeatureSchema }), // Add validation
  asyncHandler(async (req, res) => {
    const result = await featureService.create(req.body);
    res.status(201).json({
      success: true,
      status: 201,
      data: result,
    });
  })
);

export default router;
```

### 3. Import in Main App (src/index.ts)
```typescript
import featureRoutes from './routes/feature.routes';

app.use('/api/v1/features', authenticate, featureRoutes);
```

### 4. Add Validation Schema (src/middleware/validation.ts)
```typescript
createFeatureSchema: Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(null),
  // ... more fields
}).min(1),
```

---

## 📋 Permission Checklist

Every route needs:

- [ ] `authenticate` middleware for protected routes
- [ ] `requirePermission()` middleware with specific permission
- [ ] `validate()` middleware with Joi schema
- [ ] `asyncHandler()` wrapper to catch errors
- [ ] Consistent response format
- [ ] Request ID in meta

Example:
```typescript
router.get(
  '/:id',
  authenticate,                      // ✅ Check JWT
  requirePermission('items.read'),   // ✅ Check permission
  validate({ params: schemas.idParamSchema }), // ✅ Validate ID
  asyncHandler(async (req, res) => { // ✅ Catch errors
    const result = await itemService.get(req.params.id);
    res.json({
      success: true,
      status: 200,
      data: result,
      meta: {                         // ✅ Include meta
        timestamp: helpers.getCurrentTimestamp(),
        requestId: req.requestId,
      },
    });
  })
);
```

---

## 🔑 Permissions Available

```
Auth:
  - (no permissions - public endpoints)

Leads:
  - leads.read
  - leads.create
  - leads.update
  - leads.delete

Residents:
  - residents.read
  - residents.create
  - residents.update
  - residents.delete

Billing:
  - billing.read
  - billing.create
  - billing.update
  - billing.delete

Charting:
  - charting.read
  - charting.create
  - charting.sign

Users:
  - users.read
  - users.create
  - users.update
  - users.delete

Audit:
  - audit.read
```

---

## 📊 Error Response Format

All errors return:
```json
{
  "success": false,
  "status": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed error message",
    "details": { /* validation details */ }
  },
  "meta": {
    "timestamp": "2026-04-04T15:30:00Z",
    "requestId": "req-abc123"
  }
}
```

**Never throw errors directly** - use AppError:
```typescript
import { AppError } from '../types';

throw new AppError(
  HTTP_STATUS.NOT_FOUND,
  ERROR_CODES.NOT_FOUND,
  'Item not found'
);
```

---

## ✔️ Success Response Format

All success responses return:
```json
{
  "success": true,
  "status": 200,
  "data": { /* resource */ },
  "meta": {
    "timestamp": "2026-04-04T15:30:00Z",
    "requestId": "req-abc123"
  }
}
```

---

## 🧪 Testing Your Endpoint

```bash
# Login first to get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.nemicare.local",
    "password": "Admin@123456"
  }' | jq -r '.data.accessToken')

# Test your endpoint
curl -X GET http://localhost:3001/api/v1/your-resource \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

Or use Postman with:
- Authorization tab → Bearer Token
- Paste your accessToken

---

## 🐛 Debugging

### Enable Debug Logging
```bash
DEBUG=nemicare:* npm run dev
```

### Check Logs
```bash
# Console: automatic (development)
# Files: logs/combined.log and logs/error.log

tail -f logs/combined.log
```

### Database Browser
```bash
npm run db:studio
# Opens http://localhost:5555 with database UI
```

### Type Check
```bash
npm run type-check
```

---

## 🚨 Common Issues

### Issue: Token expired
**Solution**: Use refresh endpoint to get new accessToken

### Issue: Permission denied
**Solution**: Check user role has permission (admin/manager/staff)

### Issue: Validation failed
**Solution**: Check request matches Joi schema in validation.ts

### Issue: Account locked
**Solution**: Wait 15 minutes or reset in database

### Issue: Database connection error
**Solution**: 
```bash
docker-compose up -d postgres redis
docker-compose ps  # Verify containers running
```

### Issue: Port 3001 already in use
**Solution**: 
```bash
# Change PORT in .env.local
PORT=3002 npm run dev
```

---

## 📚 Where to Find Things

| Need | Location |
|------|----------|
| Constants | `src/config/constants.ts` |
| Middleware | `src/middleware/` |
| Auth logic | `src/services/auth.service.ts` |
| Types | `src/types/index.ts` |
| JWT utilities | `src/utils/jwt.ts` |
| Password utilities | `src/utils/bcrypt.ts` |
| Validation schemas | `src/middleware/validation.ts` |
| Database schema | `prisma/schema.prisma` |
| Seed data | `prisma/seed.ts` |
| Main app | `src/index.ts` |
| Environment vars | `.env.example` |
| Documentation | `README.md` |

---

## 🎓 Learn By Example

**Compare these two files:**
- `src/routes/auth.routes.ts` - Complete example
- `src/services/auth.service.ts` - Business logic pattern

Copy the pattern for your new features!

---

## 💬 Ask These Questions

- Is my route authenticated?
- Does the user have the required permission?
- Do I validate all inputs?
- Can this error happen? Am I catching it?
- Is this using the standard response format?
- Does this get logged to audit table?

If any answer is "no", your implementation isn't complete!

---

## 🎯 Your Mission

**This Week**: Add Lead CRUD API using these patterns
- Login works ✅
- Validation works ✅  
- Error handling works ✅
- Audit logging works ✅

**Just follow the pattern and add your business logic!**

---

**Still have questions?**
- Check README.md in backend folder
- Read BACKEND_FOUNDATION.md for architecture
- Look at src/middleware/ for patterns
- Check src/services/auth.service.ts for business logic example

**You've got this! 🚀**
