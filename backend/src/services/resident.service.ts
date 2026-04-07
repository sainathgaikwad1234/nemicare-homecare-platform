import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

interface ListResidentsOptions {
  companyId: number;
  facilityId?: number;
  status?: string;
  page: number;
  pageSize: number;
}

export const residentService = {
  async getResidents(options: ListResidentsOptions) {
    const { companyId, facilityId, status, page, pageSize } = options;

    const where: Prisma.ResidentWhereInput = {
      companyId: Number(companyId),
      deletedAt: null,
    };

    if (facilityId) {
      where.facilityId = Number(facilityId);
    }

    if (status) {
      where.status = status as any;
    }

    const total = await prisma.resident.count({ where });

    const residents = await prisma.resident.findMany({
      where,
      include: {
        facility: { select: { id: true, name: true } },
      },
      orderBy: { admissionDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data: residents,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async getResidentById(id: number, companyId: number) {
    const resident = await prisma.resident.findFirst({
      where: { id: Number(id), companyId: Number(companyId), deletedAt: null },
      include: {
        facility: { select: { id: true, name: true } },
      },
    });

    if (!resident) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Resident not found');
    }

    return resident;
  },

  async createResident(input: any, userId: number) {
    const resident = await prisma.resident.create({
      data: {
        companyId: Number(input.companyId),
        facilityId: Number(input.facilityId),
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || '',
        city: input.city || '',
        state: input.state || '',
        zip: input.zipCode || input.zip || '',
        dob: new Date(input.dateOfBirth || input.dob || '2000-01-01'),
        gender: (input.gender || 'OTHER') as any,
        emergencyContactName: input.emergencyContactName || '',
        emergencyContactPhone: input.emergencyContactPhone || '',
        emergencyContactRelationship: input.emergencyContactRelationship || '',
        admissionDate: new Date(input.admissionDate || new Date()),
        admissionType: (input.admissionType || 'NEW_ARRIVAL') as any,
        status: 'ACTIVE' as any,
        billingType: (input.billingType || 'PRIVATE_PAY') as any,
        primaryService: (input.primaryService || 'ADH') as any,
        createdById: Number(userId),
      },
      include: {
        facility: { select: { id: true, name: true } },
      },
    });

    return resident;
  },

  async updateResident(id: number, companyId: number, input: any, userId: number) {
    const existing = await prisma.resident.findFirst({
      where: { id: Number(id), companyId: Number(companyId), deletedAt: null },
    });

    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Resident not found');
    }

    const updateData: any = {};
    if (input.firstName) updateData.firstName = input.firstName;
    if (input.lastName) updateData.lastName = input.lastName;
    if (input.email) updateData.email = input.email;
    if (input.phone) updateData.phone = input.phone;
    if (input.address) updateData.address = input.address;
    if (input.notes) updateData.notes = input.notes;

    const resident = await prisma.resident.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return resident;
  },

  async deleteResident(id: number, companyId: number, userId: number) {
    const existing = await prisma.resident.findFirst({
      where: { id: Number(id), companyId: Number(companyId), deletedAt: null },
    });

    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Resident not found');
    }

    await prisma.resident.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });

    return { message: 'Resident deleted successfully' };
  },

  async dischargeResident(id: number, companyId: number, dischargeDate: Date, dischargeReason: string, userId: number) {
    const existing = await prisma.resident.findFirst({
      where: { id: Number(id), companyId: Number(companyId), deletedAt: null },
    });

    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Resident not found');
    }

    if (existing.status === 'DISCHARGED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 'Resident is already discharged');
    }

    const resident = await prisma.resident.update({
      where: { id: Number(id) },
      data: {
        status: 'DISCHARGED' as any,
        dischargeDate: new Date(dischargeDate),
        dischargeReason,
      },
    });

    return resident;
  },
};
