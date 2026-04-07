import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

export const leadActivityService = {
  /**
   * Get all activities for a lead (reverse chronological)
   */
  async getActivities(leadId: number, companyId: number, page = 1, pageSize = 50) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId, deletedAt: null },
    });
    if (!lead) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Lead not found');
    }

    const where = { leadId, companyId };
    const total = await prisma.leadActivity.count({ where });

    const activities = await prisma.leadActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data: activities,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  /**
   * Log a new activity for a lead
   */
  async logActivity(input: {
    leadId: number;
    companyId: number;
    activityType: string;
    title: string;
    description?: string;
    metadata?: any;
    createdById: number;
  }) {
    return prisma.leadActivity.create({
      data: {
        leadId: input.leadId,
        companyId: input.companyId,
        activityType: input.activityType as any,
        title: input.title,
        description: input.description || null,
        metadata: input.metadata || null,
        createdById: input.createdById,
      },
    });
  },

  /**
   * Get all notes for a lead (public + user's private)
   */
  async getNotes(leadId: number, companyId: number, userId: number) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId, deletedAt: null },
    });
    if (!lead) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Lead not found');
    }

    return prisma.leadNote.findMany({
      where: {
        leadId,
        companyId,
        OR: [
          { isPrivate: false },
          { isPrivate: true, createdById: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Add a note to a lead (private or public)
   */
  async addNote(input: {
    leadId: number;
    companyId: number;
    content: string;
    isPrivate: boolean;
    createdById: number;
  }) {
    const lead = await prisma.lead.findFirst({
      where: { id: input.leadId, companyId: input.companyId, deletedAt: null },
    });
    if (!lead) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Lead not found');
    }

    const note = await prisma.leadNote.create({
      data: {
        leadId: input.leadId,
        companyId: input.companyId,
        content: input.content,
        isPrivate: input.isPrivate,
        createdById: input.createdById,
      },
    });

    // Log activity
    await this.logActivity({
      leadId: input.leadId,
      companyId: input.companyId,
      activityType: 'NOTE_ADDED',
      title: input.isPrivate ? 'Private note added' : 'Public note added',
      description: input.content.substring(0, 200),
      createdById: input.createdById,
    });

    return note;
  },

  /**
   * Update an existing note (only by creator)
   */
  async updateNote(noteId: number, companyId: number, userId: number, content: string) {
    const note = await prisma.leadNote.findFirst({
      where: { id: noteId, companyId, createdById: userId },
    });
    if (!note) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Note not found');
    }

    return prisma.leadNote.update({
      where: { id: noteId },
      data: { content, editedAt: new Date() },
    });
  },

  /**
   * Reject a lead with reason
   */
  async rejectLead(leadId: number, companyId: number, reason: string, userId: number) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId, deletedAt: null },
    });
    if (!lead) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Lead not found');
    }
    if (lead.status === 'CONVERTED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 'Cannot reject a converted lead');
    }

    const previousStatus = lead.status;

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'NOT_QUALIFIED' as any, notes: reason },
      include: {
        facility: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Log activity
    await this.logActivity({
      leadId,
      companyId,
      activityType: 'LEAD_REJECTED',
      title: 'Lead rejected',
      description: reason,
      metadata: { previousStatus, reason },
      createdById: userId,
    });

    return updated;
  },
};
