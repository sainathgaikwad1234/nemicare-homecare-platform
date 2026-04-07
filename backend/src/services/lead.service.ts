import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { leadActivityService } from './leadActivity.service';

interface ListLeadsOptions {
  companyId: number;
  facilityId?: number;
  status?: string;
  source?: string;
  searchQuery?: string;
  page: number;
  pageSize: number;
}

export const leadService = {
  async getLeads(options: ListLeadsOptions) {
    const { companyId, facilityId, status, source, searchQuery, page, pageSize } = options;

    const where: Prisma.LeadWhereInput = {
      companyId: Number(companyId),
      deletedAt: null,
    };

    if (facilityId) where.facilityId = Number(facilityId);
    if (status) where.status = status as any;
    if (source) where.source = source as any;

    if (searchQuery) {
      where.OR = [
        { firstName: { contains: searchQuery, mode: 'insensitive' } },
        { lastName: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { phone: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.lead.count({ where });

    const leads = await prisma.lead.findMany({
      where,
      include: {
        facility: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data: leads,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async getLeadById(id: number, companyId: number) {
    const lead = await prisma.lead.findFirst({
      where: { id: Number(id), companyId: Number(companyId), deletedAt: null },
      include: {
        facility: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (!lead) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Lead not found');
    }

    return lead;
  },

  async createLead(input: any, userId: number) {
    // Map gender values
    const genderMap: Record<string, string> = { MALE: 'M', FEMALE: 'F', M: 'M', F: 'F', OTHER: 'OTHER' };
    const sourceMap: Record<string, string> = { PHONE: 'CALL', MARKETING: 'ADVERTISEMENT', WEBSITE: 'WEBSITE', REFERRAL: 'REFERRAL', CALL: 'CALL', FAMILY: 'FAMILY', OTHER: 'OTHER' };

    const companyId = Number(input.companyId);
    const facilityId = Number(input.facilityId);

    // Validate facility
    const facility = await prisma.facility.findFirst({
      where: { id: facilityId, companyId, deletedAt: null },
    });

    if (!facility) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 'Invalid facility');
    }

    const lead = await prisma.lead.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email || null,
        phone: input.phone || null,
        dob: input.dob || input.dateOfBirth ? new Date(input.dob || input.dateOfBirth) : null,
        gender: (genderMap[input.gender] || 'OTHER') as any,
        source: (sourceMap[input.source] || 'OTHER') as any,
        status: 'PROSPECT' as any,
        companyId,
        facilityId,
        notes: input.notes || null,
        interestedIn: (input.interestedIn || input.serviceType || null) as any,
        assignedToId: input.assignedToId ? Number(input.assignedToId) : null,
      },
      include: {
        facility: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Log "Lead Created" activity
    await leadActivityService.logActivity({
      leadId: lead.id,
      companyId: lead.companyId,
      activityType: 'LEAD_CREATED',
      title: 'Lead created',
      description: `${lead.firstName} ${lead.lastName} added as a new lead`,
      createdById: userId,
    });

    return lead;
  },

  async updateLead(id: number, companyId: number, input: any, userId: number) {
    const existing = await prisma.lead.findFirst({
      where: { id: Number(id), companyId: Number(companyId), deletedAt: null },
    });

    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Lead not found');
    }

    const updateData: any = {};
    if (input.firstName) updateData.firstName = input.firstName;
    if (input.lastName) updateData.lastName = input.lastName;
    if (input.email) updateData.email = input.email;
    if (input.phone) updateData.phone = input.phone;
    if (input.status) updateData.status = input.status;
    if (input.source) updateData.source = input.source;
    if (input.notes) updateData.notes = input.notes;
    if (input.assignedToId) updateData.assignedToId = Number(input.assignedToId);

    const updatedLead = await prisma.lead.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        facility: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return updatedLead;
  },

  async deleteLead(id: number, companyId: number, userId: number) {
    const existing = await prisma.lead.findFirst({
      where: { id: Number(id), companyId: Number(companyId), deletedAt: null },
    });

    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Lead not found');
    }

    await prisma.lead.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });

    return { message: 'Lead deleted successfully' };
  },

  async convertLeadToResident(leadId: number, companyId: number, facilityId: number, userId: number) {
    const lead = await prisma.lead.findFirst({
      where: { id: Number(leadId), companyId: Number(companyId), deletedAt: null },
    });

    if (!lead) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Lead not found');
    }

    if (lead.status === 'CONVERTED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 'Lead already converted');
    }

    const resident = await prisma.resident.create({
      data: {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        dob: lead.dob || new Date('2000-01-01'),
        gender: lead.gender || ('OTHER' as any),
        status: 'ON_HOLD' as any, // IN_PROGRESS — goes through Patient Setup wizard before becoming ACTIVE
        admissionType: 'NEW_ARRIVAL' as any,
        billingType: lead.notes?.includes('Medicaid') ? ('MEDICAID' as any) : ('PRIVATE_PAY' as any),
        primaryService: (lead.interestedIn || 'ADH') as any,
        companyId: Number(companyId),
        facilityId: Number(facilityId),
        admissionDate: new Date(),
        createdById: Number(userId),
      },
    });

    await prisma.lead.update({
      where: { id: Number(leadId) },
      data: {
        status: 'CONVERTING' as any, // Lead is in conversion — resident goes through Patient Setup
        convertedToResidentId: resident.id,
        convertedAt: new Date(),
      },
    });

    return resident;
  },
};
