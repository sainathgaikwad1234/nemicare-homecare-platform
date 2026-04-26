import { prisma } from '../config/database';

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export const dashboardService = {
  // ============================================
  // FACILITY DASHBOARD — Care/Operations view
  // ============================================
  async facility(companyId: number, facilityId: number | null) {
    const today = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const startMonth = new Date(today); startMonth.setDate(1);
    const startWeek = startOfDay(addDays(today, -6));

    const facilityFilter = facilityId ? { facilityId } : {};

    // Wrap each query in its own try/catch so one failure doesn't kill the whole dashboard
    const safe = async <T>(promise: Promise<T>, fallback: T): Promise<T> => {
      try { return await promise; } catch (e) { console.error('facility-dashboard query failed:', (e as Error).message); return fallback; }
    };

    const activeResidents = await safe(
      (prisma as any).resident.count({
        where: { companyId, ...facilityFilter, status: 'ACTIVE', deletedAt: null },
      }), 0);

    const newLeadsCount = await safe(
      (prisma as any).lead.count({
        where: { companyId, ...facilityFilter, createdAt: { gte: startMonth }, status: { in: ['PROSPECT', 'QUALIFIED', 'DOCUMENTATION'] } },
      }), 0);

    const attendanceMtd = await safe(
      (prisma as any).attendance.count({
        where: { companyId, ...facilityFilter, date: { gte: startMonth, lte: todayEnd }, status: 'PRESENT' },
      }), 0);

    const visitsToday = await safe(
      (prisma as any).visit.count({
        where: { companyId, ...facilityFilter, scheduledDate: { gte: today, lte: todayEnd } },
      }), 0);

    const todaysMembersRaw = await safe(
      (prisma as any).resident.findMany({
        where: { companyId, ...facilityFilter, status: 'ACTIVE', deletedAt: null },
        select: {
          id: true, firstName: true, lastName: true, primaryService: true,
          billingType: true, status: true,
          admissionDate: true, dob: true,
        },
        orderBy: { admissionDate: 'desc' },
        take: 8,
      }), [] as any[]);

    const weekShifts: any[] = await safe(
      (prisma as any).attendance.findMany({
        where: { companyId, ...facilityFilter, date: { gte: startWeek, lte: todayEnd } },
        select: { date: true, status: true, resident: { select: { primaryService: true } } },
      }), []);

    // Group attendance by day + service type
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData: Record<string, { day: string; adh: number; alf: number; homeCare: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const key = d.toISOString().slice(0, 10);
      weekData[key] = { day: dayLabels[d.getDay()], adh: 0, alf: 0, homeCare: 0 };
    }
    for (const a of weekShifts) {
      const key = startOfDay(a.date).toISOString().slice(0, 10);
      const bucket = weekData[key];
      if (!bucket) continue;
      const svc = a.resident?.primaryService;
      if (svc === 'ADULT_DAY_HEALTH') bucket.adh++;
      else if (svc === 'ASSISTED_LIVING') bucket.alf++;
      else bucket.homeCare++;
    }

    return {
      kpis: {
        activeMembers: activeResidents,
        newLeads: newLeadsCount,
        attendanceMtd: attendanceMtd,
        visitsToday: visitsToday,
      },
      todaysMembers: todaysMembersRaw.map((r: any) => ({
        id: r.id,
        name: `${r.firstName} ${r.lastName}`,
        avatar: `${r.firstName?.[0] || ''}${r.lastName?.[0] || ''}`.toUpperCase(),
        time: r.admissionDate ? new Date(r.admissionDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—',
        serviceType: r.primaryService === 'ADULT_DAY_HEALTH' ? 'ADH' : r.primaryService === 'ASSISTED_LIVING' ? 'ALF' : 'Home Care',
        transport: r.primaryService === 'ADULT_DAY_HEALTH' ? '🚐' : '—',
        status: 'Active',
        profilePictureUrl: null,
      })),
      attendanceChart: Object.values(weekData),
      paAuthorizations: [], // TODO: Phase 2 — derive from billing.paNumber expiration
      vitalsDue: [],         // TODO: Phase 2 — derive from charting due-date schedule
    };
  },

  async hrAdmin(companyId: number) {
    const today = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const tomorrow = startOfDay(addDays(new Date(), 1));
    const tomorrowEnd = endOfDay(addDays(new Date(), 1));
    const next7 = addDays(today, 7);

    // Pending approvals
    const [
      pendingHrLeaves, pendingTimecards, pendingShiftChanges, pendingReviews, pendingExits,
      onboardingInProgress, expiredDocs, expiringTests7, failedJobsToday,
      todayShifts, tomorrowShifts,
      activeEmployees, recentNotices,
      lastPayroll,
    ] = await Promise.all([
      (prisma as any).leaveRequest.count({
        where: { companyId, supervisorApprovalStatus: 'APPROVED', hrApprovalStatus: 'PENDING' },
      }),
      (prisma as any).timesheet.count({
        where: { companyId, status: 'SUBMITTED' },
      }),
      (prisma as any).shiftChangeRequest.count({
        where: { companyId, status: 'PENDING' },
      }),
      (prisma as any).performanceReview.count({
        where: { companyId, status: 'SUBMITTED' },
      }),
      (prisma as any).employeeExit.count({
        where: { companyId, status: { in: ['INITIATED', 'IN_PROGRESS'] } },
      }),
      (prisma as any).employee.count({
        where: { companyId, deletedAt: null, onboardingStatus: 'IN_PROGRESS' },
      }),
      (prisma as any).employeeDocument.count({
        where: { employee: { companyId }, expiryDate: { lt: today } },
      }),
      (prisma as any).employeeTest.count({
        where: { companyId, expiryDate: { gte: today, lte: next7 }, status: { in: ['PASSED', 'PENDING'] } },
      }),
      (prisma as any).jobRunLog.count({
        where: { companyId, status: 'FAILED', startedAt: { gte: today } },
      }),
      (prisma as any).shiftSchedule.findMany({
        where: { companyId, shiftDate: { gte: today, lte: todayEnd }, status: 'SCHEDULED' },
      }),
      (prisma as any).shiftSchedule.findMany({
        where: { companyId, shiftDate: { gte: tomorrow, lte: tomorrowEnd }, status: 'SCHEDULED' },
      }),
      (prisma as any).employee.count({
        where: { companyId, deletedAt: null, status: 'ACTIVE' },
      }),
      (prisma as any).noticeBoard.findMany({
        where: { companyId, AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }] },
        orderBy: { createdAt: 'desc' }, take: 5,
      }),
      (prisma as any).payrollBatch.findFirst({
        where: { companyId },
        orderBy: { runDate: 'desc' },
      }),
    ]);

    // Coverage status by shift type for today
    const COVERAGE_MIN: Record<string, number> = { FIRST: 5, SECOND: 3, THIRD: 3 };
    const todayCounts: Record<string, number> = { FIRST: 0, SECOND: 0, THIRD: 0 };
    const tomorrowCounts: Record<string, number> = { FIRST: 0, SECOND: 0, THIRD: 0 };
    for (const s of todayShifts) if (todayCounts[s.shiftType] !== undefined) todayCounts[s.shiftType]++;
    for (const s of tomorrowShifts) if (tomorrowCounts[s.shiftType] !== undefined) tomorrowCounts[s.shiftType]++;
    const todayCoverage = Object.keys(COVERAGE_MIN).map((k) => ({
      shiftType: k, current: todayCounts[k], minimum: COVERAGE_MIN[k], adequate: todayCounts[k] >= COVERAGE_MIN[k],
    }));
    const tomorrowCoverage = Object.keys(COVERAGE_MIN).map((k) => ({
      shiftType: k, current: tomorrowCounts[k], minimum: COVERAGE_MIN[k], adequate: tomorrowCounts[k] >= COVERAGE_MIN[k],
    }));

    return {
      kpis: {
        pendingApprovals: pendingHrLeaves + pendingTimecards + pendingShiftChanges + pendingReviews + pendingExits,
        complianceAlerts: expiredDocs + expiringTests7,
        onboardingInProgress,
        activeEmployees,
      },
      pendingBreakdown: {
        leaves: pendingHrLeaves,
        timecards: pendingTimecards,
        shiftChanges: pendingShiftChanges,
        reviews: pendingReviews,
        exits: pendingExits,
      },
      compliance: {
        expiredDocuments: expiredDocs,
        testsExpiringIn7Days: expiringTests7,
      },
      coverage: { today: todayCoverage, tomorrow: tomorrowCoverage },
      systemHealth: { failedJobsToday },
      recentNotices: recentNotices.map((n: any) => ({ id: n.id, title: n.title, category: n.category, createdAt: n.createdAt })),
      lastPayroll: lastPayroll ? {
        id: lastPayroll.id,
        status: lastPayroll.status,
        runDate: lastPayroll.runDate,
        totalEmployees: lastPayroll.totalEmployees,
        totalRegularHours: Number(lastPayroll.totalRegularHours || 0),
        totalOvertimeHours: Number(lastPayroll.totalOvertimeHours || 0),
      } : null,
      // Figma refit — named queues
      pendingLeaveQueue: await (prisma as any).leaveRequest.findMany({
        where: { companyId, supervisorApprovalStatus: 'APPROVED', hrApprovalStatus: 'PENDING' },
        include: { employee: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true, employeeIdNumber: true, designation: true } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      complianceAlertQueue: await (async () => {
        const today = startOfDay(new Date());
        const next30 = addDays(today, 30);
        // Combine expiring documents + expiring tests, top 6 by closest expiry
        const docs = await (prisma as any).employeeDocument.findMany({
          where: { employee: { companyId }, expiryDate: { not: null, lte: next30 } },
          include: { employee: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true, employeeIdNumber: true } } },
          orderBy: { expiryDate: 'asc' },
          take: 6,
        });
        const tests = await (prisma as any).employeeTest.findMany({
          where: { companyId, expiryDate: { not: null, lte: next30 }, status: { in: ['PASSED', 'PENDING', 'EXPIRED'] } },
          include: { employee: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true, employeeIdNumber: true } } },
          orderBy: { expiryDate: 'asc' },
          take: 6,
        });
        return [
          ...docs.map((d: any) => ({ kind: 'document', name: d.documentName, expiryDate: d.expiryDate, employee: d.employee })),
          ...tests.map((t: any) => ({ kind: 'test', name: t.testName || t.testType, expiryDate: t.expiryDate, employee: t.employee })),
        ].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()).slice(0, 6);
      })(),
      workforceMovement: await (async () => {
        const ninetyDaysAgo = addDays(today, -90);
        const newJoiners = await (prisma as any).employee.findMany({
          where: { companyId, deletedAt: null, hireDate: { gte: ninetyDaysAgo } },
          select: { id: true, firstName: true, lastName: true, profilePictureUrl: true, designation: true, hireDate: true },
          orderBy: { hireDate: 'desc' },
          take: 5,
        });
        const exits = await (prisma as any).employeeExit.findMany({
          where: { companyId, status: 'COMPLETED', completedAt: { gte: ninetyDaysAgo } },
          include: { employee: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true, designation: true } } },
          orderBy: { completedAt: 'desc' },
          take: 5,
        });
        return { newJoiners, exits: exits.map((e: any) => ({ ...e.employee, completedAt: e.completedAt, exitType: e.exitType })) };
      })(),
      perFacilityHeadcount: await (async () => {
        const facilities = await (prisma as any).facility.findMany({
          where: { companyId, active: true, deletedAt: null },
          select: { id: true, name: true, facilityType: true },
        });
        const result = [];
        for (const f of facilities) {
          const count = await (prisma as any).employee.count({
            where: { companyId, facilityId: f.id, status: 'ACTIVE', deletedAt: null },
          });
          result.push({ id: f.id, name: f.name, facilityType: f.facilityType, count });
        }
        return result;
      })(),
      // Activity log: domain events derived from JobRunLog + recent exits/onboardings/shifts
      activityLog: await (async () => {
        const items: any[] = [];
        // New hires (last 30d)
        const recentHires = await (prisma as any).employee.findMany({
          where: { companyId, deletedAt: null, hireDate: { gte: addDays(today, -30) } },
          select: { id: true, firstName: true, lastName: true, designation: true, hireDate: true },
          orderBy: { hireDate: 'desc' }, take: 5,
        });
        for (const h of recentHires) {
          items.push({ type: 'NEW_HIRE', title: `${h.firstName} ${h.lastName} joined as ${h.designation || 'employee'}`, timestamp: h.hireDate, employeeId: h.id });
        }
        // Recent exits (last 30d)
        const recentExits = await (prisma as any).employeeExit.findMany({
          where: { companyId, status: 'COMPLETED', completedAt: { gte: addDays(today, -30) } },
          include: { employee: { select: { firstName: true, lastName: true } } },
          orderBy: { completedAt: 'desc' }, take: 5,
        });
        for (const e of recentExits) {
          items.push({ type: 'EXIT_RECORDED', title: `${e.employee?.firstName} ${e.employee?.lastName} exited (${e.exitType})`, timestamp: e.completedAt });
        }
        // Recent shift updates (cancellations)
        const recentCancellations = await (prisma as any).shiftSchedule.findMany({
          where: { companyId, status: 'CANCELLED', updatedAt: { gte: addDays(today, -7) } },
          include: { employee: { select: { firstName: true, lastName: true } } },
          orderBy: { updatedAt: 'desc' }, take: 5,
        });
        for (const s of recentCancellations) {
          items.push({ type: 'SHIFT_CANCELLED', title: `Shift cancelled: ${s.employee?.firstName} ${s.employee?.lastName} on ${new Date(s.shiftDate).toLocaleDateString()}`, timestamp: s.updatedAt });
        }
        // Recent compliance flags from job runs
        const complianceJobs = await (prisma as any).jobRunLog.findMany({
          where: { companyId, jobName: { in: ['monitorDocExpiry', 'generateComplianceStatus'] }, alertsSent: { gt: 0 } },
          orderBy: { startedAt: 'desc' }, take: 3,
        });
        for (const j of complianceJobs) {
          items.push({ type: 'COMPLIANCE_REVIEW', title: `${j.jobName}: ${j.alertsSent} alert(s) generated`, timestamp: j.startedAt });
        }
        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
      })(),
    };
  },

  async supervisor(userId: number, companyId: number, facilityId: number | null) {
    const today = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const tomorrow = startOfDay(addDays(new Date(), 1));
    const tomorrowEnd = endOfDay(addDays(new Date(), 1));

    // Resolve supervisor's Employee record (might be null if supervisor user has no employee row)
    const supervisorEmp = await (prisma as any).employee.findFirst({
      where: { userId, companyId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });

    // For supervisor: pending Level-1 leaves (supervisorApprovalStatus PENDING) for their facility
    const facilityFilter: any = facilityId ? { facilityId } : {};

    const [
      pendingLeaves, pendingTimecards, pendingShiftChanges,
      myReviewsToComplete, todayShifts, tomorrowShifts,
      myDirectReports, recentNotices,
    ] = await Promise.all([
      (prisma as any).leaveRequest.count({
        where: { companyId, supervisorApprovalStatus: 'PENDING', employee: facilityFilter },
      }),
      (prisma as any).timesheet.count({
        where: { companyId, status: 'SUBMITTED', ...facilityFilter },
      }),
      (prisma as any).shiftChangeRequest.count({
        where: { companyId, status: 'PENDING', employee: facilityFilter },
      }),
      supervisorEmp ? (prisma as any).performanceReview.count({
        where: { companyId, reviewerId: supervisorEmp.id, status: 'DRAFT' },
      }) : 0,
      (prisma as any).shiftSchedule.findMany({
        where: { companyId, ...facilityFilter, shiftDate: { gte: today, lte: todayEnd }, status: 'SCHEDULED' },
        include: { employee: { select: { id: true, firstName: true, lastName: true, designation: true } } },
        orderBy: { shiftType: 'asc' },
      }),
      (prisma as any).shiftSchedule.findMany({
        where: { companyId, ...facilityFilter, shiftDate: { gte: tomorrow, lte: tomorrowEnd }, status: 'SCHEDULED' },
      }),
      supervisorEmp ? (prisma as any).employee.count({
        where: { companyId, reportingManagerId: supervisorEmp.id, deletedAt: null, status: 'ACTIVE' },
      }) : 0,
      (prisma as any).noticeBoard.findMany({
        where: {
          companyId,
          OR: [{ facilityId: null }, ...(facilityId ? [{ facilityId }] : [])],
          AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
        },
        orderBy: { createdAt: 'desc' }, take: 5,
      }),
    ]);

    const COVERAGE_MIN: Record<string, number> = { FIRST: 5, SECOND: 3, THIRD: 3 };
    const todayCounts: Record<string, number> = { FIRST: 0, SECOND: 0, THIRD: 0 };
    const tomorrowCounts: Record<string, number> = { FIRST: 0, SECOND: 0, THIRD: 0 };
    for (const s of todayShifts) if (todayCounts[s.shiftType] !== undefined) todayCounts[s.shiftType]++;
    for (const s of tomorrowShifts) if (tomorrowCounts[s.shiftType] !== undefined) tomorrowCounts[s.shiftType]++;

    return {
      supervisor: supervisorEmp ? { id: supervisorEmp.id, name: `${supervisorEmp.firstName} ${supervisorEmp.lastName}` } : null,
      kpis: {
        pendingApprovals: pendingLeaves + pendingTimecards + pendingShiftChanges,
        myReviewsToComplete,
        directReports: myDirectReports,
      },
      pendingBreakdown: {
        leaves: pendingLeaves,
        timecards: pendingTimecards,
        shiftChanges: pendingShiftChanges,
      },
      coverage: {
        today: Object.keys(COVERAGE_MIN).map((k) => ({
          shiftType: k, current: todayCounts[k], minimum: COVERAGE_MIN[k], adequate: todayCounts[k] >= COVERAGE_MIN[k],
        })),
        tomorrow: Object.keys(COVERAGE_MIN).map((k) => ({
          shiftType: k, current: tomorrowCounts[k], minimum: COVERAGE_MIN[k], adequate: tomorrowCounts[k] >= COVERAGE_MIN[k],
        })),
      },
      todayRoster: todayShifts.map((s: any) => ({
        id: s.id,
        shiftType: s.shiftType,
        startTime: s.startTime,
        endTime: s.endTime,
        employee: s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : '—',
        designation: s.employee?.designation,
      })),
      recentNotices: recentNotices.map((n: any) => ({ id: n.id, title: n.title, category: n.category, createdAt: n.createdAt })),
      // Figma refit — named approval queue
      pendingLeaveQueue: await (prisma as any).leaveRequest.findMany({
        where: { companyId, supervisorApprovalStatus: 'PENDING', employee: facilityFilter },
        include: { employee: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true, employeeIdNumber: true, designation: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Figma refit — 7-day staffing chart data
      staffingChart: await (async () => {
        const COVERAGE_MIN: Record<string, number> = { FIRST: 5, SECOND: 3, THIRD: 3 };
        const days: any[] = [];
        for (let i = 0; i < 7; i++) {
          const d = startOfDay(addDays(new Date(), i));
          const dEnd = endOfDay(d);
          const shifts = await (prisma as any).shiftSchedule.findMany({
            where: { companyId, ...facilityFilter, shiftDate: { gte: d, lte: dEnd }, status: { in: ['SCHEDULED', 'COMPLETED'] } },
          });
          const counts: Record<string, number> = { FIRST: 0, SECOND: 0, THIRD: 0 };
          for (const s of shifts) if (counts[s.shiftType] !== undefined) counts[s.shiftType]++;
          const required = COVERAGE_MIN.FIRST + COVERAGE_MIN.SECOND + COVERAGE_MIN.THIRD;
          const assigned = counts.FIRST + counts.SECOND + counts.THIRD;
          days.push({
            date: d.toISOString().slice(0, 10),
            label: d.toLocaleDateString('en-US', { weekday: 'short' }),
            assigned,
            required,
            byShift: counts,
          });
        }
        return days;
      })(),
      // Today's coverage % for KPI
      coveragePercent: (() => {
        const COVERAGE_MIN: Record<string, number> = { FIRST: 5, SECOND: 3, THIRD: 3 };
        const required = COVERAGE_MIN.FIRST + COVERAGE_MIN.SECOND + COVERAGE_MIN.THIRD;
        const assigned = todayCounts.FIRST + todayCounts.SECOND + todayCounts.THIRD;
        return required > 0 ? Math.round((assigned / required) * 100) : 0;
      })(),
      overtimeAlertsThisWeek: await (prisma as any).timesheet.count({
        where: {
          companyId, ...facilityFilter,
          overtimeHours: { gt: 0 },
          periodStart: { gte: startOfDay(addDays(new Date(), -7)) },
        },
      }),
      // Figma — weekly per-employee shift matrix (employees as rows, 7 days as columns)
      weekShiftMatrix: await (async () => {
        const start = startOfDay(new Date());
        const end = endOfDay(addDays(start, 6));
        const dayList: { date: string; label: string; weekday: string }[] = [];
        for (let i = 0; i < 7; i++) {
          const d = addDays(start, i);
          dayList.push({
            date: d.toISOString().slice(0, 10),
            label: String(d.getDate()).padStart(2, '0'),
            weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
          });
        }
        // Active employees in the supervisor's facility (or whole company for HR Admin)
        const employees = await (prisma as any).employee.findMany({
          where: {
            companyId, ...facilityFilter, deletedAt: null, status: 'ACTIVE',
          },
          select: { id: true, firstName: true, lastName: true, designation: true, profilePictureUrl: true },
          orderBy: { firstName: 'asc' },
          take: 8,
        });
        if (employees.length === 0) return { days: dayList, employees: [] };
        const employeeIds = employees.map((e: any) => e.id);
        const shifts = await (prisma as any).shiftSchedule.findMany({
          where: {
            companyId, ...facilityFilter,
            employeeId: { in: employeeIds },
            shiftDate: { gte: start, lte: end },
            status: { in: ['SCHEDULED', 'COMPLETED', 'IN_PROGRESS'] },
          },
          select: {
            id: true, employeeId: true, shiftDate: true, shiftType: true, startTime: true, endTime: true,
          },
        });
        // Build empId -> dateISO -> shift cell
        const matrix: Record<number, Record<string, any>> = {};
        for (const e of employees) matrix[e.id] = {};
        for (const s of shifts) {
          const dKey = startOfDay(s.shiftDate).toISOString().slice(0, 10);
          matrix[s.employeeId][dKey] = {
            shiftType: s.shiftType,
            startTime: s.startTime,
            endTime: s.endTime,
          };
        }
        return {
          days: dayList,
          employees: employees.map((e: any) => ({
            id: e.id,
            firstName: e.firstName,
            lastName: e.lastName,
            designation: e.designation,
            profilePictureUrl: e.profilePictureUrl,
            cells: dayList.map((d) => matrix[e.id][d.date] || null),
          })),
        };
      })(),
    };
  },
};
