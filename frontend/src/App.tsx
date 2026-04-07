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
