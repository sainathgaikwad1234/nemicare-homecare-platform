import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { isIpWhitelistedForFacility, isGeoWithinFacility, normalizeIp } from '../utils/ipGeoValidation';

const PunchType = {
  CLOCK_IN: 'CLOCK_IN',
  BREAK_START: 'BREAK_START',
  BREAK_END: 'BREAK_END',
  CLOCK_OUT: 'CLOCK_OUT',
} as const;
type PunchTypeValue = (typeof PunchType)[keyof typeof PunchType];

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

async function resolveEmployee(userId: number) {
  const emp = await (prisma as any).employee.findFirst({
    where: { userId: Number(userId), deletedAt: null },
  });
  if (!emp) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND,
      'No employee record linked to this user. Contact HR.');
  }
  return emp;
}

async function getTodayPunches(employeeId: number) {
  const now = new Date();
  return (prisma as any).employeePunch.findMany({
    where: { employeeId, timestamp: { gte: startOfDay(now), lte: endOfDay(now) } },
    orderBy: { timestamp: 'asc' },
  });
}

function deriveState(punches: any[]): {
  state: 'OFF' | 'CLOCKED_IN' | 'ON_BREAK' | 'CLOCKED_OUT';
  lastPunch: any | null;
} {
  if (!punches.length) return { state: 'OFF', lastPunch: null };
  const last = punches[punches.length - 1];
  switch (last.punchType) {
    case 'CLOCK_IN': return { state: 'CLOCKED_IN', lastPunch: last };
    case 'BREAK_START': return { state: 'ON_BREAK', lastPunch: last };
    case 'BREAK_END': return { state: 'CLOCKED_IN', lastPunch: last };
    case 'CLOCK_OUT': return { state: 'CLOCKED_OUT', lastPunch: last };
    default: return { state: 'OFF', lastPunch: last };
  }
}

async function record(
  employeeId: number,
  facilityId: number,
  punchType: PunchTypeValue,
  ipRaw?: string,
  geo?: { lat?: number; lng?: number },
  enforceLocation = true,
) {
  const ip = normalizeIp(ipRaw);
  let ipValidated = false;
  if (ip) {
    ipValidated = await isIpWhitelistedForFacility(facilityId, ip);
  }
  if (enforceLocation && ip && !ipValidated) {
    // If a whitelist exists but IP doesn't match, hard-block clock-in only.
    const hasWhitelist = await (prisma as any).facilityIpWhitelist.count({
      where: { facilityId, active: true },
    });
    if (hasWhitelist > 0 && punchType === PunchType.CLOCK_IN) {
      throw new AppError(
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.UNAUTHORIZED,
        `Clock-in blocked: IP ${ip} is not on the facility whitelist.`,
      );
    }
  }

  let geoValidated = false;
  if (geo && typeof geo.lat === 'number' && typeof geo.lng === 'number') {
    const result = await isGeoWithinFacility(facilityId, geo.lat, geo.lng);
    geoValidated = result.ok;
    if (enforceLocation && !result.ok && punchType === PunchType.CLOCK_IN) {
      throw new AppError(
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.UNAUTHORIZED,
        `Clock-in blocked: location ${result.distance?.toFixed(0)}m from facility (max ${result.radius}m).`,
      );
    }
  }

  return (prisma as any).employeePunch.create({
    data: {
      employeeId,
      punchType,
      ipAddress: ip || null,
      ipValidated,
      geoLat: geo?.lat ?? null,
      geoLng: geo?.lng ?? null,
      geoValidated,
    },
  });
}

export const employeeAttendanceService = {
  async getTodayState(userId: number) {
    const emp = await resolveEmployee(userId);
    const punches = await getTodayPunches(emp.id);
    return { ...deriveState(punches), punches, employee: { id: emp.id, facilityId: emp.facilityId } };
  },

  async clockIn(userId: number, opts: { ip?: string; lat?: number; lng?: number }) {
    const emp = await resolveEmployee(userId);
    const punches = await getTodayPunches(emp.id);
    const { state } = deriveState(punches);
    if (state !== 'OFF') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `Cannot clock in while state is ${state}.`);
    }
    return record(emp.id, emp.facilityId, PunchType.CLOCK_IN, opts.ip, { lat: opts.lat, lng: opts.lng });
  },

  async startBreak(userId: number, opts: { ip?: string; lat?: number; lng?: number }) {
    const emp = await resolveEmployee(userId);
    const punches = await getTodayPunches(emp.id);
    const { state } = deriveState(punches);
    if (state !== 'CLOCKED_IN') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `Cannot start break while state is ${state}.`);
    }
    return record(emp.id, emp.facilityId, PunchType.BREAK_START, opts.ip, { lat: opts.lat, lng: opts.lng }, false);
  },

  async endBreak(userId: number, opts: { ip?: string; lat?: number; lng?: number }) {
    const emp = await resolveEmployee(userId);
    const punches = await getTodayPunches(emp.id);
    const { state } = deriveState(punches);
    if (state !== 'ON_BREAK') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `Cannot end break while state is ${state}.`);
    }
    return record(emp.id, emp.facilityId, PunchType.BREAK_END, opts.ip, { lat: opts.lat, lng: opts.lng }, false);
  },

  async clockOut(userId: number, opts: { ip?: string; lat?: number; lng?: number; taskDetails?: string }) {
    const emp = await resolveEmployee(userId);
    const punches = await getTodayPunches(emp.id);
    const { state } = deriveState(punches);
    if (state !== 'CLOCKED_IN') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `Cannot clock out while state is ${state}.`);
    }
    const punch = await record(emp.id, emp.facilityId, PunchType.CLOCK_OUT, opts.ip, { lat: opts.lat, lng: opts.lng }, false);

    // Auto-create or update today's draft timecard with computed totals
    const { computeAndUpsertDailyTimecard } = await import('./timecard.service');
    await computeAndUpsertDailyTimecard(emp.id, new Date(), opts.taskDetails);

    return punch;
  },
};
