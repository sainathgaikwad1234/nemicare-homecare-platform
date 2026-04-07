# Coding Patterns & Conventions

## Backend Patterns

- **Architecture**: Routes → Middleware → Services → Prisma (layered)
- **Naming**: camelCase for files and variables; PascalCase for types/interfaces
- **Route files**: `<entity>.routes.ts` — export named `<entity>Routes` (except auth uses default)
- **Service files**: `<entity>.service.ts` — export const object with methods
- **Middleware chain**: `authenticate → requirePermission('PERM') → validate('schema') → asyncHandler(handler)`
- **Error handling**: Custom `AppError` class with `statusCode`, `code`, `message`, `details`
- **Async errors**: Wrapped in `asyncHandler()` utility (no try/catch in routes)
- **Validation**: Joi schemas in `middleware/validation.ts`, called as `validate('schemaKey')` or `validate({ body: schema })`
- **Response format**: `{ success, status, data, pagination?, meta: { timestamp, requestId } }`
- **Soft delete**: `deletedAt` field, queries filter `deletedAt: null`
- **Multi-tenancy**: All queries scoped by `companyId` from JWT payload
- **Audit logging**: HIPAA-compliant, middleware intercepts all responses

## Frontend Patterns

- **State**: Context for auth, services for API calls (no Redux for data yet)
- **API Client**: Singleton class with auto token refresh and 401 handling
- **Protected routes**: `<ProtectedRoute requiredPermission="PERM">` wrapper
- **Forms**: React Hook Form + Yup validation
- **UI**: Material-UI (MUI) components throughout

## Security Patterns

- JWT access token (15min) + refresh token (7 days)
- Account lockout after 5 failed login attempts (15 min lock)
- Rate limiting: 100 requests per 15-minute window
- Helmet security headers
- CORS configured for frontend origin
- Password hashing with bcrypt (10 rounds)
- Request ID tracking on all requests

## Healthcare / HIPAA

- Audit log on every API request (userId, companyId, action, entity, IP, user-agent)
- SSN field on Resident (marked as "would be encrypted in production")
- MedicaidConfig stores API credentials (marked for encryption)
- Feature flags for HIPAA controls in `.env`
- 7-year audit retention configured (HIPAA_AUDIT_RETENTION_DAYS=2555)

## Testing Patterns

- **E2E**: Playwright with Page Object Model (BasePage → LoginPage)
- **API tests**: Playwright `request` context
- **Performance**: k6 scripts (load, stress, spike, soak)
- **Test data**: Faker.js for generated data
- **Explorer**: Custom site crawler for discovering pages/forms
