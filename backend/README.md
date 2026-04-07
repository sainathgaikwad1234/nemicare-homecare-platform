# Nemicare Backend - Development Environment

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (copy from .env.example)
cp .env.example .env.local

# 3. Start local databases (Docker)
docker-compose up -d postgres redis

# 4. Wait for databases to be healthy (~30 seconds), then initialize database
npx prisma migrate dev --name init
npx prisma db seed

# 5. Start development server (watch mode)
npm run dev
```

Backend will be running on **http://localhost:3001**

## Environment Variables

See `.env.example` for all available options.

**Critical variables**:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (change in production!)
- `REFRESH_SECRET` - Secret key for refresh tokens
- `CORS_ORIGIN` - Frontend URL for CORS
- `LOG_LEVEL` - Logging level (info, debug, error, warn)

## Architecture

```
src/
├── config/          # Configuration constants
├── middleware/      # Express middleware (auth, error handling, validation, logging)
├── routes/          # API route handlers
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (JWT, password hashing, helpers)
├── index.ts         # Main Express app (all middleware and routes)
└── logs/            # Log files (created at runtime)
```

## Middleware Pipeline

```
Request comes in
  ↓
Helmet (security headers)
  ↓
CORS
  ↓
Body parsing (JSON)
  ↓
Request metadata (ID, timestamp)
  ↓
Logger
  ↓
Rate limiter (100 req/15min)
  ↓
Audit logger (HIPAA compliance)
  ↓
Route handler
  ↓
Error handler (catches everything)
```

## Authentication Flow

1. **Login** → `POST /api/v1/auth/login`
   - Email + password
   - Returns: `accessToken` (15m) + `refreshToken` (7d)

2. **Protected Routes** → Attach token
   - Header: `Authorization: Bearer <accessToken>`
   - Middleware validates token and extracts user context

3. **Token Refresh** → `POST /api/v1/auth/refresh`
   - Send refresh token
   - Returns: new access token

## RBAC System

Users have **Roles** → Roles have **Permissions**

Example permissions:
- `leads.read`, `leads.create`, `leads.update`, `leads.delete`
- `residents.read`, `residents.create`, `residents.update`
- `billing.read`, `billing.create`
- `charting.read`, `charting.create`, `charting.sign`
- `users.read`, `users.create`, `users.delete`
- `audit.read`

Routes use:
```typescript
router.get('/leads', authenticate, requirePermission('leads.read'), handler);
```

## API Response Format

**Success**:
```json
{
  "success": true,
  "status": 200,
  "data": { ... },
  "meta": {
    "timestamp": "2024-04-04T15:30:00.000Z",
    "requestId": "req-abc123"
  }
}
```

**Error**:
```json
{
  "success": false,
  "status": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": { "email": "Must be valid email" }
  },
  "meta": {
    "timestamp": "2024-04-04T15:30:00.000Z",
    "requestId": "req-abc123"
  }
}
```

## Testing Locally

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.nemicare.local",
    "password": "Admin@123456"
  }'
```

### Protected Route (with token)
```bash
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer <your_access_token>"
```

### Health Check
```bash
curl http://localhost:3001/health
```

## Database

PostgreSQL 14+ with Prisma ORM.

**Schema**: `backend/prisma/schema.prisma`  
**Migrations**: `backend/prisma/migrations/`

Common commands:
```bash
# Create a new migration after schema changes
npx prisma migrate dev --name <description>

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in browser
npx prisma studio

# Generate Prisma client
npx prisma generate
```

## Logging

Winston logger configured with:
- Console output (development)
- File output (`logs/combined.log`, `logs/error.log`)
- JSON format for structured logging
- Log levels: error, warn, info, debug

Access logs at `logs/` directory.

## Development Commands

```bash
# Start development server (watches for changes)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Check test coverage
npm test:coverage

# Lint code
npm run lint

# Format code with Prettier
npm run format

# Type check
npm run type-check

# Prisma studio (database browser)
npx prisma studio
```

## Common Issues

### Port already in use
```bash
# Change port in .env
PORT=3002
```

### Database connection refused
```bash
# Make sure PostgreSQL is running
docker-compose up postgres
# Wait 30 seconds for health check to pass
```

### Prisma client out of sync
```bash
# Regenerate Prisma client
npx prisma generate
```

### Missing env variables
```bash
# Copy example and update with your values
cp .env.example .env.local
```

## Debugging

Enable debug mode:
```bash
export DEBUG=nemicare:*
npm run dev
```

Or in VS Code `launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/backend/node_modules/tsx/dist/cli.mjs",
  "args": ["watch", "src/index.ts"],
  "restart": true,
  "console": "integratedTerminal",
  "env": { "DEBUG": "nemicare:*" }
}
```

## Production Notes

⚠️ **Before deploying**:
1. Change `JWT_SECRET` and `REFRESH_SECRET` to strong random values
2. Use PostgreSQL managed database (AWS RDS, Heroku)
3. Enable SSL for database connections
4. Set `NODE_ENV=production`
5. Use environment variables from secrets manager (AWS Secrets Manager, Vault)
6. Enable HTTPS/TLS
7. Set appropriate `CORS_ORIGIN`
8. Enable rate limiting/DDoS protection
9. Monitor logs and errors (Sentry, DataDog)
10. Regular database backups

## Next Steps

- Add Lead management API endpoints
- Add Resident management API endpoints
- Add Billing system endpoints
- Add Clinical charting endpoints
- Add comprehensive test suite
- Add API documentation (Swagger)
- Add database migrations workflow
