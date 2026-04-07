# Frontend Implementation Guide - Week 1

## 🚀 Overview

Complete production-grade React/TypeScript frontend matching your Figma designs. Built to integrate seamlessly with 16 backend APIs.

**Status**: Phase 1 Complete ✅
- Authentication system (login, token refresh, protected routes)
- API client service with error handling
- Layout components (header, sidebar, main layout)
- Reusable components (DataTable, Form, Dialog)
- 2 complete pages (Login, Dashboard, Lead Management)
- Material-UI theme matching design system

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── services/
│   │   ├── api.ts              # HTTP client with middleware
│   │   ├── auth.service.ts     # Authentication methods
│   │   └── lead.service.ts     # Lead API methods
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx     # Global auth state + hook
│   │
│   ├── components/
│   │   ├── ProtectedRoute.tsx  # Route guard component
│   │   ├── DataTable.tsx       # Reusable table component
│   │   ├── FormDialog.tsx      # Modal dialog wrapper
│   │   ├── Layout/
│   │   │   ├── Header.tsx      # Top navigation bar
│   │   │   ├── Sidebar.tsx     # Side navigation
│   │   │   └── MainLayout.tsx  # Layout wrapper
│   │   └── Forms/
│   │       └── LeadForm.tsx    # Lead form with validation
│   │
│   ├── pages/
│   │   ├── Login.tsx           # Login page
│   │   ├── Dashboard.tsx       # Home/dashboard page
│   │   └── LeadManagement.tsx  # Lead management page
│   │
│   ├── App.tsx                 # Main app + routing
│   └── index.css               # Global styles
│
├── .env.local                  # Local environment config
├── .env.example                # Environment template
└── package.json                # Dependencies
```

---

## 🔌 API Integration Pattern

### 1. API Client Service (`services/api.ts`)

Centralized HTTP client with:
- Automatic token injection
- Request/response interceptors
- Token refresh logic (automatic retry on 401)
- Error handling with AppError pattern
- Pagination support

**Usage**:
```typescript
import { apiClient } from './services/api';

// Simple GET
const response = await apiClient.get<Lead>('/api/v1/leads/1');

// GET with pagination
const paginated = await apiClient.getPaginated<Lead>(
  '/api/v1/leads',
  page,
  pageSize
);

// POST with data
const response = await apiClient.post<Lead>('/api/v1/leads', {
  firstName: 'John',
  lastName: 'Doe',
});
```

### 2. Domain Services (`services/*.service.ts`)

Type-safe wrappers around apiClient:

```typescript
import { leadService } from './services/lead.service';

// Get leads with filtering
const response = await leadService.getLeads({
  page: 1,
  pageSize: 10,
  status: 'PROSPECT',
  search: 'john',
});

// Create lead
const response = await leadService.createLead({
  firstName: 'John',
  email: 'john@example.com',
  // ... other fields
});

// Update lead
const response = await leadService.updateLead(leadId, {
  status: 'QUALIFIED',
});

// Delete lead
await leadService.deleteLead(leadId);
```

---

## 🔐 Authentication & Authorization

### Login Flow

1. User enters credentials → calls `authService.login()`
2. Backend returns access + refresh tokens
3. Tokens saved to localStorage & apiClient
4. User redirected to /dashboard
5. Protected routes check `useAuth()` hook

### Protected Routes

```typescript
<Route
  path="/leads"
  element={
    <ProtectedRoute requiredPermission="VIEW_LEADS">
      <MainLayout>
        <LeadManagementPage />
      </MainLayout>
    </ProtectedRoute>
  }
/>
```

### Using Auth in Components

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, hasPermission, logout } = useAuth();

  if (!hasPermission('CREATE_LEADS')) {
    return <div>You don't have permission</div>;
  }

  return <button onClick={logout}>Logout</button>;
}
```

---

## 🎨 Component Patterns

### DataTable Component

Generic, reusable table with pagination, search, sorting:

```typescript
<DataTable<Lead>
  columns={[
    { id: 'firstName', label: 'First Name' },
    { id: 'email', label: 'Email' },
    {
      id: 'status',
      label: 'Status',
      format: (value) => <Chip label={value} />,
    },
  ]}
  data={leads}
  isLoading={isLoading}
  onRowClick={(lead) => handleEdit(lead)}
  totalCount={totalCount}
  page={page}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
  onSearch={setSearch}
  searchPlaceholder="Search leads..."
/>
```

### FormDialog Component

Modal dialog for create/edit forms:

```typescript
<FormDialog
  open={openDialog}
  title={isEdit ? 'Edit Lead' : 'Add Lead'}
  onClose={() => setOpenDialog(false)}
  onSubmit={handleSaveFormData}
  isLoading={isSaving}
  submitLabel={isEdit ? 'Update' : 'Create'}
>
  <LeadForm lead={selectedLead} onChange={setFormData} />
</FormDialog>
```

### LeadForm Component

Pre-built form with all lead fields:

```typescript
<LeadForm
  lead={lead}  // Undefined for create, object for edit
  isLoading={isLoading}
  error={error}
  onChange={(data) => setFormData(data)}
/>
```

---

## 📖 Building Additional Pages (Week 2)

### Pattern for New CRUD Pages

1. **Create Service** (`services/resident.service.ts`):
```typescript
class ResidentService {
  async getResidents(options) { /* ... */ }
  async getResidentById(id) { /* ... */ }
  async createResident(input) { /* ... */ }
  async updateResident(id, input) { /* ... */ }
  async deleteResident(id) { /* ... */ }
  async dischargeResident(id, date, reason) { /* ... */ }
}
export const residentService = new ResidentService();
```

2. **Create Form** (`components/Forms/ResidentForm.tsx`):
   - Copy LeadForm.tsx
   - Replace lead fields with resident fields
   - Add medical data fields (allergies, medications, etc.)

3. **Create Page** (`pages/ResidentManagement.tsx`):
   - Copy LeadManagementPage.tsx
   - Replace leadService with residentService
   - Update columns, table structure, form

4. **Add Route** in `App.tsx`:
```typescript
<Route
  path="/residents"
  element={
    <ProtectedRoute requiredPermission="VIEW_RESIDENTS">
      <MainLayout>
        <ResidentManagementPage />
      </MainLayout>
    </ProtectedRoute>
  }
