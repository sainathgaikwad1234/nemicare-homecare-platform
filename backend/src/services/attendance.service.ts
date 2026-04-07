import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

export const attendanceService = {
  async getDailyRoster(facilityId: number, companyId: number, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const residents = await prisma.resident.findMany({
      where: {
        companyId: Number(companyId),
        facilityId: Number(facilityId),
        status: 'ACTIVE',
        primaryService: 'ADH',
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        primaryService: true,
      },
      orderBy: { lastName: 'asc' },
    });

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        companyId: Number(companyId),
        facilityId: Number(facilityId),
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const attendanceMap = new Map(attendanceRecords.map((a: any) => [a.residentId, a]));

    const roster = residents.map((r: any) => ({
      resident: r,
      attendance: attendanceMap.get(r.id) || null,
    }));

    return {
      date: startOfDay.toISOString().split('T')[0],
      facilityId: Number(facilityId),
      totalResidents: residents.length,
      checkedIn: attendanceRecords.filter((a: any) => a.checkInTime && !a.checkOutTime).length,
      checkedOut: attendanceRecords.filter((a: any) => a.checkOutTime).length,
      absent: attendanceRecords.filter((a: any) => a.status === 'ABSENT').length,
      roster,
    };
  },

  async getWeeklyRoster(facilityId: number, companyId: number, startDate: Date) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayRoster = await this.getDailyRoster(facilityId, companyId, date);
      days.push(dayRoster);
    }
    return days;
  },

  async checkIn(residentId: number, companyId: number, facilityId: number, userId: number, date?: Date) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const resident = await prisma.resident.findFirst({
      where: { id: Number(residentId), companyId: Number(companyId), deletedAt: null },
    });
    if (!resident) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Resident not found');

    return prisma.attendance.upsert({
      where: {
        residentId_date: {
          residentId: Number(residentId),
          date: targetDate,
        },
      },
      update: {
        checkInTime: new Date(),
        status: 'PRESENT',
        checkedInById: Number(userId),
      },
      create: {
        residentId: Number(residentId),
        companyId: Number(companyId),
        facilityId: Number(facilityId),
        date: targetDate,
        checkInTime: new Date(),
        status: 'PRESENT',
        checkedInById: Number(userId),
      },
    });
  },

  async checkOut(residentId: number, companyId: number, facilityId: number, userId: number, date?: Date) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const resident = await prisma.resident.findFirst({
      where: { id: Number(residentId), companyId: Number(companyId), deletedAt: null },
    });
    if (!resident) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Resident not found');

    const attendance = await prisma.attendance.findUnique({
      where: {
        residentId_date: {
          residentId: Number(residentId),
          date: targetDate,
        },
      },
    });
    if (!attendance || !attendance.checkInTime) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Resident has not checked in today');
    }

    return prisma.attendance.update({
      where: {
        residentId_date: {
          residentId: Number(residentId),
          date: targetDate,
        },
      },
      data: {
        checkOutTime: new Date(),
        checkedOutById: Number(userId),
      },
    });
  },

  async markAbsent(residentId: number, companyId: number, facilityId: number, userId: number, reason: string, date?: Date, notes?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const resident = await prisma.resident.findFirst({
      where: { id: Number(residentId), companyId: Number(companyId), deletedAt: null },
    });
    if (!resident) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Resident not found');

    return prisma.attendance.upsert({
      where: {
        residentId_date: {
          residentId: Number(residentId),
          date: targetDate,
        },
      },
      update: {
        status: 'ABSENT',
        absenceReason: reason,
        notes: notes || null,
        checkedInById: Number(userId),
      },
      create: {
        residentId: Number(residentId),
        companyId: Number(companyId),
        facilityId: Number(facilityId),
        date: targetDate,
        status: 'ABSENT',
        absenceReason: reason,
        notes: notes || null,
        checkedInById: Number(userId),
      },
    });
  },
};
