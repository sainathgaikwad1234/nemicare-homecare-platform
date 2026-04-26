import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { notificationService } from './notification.service';

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

async function resolveEmployee(userId: number) {
  const emp = await (prisma as any).employee.findFirst({
    where: { userId: Number(userId), deletedAt: null },
  });
  if (!emp) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND,
      'No employee record linked to this user.');
  }
  return emp;
}

export const shiftChangeService = {
  async submit(userId: number, input: {
    originalShiftId: number;
    reason: string;
    requestedDate?: string | null;
    requestedShiftType?: string | null;
    requestedStartTime?: string | null;
    requestedEndTime?: string | null;
    targetEmployeeId?: number | null;
  }) {
    const emp = await resolveEmployee(userId);
    if (!input.reason?.trim()) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Reason is required.');
    }
    if (!input.originalShiftId) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'originalShiftId is required.');
    }

    const shift = await (prisma as any).shiftSchedule.findUnique({ where: { id: Number(input.originalShiftId) } });
    if (!shift) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Shift not found.');
    if (shift.employeeId !== emp.id) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.UNAUTHORIZED, 'You can only request changes to your own shifts.');
    }
    if (shift.status === 'COMPLETED' || shift.status === 'CANCELLED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `Cannot request a change for a ${shift.status.toLowerCase()} shift.`);
    }

    // Block duplicate PENDING request for the same shift
    const dup = await (prisma as any).shiftChangeRequest.findFirst({
      where: { originalShiftId: shift.id, status: 'PENDING' },
    });
    if (dup) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        'A pending change request already exists for this shift.');
    }

    const created = await (prisma as any).shiftChangeRequest.create({
      data: {
        companyId: emp.companyId,
        employeeId: emp.id,
        originalShiftId: shift.id,
        requestedDate: input.requestedDate ? startOfDay(new Date(input.requestedDate)) : null,
        requestedShiftType: input.requestedShiftType || null,
        requestedStartTime: input.requestedStartTime || null,
        requestedEndTime: input.requestedEndTime || null,
        reason: input.reason.trim(),
        status: 'PENDING',
        targetEmployeeId: input.targetEmployeeId ? Number(input.targetEmployeeId) : null,
      },
    });

    // Notify supervisors via NoticeBoard (category: shift-change)
    await notificationService.send({
      companyId: emp.companyId,
      facilityId: emp.facilityId,
      title: `Shift change requested: ${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim(),
      body: `${emp.firstName ?? ''} requested a change to shift on ${new Date(shift.shiftDate).toLocaleDateString()}. Reason: ${input.reason.trim()}`,
      category: 'shift-change',
    });

    return created;
  },

  async listMine(userId: number, status?: string, page = 1, pageSize = 10) {
    const emp = await resolveEmployee(userId);
    const where: any = { employeeId: emp.id };
    if (status) where.status = status;
    const total = await (prisma as any).shiftChangeRequest.count({ where });
    const data = await (prisma as any).shiftChangeRequest.findMany({
      where,
      include: { originalShift: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async listForApproval(supervisorUserId: number, status?: string, page = 1, pageSize = 10) {
    const sup = await (prisma as any).user.findUnique({
      where: { id: supervisorUserId },
      select: { companyId: true, facilityId: true },
    });
    if (!sup) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'User not found');

    const where: any = { companyId: sup.companyId };
    if (sup.facilityId) {
      // Filter by employees in same facility
      where.employee = { facilityId: sup.facilityId };
    }
    if (status) where.status = status;
    else where.status = { in: ['PENDING', 'APPROVED', 'REJECTED'] };

    const total = await (prisma as any).shiftChangeRequest.count({ where });
    const data = await (prisma as any).shiftChangeRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeIdNumber: true, designation: true, facilityId: true } },
        originalShift: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async approve(supervisorUserId: number, id: number) {
    const req = await (prisma as any).shiftChangeRequest.findUnique({
      where: { id: Number(id) },
      include: { originalShift: true, employee: true },
    });
    if (!req) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Request not found');
    if (req.status !== 'PENDING') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `Cannot approve a request in status ${req.status}.`);
    }

    // Atomically: update the underlying shift with the requested values, mark request APPROVED
    const result = await prisma.$transaction(async (tx: any) => {
      const shiftUpdate: any = {};
      if (req.requestedDate) shiftUpdate.shiftDate = req.requestedDate;
      if (req.requestedShiftType) shiftUpdate.shiftType = req.requestedShiftType;
      if (req.requestedStartTime) shiftUpdate.startTime = req.requestedStartTime;
      if (req.requestedEndTime) shiftUpdate.endTime = req.requestedEndTime;
      if (Object.keys(shiftUpdate).length > 0) {
        await tx.shiftSchedule.update({ where: { id: req.originalShiftId }, data: shiftUpdate });
      }
      return tx.shiftChangeRequest.update({
        where: { id: req.id },
        data: { status: 'APPROVED', decidedById: supervisorUserId, decidedAt: new Date() },
        include: { originalShift: true, employee: true },
      });
    });

    // Notify employee
    await notificationService.send({
      companyId: req.companyId,
      facilityId: req.employee.facilityId,
      title: 'Your shift change was approved',
      body: `Your request for ${new Date(req.originalShift.shiftDate).toLocaleDateString()} has been approved. Check My Shifts for the updated schedule.`,
      category: 'shift-change-decision',
      emailTo: req.employee.email ? [req.employee.email] : undefined,
    });

    return result;
  },

  // Phase 5.10 — Peer-to-peer swap response
  async listPendingForPeer(userId: number) {
    const emp = await resolveEmployee(userId);
    return (prisma as any).shiftChangeRequest.findMany({
      where: { targetEmployeeId: emp.id, status: 'PENDING', targetAcceptedAt: null, targetDeclinedAt: null },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, designation: true } },
        originalShift: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async peerAccept(userId: number, id: number) {
    const emp = await resolveEmployee(userId);
    const req = await (prisma as any).shiftChangeRequest.findUnique({ where: { id: Number(id) } });
    if (!req) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Request not found');
    if (req.targetEmployeeId !== emp.id) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.UNAUTHORIZED, 'Not the target of this swap');
    }
    if (req.targetAcceptedAt || req.targetDeclinedAt) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Already responded');
    }
    const updated = await (prisma as any).shiftChangeRequest.update({
      where: { id: req.id },
      data: { targetAcceptedAt: new Date() },
      include: { employee: { select: { firstName: true, lastName: true, email: true, facilityId: true } }, originalShift: true },
    });
    // Notify supervisors via NoticeBoard
    await notificationService.send({
      companyId: req.companyId,
      facilityId: updated.employee?.facilityId ?? null,
      title: `${emp.firstName} ${emp.lastName} accepted shift swap`,
      body: `Peer swap with ${updated.employee.firstName} ${updated.employee.lastName} for ${new Date(updated.originalShift.shiftDate).toLocaleDateString()}. Awaiting supervisor confirmation.`,
      category: 'shift-change-peer',
    });
    return updated;
  },

  async peerDecline(userId: number, id: number, reason?: string) {
    const emp = await resolveEmployee(userId);
    const req = await (prisma as any).shiftChangeRequest.findUnique({ where: { id: Number(id) } });
    if (!req) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Request not found');
    if (req.targetEmployeeId !== emp.id) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.UNAUTHORIZED, 'Not the target of this swap');
    }
    if (req.targetAcceptedAt || req.targetDeclinedAt) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Already responded');
    }
    return (prisma as any).shiftChangeRequest.update({
      where: { id: req.id },
      data: { targetDeclinedAt: new Date(), targetDeclineReason: reason || null },
    });
  },

  async reject(supervisorUserId: number, id: number, rejectionReason: string) {
    if (!rejectionReason?.trim()) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Rejection reason is required.');
    }
    const req = await (prisma as any).shiftChangeRequest.findUnique({
      where: { id: Number(id) },
      include: { originalShift: true, employee: true },
    });
    if (!req) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Request not found');
    if (req.status !== 'PENDING') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `Cannot reject a request in status ${req.status}.`);
    }

    const updated = await (prisma as any).shiftChangeRequest.update({
      where: { id: req.id },
      data: {
        status: 'REJECTED',
        decidedById: supervisorUserId,
        decidedAt: new Date(),
        rejectionReason: rejectionReason.trim(),
      },
      include: { originalShift: true, employee: true },
    });

    await notificationService.send({
      companyId: req.companyId,
      facilityId: req.employee.facilityId,
      title: 'Your shift change was declined',
      body: `Your request for ${new Date(req.originalShift.shiftDate).toLocaleDateString()} was declined. Reason: ${rejectionReason.trim()}`,
      category: 'shift-change-decision',
      emailTo: req.employee.email ? [req.employee.email] : undefined,
    });

    return updated;
  },
};
