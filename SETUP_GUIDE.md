# 🚀 Nemicare Development Environment Setup

**Last Updated**: April 4, 2026  
**Status**: ✅ READY FOR WEEK 1 KICKOFF (April 9)

---

## 📋 Prerequisites

Before starting, you need:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
- **Git** - [Download here](https://git-scm.com/)
- **VS Code** - [Download here](https://code.visualstudio.com/)

**Verify installation**:
```bash
node --version  # Should show v18+
npm --version   # Should show 9+
docker --version
git --version
```

---

## 🐳 Quick Start (Docker - Recommended)

**Option 1: Using Docker Compose (Easiest)**

1. **Clone the repository** (or navigate to project folder)
   ```bash
   cd ~/Desktop/HomeCare-Project-Development
   ```

2. **Create .env file** (copy from .env.example)
   ```bash
   cp .env.example .env
   ```

3. **Start everything** (database, backend, frontend)
   ```bash
   docker-compose up
   ```

4. **Wait for startup** (~30 seconds)
   ```
   ✅ postgres is healthy
   ✅ redis is healthy
   ✅ backend is running on http://localhost:3001
   ✅ frontend is running on http://localhost:3000
   ```

5. **Open in browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

---

## 🛠️ Local Development (Without Docker)

**Option 2: Local setup (for experienced developers)**

### 1. Install Dependencies

Backend:
```bash
cd backend
npm install
```

Frontend:
```bash
cd frontend
npm install
```

### 2. Setup Database

Create PostgreSQL database locally:
```bash
# If you have PostgreSQL installed
psql -U postgres -c "CREATE DATABASE nemicare_dev;"
```

Or use Docker just for PostgreSQL:
```bash
docker run --name postgres-nemicare -e POSTGRES_PASSWORD=nemicare_dev_password -d -p 5432:5432 postgres:15-alpine
```

### 3. Initialize Prisma

```bash
cd backend
npx prisma migrate dev --name init
```

### 4. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Should show: ✅ Backend server running on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Should show: ✅ Frontend running on http://localhost:3000
```

---

## ✅ Verify Everything Works

1. **Backend health check**
   ```bash
   curl http://localhost:3001/health
   # Response: { "status": "OK", "timestamp": "..." }
   ```

2. **Frontend loads**
   - Open http://localhost:3000
   - Should see "Nemicare HomeCare Platform"

3. **Database connects**
   ```bash
   npx prisma studio
   # Opens database GUI at http://localhost
   ```

---

## 📁 Project Structure

```
HomeCare-Project-Development/
├── backend/                    # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── middleware/        # Auth, RBAC, error handling (Week 1)
│   │   ├── routes/            # API routes (Week 1)
│   │   ├── controllers/       # Request handlers (Week 1)
│   │   ├── services/          # Business logic (Week 1)
│   │   ├── utils/             # Helpers (Week 1)
│   │   └── types/             # TypeScript types (Week 1)
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (Week 1)
│   │   └── seed.ts            # Sample data (Phase 2)
│   ├── tests/                 # Jest tests (Week 1)
│   ├── .env                   # Environment variables
│   ├── tsconfig.json          # TypeScript config
│   ├── package.json           # Dependencies
│   └── Dockerfile             # Docker config
│
├── frontend/                   # React + Vite + Redux
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── App.tsx            # Root component
│   │   ├── pages/             # Route pages (Week 1)
│   │   ├── components/        # Reusable components (Week 1)
│   │   ├── redux/             # State management (Week 1)
│   │   ├── services/          # API calls (Week 1)
│   │   ├── utils/             # Helpers (Week 1)
│   │   └── styles/            # Material-UI theming (Week 1)
│   ├── tests/                 # Jest tests (Week 1)
│   ├── vite.config.ts         # Vite config
│   ├── tsconfig.json          # TypeScript config
│   ├── index.html             # HTML entry
│   ├── package.json           # Dependencies
│   └── Dockerfile             # Docker config
│
├── docker-compose.yml         # Multi-container setup
├── .env.example               # Environment template
├── .gitignore                 # Git ignore
├── .eslintrc.json             # Linting rules
├── .prettierrc.json           # Code formatting
│
└── DOCUMENTATION/
    ├── ARCHITECTURE.md           # Database & API design
    ├── PHASED_DEVELOPMENT_PLAN.md  # 26-week roadmap
    ├── WEEKLY_EXECUTION_CHECKLIST.md  # Week-by-week tasks
    ├── .instructions.md          # Developer agent guide
    └── ... (other docs)
```

---

## 🔧 Common Commands

### Backend

```bash
cd backend

# Development
npm run dev              # Start with hot reload

# Testing
npm test                # Run Jest tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report

# Database
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio

# Code quality
npm run lint           # Check for errors
npm run format         # Auto-format code
npm run build          # Build for production
```

### Frontend

```bash
cd frontend

# Development
npm run dev             # Start dev server

# Testing
npm test               # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run e2e           # Run E2E tests (Playwright)

# Code quality
npm run lint          # Check for errors
npm run format        # Auto-format code
npm run build         # Build for production
npm run preview       # Preview production build
```

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Kill the process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "Cannot connect to database"
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it:
docker-compose up postgres
```

### "npm install fails"
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### "Module not found" errors
```bash
# Make sure TypeScript is compiled
npm run build

# Check tsconfig.json paths match imports
```

---

## 📚 Next Steps

1. ✅ **Verify setup works** (run through all steps above)
2. ✅ **Read ARCHITECTURE.md** (understand database & API design)
3. ✅ **Read .instructions.md** (understand developer agent & patterns)
4. ✅ **Read PHASED_DEVELOPMENT_PLAN.md** (understand roadmap)
5. ✅ **Attend Week 1 kickoff** (Monday, April 9, 2026, 8 AM)

---

## 🆘 Need Help?

- **Architecture questions**: Check ARCHITECTURE.md
- **Development patterns**: Check .instructions.md
- **Schedule/timeline**: Check PHASED_DEVELOPMENT_PLAN.md
- **This week's tasks**: Check WEEKLY_EXECUTION_CHECKLIST.md
- **Ask the developer agent**: Use the .instructions.md context

---

## ✨ You're Ready!

Everything is set up. When you start coding:

```bash
# Open 2 terminals:

# Terminal 1:
cd backend
npm run dev

# Terminal 2:
cd frontend
npm run dev

# Visit http://localhost:3000 and start building!
```

**See you at the kickoff on April 9! 🚀**

---

**Questions?** Ask me anything in your favorite IDE - I'm loaded with full Nemicare context!
