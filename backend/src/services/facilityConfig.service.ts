import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

export const facilityConfigService = {
  // ============== IP whitelist ==============
  async listWhitelist(facilityId: number) {
    return (prisma as any).facilityIpWhitelist.findMany({
      where: { facilityId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async addWhitelistEntry(facilityId: number, cidr: string, description?: string) {
    if (!cidr || !cidr.includes('/')) {
      // accept bare IP — auto-coerce to /32
      cidr = `${cidr}/32`;
    }
    return (prisma as any).facilityIpWhitelist.create({
      data: { facilityId, cidr, description: description ?? null },
    });
  },

  async toggleWhitelistEntry(id: number, active: boolean) {
    return (prisma as any).facilityIpWhitelist.update({
      where: { id },
      data: { active },
    });
  },

  async deleteWhitelistEntry(id: number) {
    return (prisma as any).facilityIpWhitelist.delete({ where: { id } });
  },

  // ============== Geofence ==============
  async getGeofence(facilityId: number) {
    return (prisma as any).facilityGeofence.findUnique({ where: { facilityId } });
  },

  async upsertGeofence(facilityId: number, lat: number, lng: number, radiusMeters: number, active = true) {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'lat/lng required');
    }
    if (!Number.isInteger(radiusMeters) || radiusMeters <= 0) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'radiusMeters must be positive integer');
    }
    return (prisma as any).facilityGeofence.upsert({
      where: { facilityId },
      update: { lat, lng, radiusMeters, active },
      create: { facilityId, lat, lng, radiusMeters, active },
    });
  },
};
