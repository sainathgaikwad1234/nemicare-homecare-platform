import express, { Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Import middleware
import { requestMetadata } from './middleware/request';
import { loggerMiddleware, logger } from './middleware/logger';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errors';
import { authenticate } from './middleware/auth';
import { auditLogger } from './middleware/audit';

// Import routes
import authRoutes from './routes/auth.routes';
import { leadRoutes } from './routes/lead.routes';
import { leadActivityRoutes } from './routes/leadActivity.routes';
import { residentRoutes } from './routes/resident.routes';
import { chartingRoutes } from './routes/charting.routes';
import { attendanceRoutes } from './routes/attendance.routes';
import { dischargeRoutes } from './routes/discharge.routes';
import { patientSetupRoutes } from './routes/patientSetup.routes';
import { employeeRoutes } from './routes/employee.routes';
import { onboardingRoutes } from './routes/onboarding.routes';
import { shiftRoutes } from './routes/shift.routes';
import { leaveRoutes } from './routes/leave.routes';
import { meRoutes } from './routes/me.routes';
import { taskRoutes, meTaskRoutes, reviewRoutes, exitRoutes } from './routes/phase4.routes';
import {
  employeeAttendanceRoutes,
  meTimecardRoutes,
  supervisorTimecardRoutes,
  payrollRoutes,
  facilityConfigRoutes,
} from './routes/phase5.routes';
import { jobsRoutes } from './routes/jobs.routes';
import { meShiftChangeRoutes, supervisorShiftChangeRoutes } from './routes/shiftChange.routes';
import { onboardingExtrasRoutes } from './routes/onboardingExtras.routes';
import { noticeBoardRoutes, messageRoutes, reportsRoutes } from './routes/phase5b.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import {
  activityLogRoutes, incidentRoutes, recognitionRoutes, payrollSettingsRoutes,
  trainingRoutes, employeeTrainingRoutes, peerSwapRoutes, docSignRoutes,
} from './routes/phase5c.routes';
import { startCronJobs, stopCronJobs } from './jobs';

// Import Swagger
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Import utils
import { helpers } from './utils/helpers';
import { HTTP_STATUS, RATE_LIMIT } from './config/constants';
import { ApiResponse } from './types';

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// MIDDLEWARE STACK - ORDER MATTERS
// ============================================

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request metadata (request ID, start time)
app.use(requestMetadata);

// Logging
app.use(loggerMiddleware);

// Rate limiting (skipped in development to avoid blocking active testing)
const limiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: NODE_ENV === 'production' ? RATE_LIMIT.MAX_REQUESTS : 10000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Audit logging (logs all requests)
app.use(auditLogger);

// ============================================
// HEALTH CHECK (no auth required)
// ============================================

app.get(
  '/health',
  asyncHandler(async (req: any, res: Response) => {
    const response: ApiResponse = {
      success: true,
      status: HTTP_STATUS.OK,
      data: {
        message: 'Backend service is running',
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      meta: {
        timestamp: helpers.getCurrentTimestamp(),
        requestId: req.requestId,
      },
    };

    res.status(HTTP_STATUS.OK).json(response);
  })
);

// ============================================
// API ROUTES
// ============================================

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Nemicare API Documentation',
}));

// JSON spec endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Authentication routes (no auth required for login/refresh)
app.use('/api/v1/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/leads', leadActivityRoutes);
app.use('/api/v1/residents', residentRoutes);
app.use('/api/v1/residents/:residentId/charting', chartingRoutes);
app.use('/api/v1/residents/:residentId/discharge-full', dischargeRoutes);
app.use('/api/v1/residents/:residentId/setup', patientSetupRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/shifts', shiftRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/me', meRoutes);
app.use('/api/v1/me/tasks', meTaskRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/performance-reviews', reviewRoutes);
app.use('/api/v1/exits', exitRoutes);
app.use('/api/v1/me/attendance', employeeAttendanceRoutes);
app.use('/api/v1/me/timecards', meTimecardRoutes);
app.use('/api/v1/timecards', supervisorTimecardRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/facility-config', facilityConfigRoutes);
app.use('/api/v1/jobs', jobsRoutes);
app.use('/api/v1/me/shift-change-requests', meShiftChangeRoutes);
app.use('/api/v1/shift-change-requests', supervisorShiftChangeRoutes);
app.use('/api/v1/employees', onboardingExtrasRoutes);
app.use('/api/v1/notices', noticeBoardRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/activity-log', activityLogRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/recognitions', recognitionRoutes);
app.use('/api/v1/payroll-settings', payrollSettingsRoutes);
app.use('/api/v1/training', trainingRoutes);
app.use('/api/v1/employees', employeeTrainingRoutes);
app.use('/api/v1/shift-change-requests', peerSwapRoutes);
app.use('/api/v1/employees', docSignRoutes);

// ============================================
// ERROR HANDLING - MUST BE LAST
// ============================================

// 404 handler (must come before error handler)
app.use(notFoundHandler);

// Global error handler (must come last)
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server started`, {
    port: PORT,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
  startCronJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  stopCronJobs();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  stopCronJobs();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
  process.exit(1);
});

export default app;
