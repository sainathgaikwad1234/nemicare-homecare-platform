import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

const makeChartingCrud = (modelName: string) => {
  const model = (prisma as any)[modelName];
  return {
    async list(residentId: number, companyId: number, page = 1, pageSize = 50) {
      const where: any = { residentId: Number(residentId), companyId: Number(companyId) };
      const total = await model.count({ where });
      const items = await model.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize });
      return { data: items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
    },
    async getById(id: number, companyId: number) {
      const item = await model.findFirst({ where: { id: Number(id), companyId: Number(companyId) } });
      if (!item) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, `${modelName} not found`);
      return item;
    },
    async create(residentId: number, companyId: number, data: any, userId: number) {
      const resident = await prisma.resident.findFirst({ where: { id: Number(residentId), companyId: Number(companyId), deletedAt: null } });
      if (!resident) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Resident not found');
      return model.create({ data: { ...data, residentId: Number(residentId), companyId: Number(companyId), addedById: Number(userId) } });
    },
    async update(id: number, companyId: number, data: any) {
      const existing = await model.findFirst({ where: { id: Number(id), companyId: Number(companyId) } });
      if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, `${modelName} not found`);
      const { residentId, companyId: _, addedById, createdAt, updatedAt, id: __, ...updateData } = data;
      return model.update({ where: { id: Number(id) }, data: updateData });
    },
    async remove(id: number, companyId: number) {
      const existing = await model.findFirst({ where: { id: Number(id), companyId: Number(companyId) } });
      if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, `${modelName} not found`);
      await model.delete({ where: { id: Number(id) } });
      return { message: `${modelName} deleted` };
    },
  };
};

const makeIncidentCrud = () => {
  const base = makeChartingCrud('incident');
  return {
    ...base,
    async create(residentId: number, companyId: number, data: any, userId: number) {
      const resident = await prisma.resident.findFirst({ where: { id: Number(residentId), companyId: Number(companyId), deletedAt: null } });
      if (!resident) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Resident not found');
      return prisma.incident.create({ data: { ...data, residentId: Number(residentId), companyId: Number(companyId), reportedById: Number(userId), date: data.date ? new Date(data.date) : new Date() } });
    },
  };
};

export const chartingService = {
  vitals: makeChartingCrud('vital'),
  allergies: makeChartingCrud('allergy'),
  medications: makeChartingCrud('medication'),
  carePlans: makeChartingCrud('carePlan'),
  events: makeChartingCrud('residentEvent'),
  progressNotes: makeChartingCrud('progressNote'),
  services: makeChartingCrud('residentService'),
  tickets: makeChartingCrud('ticket'),
  inventory: makeChartingCrud('inventoryItem'),
  incidents: makeIncidentCrud(),
  painScale: makeChartingCrud('painScale'),
  faceToFace: makeChartingCrud('faceToFaceNote'),
};
