import { prisma } from '../config/database';

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) + v;
  }
  return n >>> 0;
}

function cidrMatch(ip: string, cidr: string): boolean {
  const [base, bitsStr] = cidr.split('/');
  const bits = bitsStr ? Number(bitsStr) : 32;
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const ipInt = ipv4ToInt(ip);
  const baseInt = ipv4ToInt(base);
  if (ipInt === null || baseInt === null) return false;
  if (bits === 0) return true;
  const mask = bits === 32 ? 0xffffffff : (~((1 << (32 - bits)) - 1)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

export function normalizeIp(raw: string | undefined | null): string | null {
  if (!raw) return null;
  // Strip IPv6 mapping prefix (::ffff:1.2.3.4)
  const stripped = raw.replace(/^::ffff:/i, '');
  // If still contains colons (real IPv6) we don't validate against IPv4 CIDRs
  return stripped;
}

export async function isIpWhitelistedForFacility(facilityId: number, ip: string): Promise<boolean> {
  const entries = await (prisma as any).facilityIpWhitelist.findMany({
    where: { facilityId, active: true },
  });
  if (!entries.length) return false;
  return entries.some((e: any) => cidrMatch(ip, e.cidr));
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function isGeoWithinFacility(
  facilityId: number,
  lat: number,
  lng: number,
): Promise<{ ok: boolean; distance?: number; radius?: number }> {
  const fence = await (prisma as any).facilityGeofence.findUnique({ where: { facilityId } });
  if (!fence || !fence.active) return { ok: true }; // no fence configured = allow
  const distance = haversineMeters(fence.lat, fence.lng, lat, lng);
  return { ok: distance <= fence.radiusMeters, distance, radius: fence.radiusMeters };
}