/>
```

5. **Estimated Time**: 45 minutes per page

---

## 🎯 Current Pages & Status

### ✅ Completed Pages

1. **Login Page** (`pages/Login.tsx`)
   - Email/password form
   - Demo account info displayed
   - Error handling
   - Loading state
   - Figma design: Clean, modern gradient background

2. **Dashboard Page** (`pages/Dashboard.tsx`)
   - Welcome message with user name
   - 4 stat cards (Leads, Residents, Visits, Trend)
   - Quick action buttons
   - Recent activity placeholder
   - Permission-based card visibility

3. **Lead Management Page** (`pages/LeadManagement.tsx`)
   - Leads table with pagination
   - Search functionality
   - Add/Edit/Delete operations
   - Status badges with color coding
   - Success/error notifications
   - Form dialog for create/edit
   - Permission checks on all actions

### 🔄 Week 2 Pages (50 minutes each)

- [ ] Resident Management (similar to Lead page)
- [ ] Schedule/Visit Management
- [ ] Document Management
- [ ] Attendance Tracking
- [ ] Reports & Analytics

---

## 🔧 Setup & Running

### First-Time Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create .env.local (already done)
cp .env.example .env.local

# Start development server
npm run dev
```

**Frontend runs at**: http://localhost:5173
**Backend API**: http://localhost:3001

### Verify Connection

1. Go to http://localhost:5173/login
2. Enter test credentials:
   - Email: `admin@demo.nemicare.local`
   - Password: `Admin@123456`
3. Should redirect to dashboard
4. Check browser DevTools → Network to see API calls

---

## 📊 API Response Handling

### Success Response Format

```typescript
{
  success: true,
  status: 200,
  data: Lead | Lead[] | null,
  message?: string
}
```

### Error Response Format

```typescript
{
  success: false,
  status: 400 | 401 | 404 | 500,
  error: 'error message',
  message?: 'error message'
}
```

### Example Usage

```typescript
const response = await leadService.getLeads({ page: 1 });

if (response.success && response.data) {
  setLeads(response.data);
} else {
  showError(response.error || 'Failed to load leads');
}
```

---

## 🛡️ Error Handling Best Practices

### In Component State

```typescript
const [error, setError] = useState('');
const [isLoading, setIsLoading] = useState(false);

try {
  setError('');
  setIsLoading(true);
  const response = await leadService.getLeads();
  if (!response.success) {
    setError(response.error || 'Unknown error');
  } else {
    setLeads(response.data);
  }
} catch (err) {
  setError('Network error');
} finally {
  setIsLoading(false);
}
```

### Display Error to User

