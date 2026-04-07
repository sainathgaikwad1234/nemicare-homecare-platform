import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

export const dischargeService = {
  async createDischargeRecord(residentId: number, companyId: number, data: any, userId: number) {
    const resident = await prisma.resident.findFirst({
      where: { id: Number(residentId), companyId: Number(companyId), deletedAt: null },
    });
    if (!resident) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Resident not found');
    if (resident.status === 'DISCHARGED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Resident is already discharged');
    }

    return prisma.$transaction(async (tx: any) => {
      const dischargeRecord = await tx.dischargeRecord.create({
        data: {
          ...data,
          residentId: Number(residentId),
          companyId: Number(companyId),
          createdById: Number(userId),
          dischargeDate: data.dischargeDate ? new Date(data.dischargeDate) : new Date(),
        },
      });

      await tx.resident.update({
        where: { id: Number(residentId) },
        data: { status: 'DISCHARGED' },
      });

      return dischargeRecord;
    });
  },

  async getDischargeRecord(residentId: number, companyId: number) {
    const record = await prisma.dischargeRecord.findFirst({
      where: {
        residentId: Number(residentId),
        companyId: Number(companyId),
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Discharge record not found');
    return record;
  },

  async updateApproval(recordId: number, companyId: number, status: string, userId: number) {
    const record = await prisma.dischargeRecord.findFirst({
      where: { id: Number(recordId), companyId: Number(companyId) },
    });
    if (!record) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Discharge record not found');

    return prisma.dischargeRecord.update({
      where: { id: Number(recordId) },
      data: {
        approvalStatus: status,
        approvedById: Number(userId),
        approvedAt: new Date(),
      },
    });
  },
};
