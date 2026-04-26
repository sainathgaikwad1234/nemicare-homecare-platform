import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './App.css'

// Context & Providers
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Components
import { ProtectedRoute } from './components/ProtectedRoute'
import { MainLayout } from './components/Layout/MainLayout'

// Pages
import { LoginPage } from './pages/Login'
import { DashboardPage } from './pages/Dashboard'
import { LeadManagementPage } from './pages/LeadManagement'
import { ResidentManagementPage } from './pages/ResidentManagement'
import { LeadDetailPage } from './pages/LeadDetail'
import { ResidentDetailPage } from './pages/ResidentDetail'
import { AttendancePage } from './pages/Attendance'
import HrmsLayout from './components/Layout/HrmsLayout'
import EmployeesListPage from './pages/hrms/EmployeesList'
import EmployeeProfilePage from './pages/hrms/EmployeeProfile'
import OnboardingListPage from './pages/hrms/OnboardingList'
import OnboardingProfilePage from './pages/hrms/OnboardingProfile'
import ShiftCalendarPage from './pages/hrms/ShiftCalendar'
import LeavesPage from './pages/hrms/Leaves'
import MeHomePage from './pages/hrms/MeHome'
import MeShiftsPage from './pages/hrms/MeShifts'
import MeLeavesPage from './pages/hrms/MeLeaves'
import MeProfilePage from './pages/hrms/MeProfile'
import MeTasksPage from './pages/hrms/MeTasks'
import ReviewsPage from './pages/hrms/Reviews'
import ExitsPage from './pages/hrms/Exits'
import MeTimecardsPage from './pages/hrms/MeTimecards'
import TimecardsPage from './pages/hrms/Timecards'
import PayrollPage from './pages/hrms/Payroll'
import SystemJobsPage from './pages/hrms/SystemJobs'
import ShiftChangeQueuePage from './pages/hrms/ShiftChangeQueue'
import MeReviewsPage from './pages/hrms/MeReviews'
import ReportsPage from './pages/hrms/Reports'
import NoticeBoardPage from './pages/hrms/NoticeBoard'
import MessagesPage from './pages/hrms/Messages'
import HrAdminDashboardPage from './pages/hrms/HrAdminDashboard'
import SupervisorDashboardPage from './pages/hrms/SupervisorDashboard'
import HrAdminConsolePage from './pages/hrms/HrAdminConsole'

// Material-UI Theme - Matching Figma dark blue design system
const theme = createTheme({
  palette: {
    primary: {
      
      main: '#1e3a5f',
      light: '#3b82f6',
      dark: '#1e2d4a',
    },
    secondary: {
      main: '#1e40af',
    },
    background: {
      default: '#f5f6fa',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
})

function HrmsHomeRedirect() {
  const { hasPermission } = useAuth()
  // Sprint 5.9 — Route to role-specific dashboard
  if (hasPermission('employees.create')) {
    return <Navigate to="/hrms/dashboard" replace />
  }
  if (hasPermission('shifts.create')) {
    return <Navigate to="/hrms/supervisor-dashboard" replace />
  }
  return <Navigate to="/hrms/me/home" replace />
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null // Let Auth context handle loading UI
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <MainLayout>
              <LeadManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <LeadDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/residents"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ResidentManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/residents/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ResidentDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AttendancePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* HRMS routes - all wrapped with HrmsLayout (top nav + icon-only sidebar) */}
      <Route path="/hrms" element={<HrmsHomeRedirect />} />

      <Route
        path="/hrms/employees"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><EmployeesListPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/employees/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><EmployeeProfilePage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/onboarding"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><OnboardingListPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/onboarding/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><OnboardingProfilePage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/shifts"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><ShiftCalendarPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/leaves"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><LeavesPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Employee self-service routes */}
      <Route
        path="/hrms/me"
        element={<Navigate to="/hrms/me/home" replace />}
      />

      <Route
        path="/hrms/me/home"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><MeHomePage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/me/shifts"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><MeShiftsPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/me/leaves"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><MeLeavesPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/me/profile"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><MeProfilePage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/me/tasks"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><MeTasksPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/reviews"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><ReviewsPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/exits"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><ExitsPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/me/timecards"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><MeTimecardsPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/timecards"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><TimecardsPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/payroll"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><PayrollPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/system-jobs"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><SystemJobsPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/shift-changes"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><ShiftChangeQueuePage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/me/reviews"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><MeReviewsPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/reports"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><ReportsPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/notices"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><NoticeBoardPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/me/notices"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><NoticeBoardPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/messages"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><MessagesPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/me/messages"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><MessagesPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><HrAdminDashboardPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/supervisor-dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><SupervisorDashboardPage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hrms/console"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HrmsLayout><HrAdminConsolePage /></HrmsLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Redirect old /employees URLs to new HRMS module */}
      <Route path="/employees" element={<Navigate to="/hrms/employees" replace />} />
      <Route path="/employees/:id" element={<Navigate to="/hrms/employees" replace />} />

      {/* Redirect root to dashboard or login based on auth state */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