```typescript
{error && <Alert severity="error">{error}</Alert>}
```

---

## 🎨 Theme & Styling

### Material-UI Theme Config

Located in `App.tsx`:
- Primary color: `#667eea`
- Secondary color: `#764ba2`
- Background: `#f5f5f5`

### Adding Custom Styles

```typescript
sx={{
  backgroundColor: '#fff',
  borderRadius: 1,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' },
}}
```

---

## 📱 Responsive Design

All components use Material-UI's `useMediaQuery` hook:

```typescript
const isMobile = useMediaQuery(theme.breakpoints.down('md'));
```

- **xs**: 0px (phones)
- **sm**: 600px (tablets)
- **md**: 960px (desktops)
- **lg**: 1280px (large screens)

---

## 🧪 Testing Approach

### Unit Tests (Jest)
- Service methods test
- API client test
- Context provider test

### Integration Tests (React Testing Library)
- Page rendering
- User interactions
- API mocking with MSW

### E2E Tests (Playwright)
- Login flow
- Create/Edit/Delete operations
- Permission enforcement

---

## 📝 Development Checklist

### Before Commit
- [ ] Code follows TypeScript strict mode
- [ ] No console.log statements
- [ ] Error handling for all API calls
- [ ] Success/error notifications displayed
- [ ] Loading states implemented
- [ ] Responsive design verified
- [ ] Permission checks in place
- [ ] No hardcoded IDs/values

### Before Push to Production
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] API URL environment variable set
- [ ] Build succeeds: `npm run build`
- [ ] Bundle size acceptable
- [ ] Performance metrics good

---

## 🤝 Common Tasks

### Add A New Table Column

```typescript
const columns: Column<Lead>[] = [
  // ... existing columns
  {
    id: 'newField' as keyof Lead,
    label: 'New Field Label',
    format: (value) => value.toUpperCase(),
  },
];
```

### Add A New Form Field

```typescript
// In LeadForm.tsx
<Grid item xs={12}>
  <TextField
    fullWidth
    label="New Field"
    value={formData.newField}
    onChange={(e) => handleChange('newField', e.target.value)}
  />
</Grid>
```

### Add Permission Check

```typescript
const { hasPermission } = useAuth();

if (!hasPermission('CREATE_LEADS')) {
  return <div>No permission</div>;
}
```

### Add New Service Method

```typescript
// In services/lead.service.ts
async convertLeadToResident(leadId: string, facilityId: string) {
  return apiClient.post(
    `/api/v1/leads/${leadId}/convert`,
    { facilityId }
  );
}
```

---

## 📦 Dependencies

### Key Packages
- **react**: UI library
- **react-router-dom**: Routing
- **@mui/material**: Component library
- **@emotion/react**: Styling
- **react-hook-form**: Form handling
- **yup**: Validation
- **axios**: (optional) HTTP client

### Scripts
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run test` — Run tests
- `npm run lint` — Check code quality
- `npm run format` — Format code

---

## 🚨 Troubleshooting

### 401 Unauthorized After Login
- Check Backend is running on port 3001
- Verify .env.local has correct REACT_APP_API_URL
- Check token is saved to localStorage
- Check Authorization header is sent in requests

### CORS Errors
- Backend must have CORS enabled
- Check `origin` in backend CORS config includes frontend URL
- Ensure content-type is application/json

### Page Doesn't Render After Navigation
- Check route is defined in App.tsx
- Verify component is exported properly
- Check console for import errors

---

## 🎖️ Code Quality Standards

All code follows these patterns established in Phase 1:

1. **TypeScript Strict Mode** - All files use strict typing
2. **Service Layer** - Business logic separated from components
3. **Middleware Pattern** - API client with interceptors
4. **Context Hooks** - Global state via useAuth()
5. **Error Handling** - Try/catch + user-friendly messages
6. **Loading States** - All async operations show loading
7. **Responsive Design** - Works on mobile/tablet/desktop
8. **Accessibility** - ARIA labels, semantic HTML
9. **Code Organization** - Services/Components/Pages hierarchy
10. **Documentation** - JSDoc comments on all public functions

---

## 📞 Support & Questions

**Frontend Lead**: Pair program on new pages to establish pattern
**Backend Integration**: Test with actual APIs Monday morning
**Design Clarifications**: Reference Figma designs in project-docs/figma-screens/

---

**Last Updated**: April 4, 2024
**Frontend Status**: 🟢 Phase 1 Ready for Team
**Next Milestone**: Week 2 (Resident + Schedule pages)
