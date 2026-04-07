import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

const VALID_STEP_KEYS = [
  'caseAgencyData',
  'documentsData',
  'caseManagerData',
  'transportationData',
  'billingData',
  'bedAvailabilityData',
  'assessmentData',
];

export const patientSetupService = {
  async getSetup(residentId: number, companyId: number) {
    const resident = await prisma.resident.findFirst({
      where: { id: Number(residentId), companyId: Number(companyId), deletedAt: null },
    });
    if (!resident) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Resident not found');

    let setup = await prisma.patientSetup.findFirst({
      where: { residentId: Number(residentId), companyId: Number(companyId) },
    });

    if (!setup) {
      setup = await prisma.patientSetup.create({
        data: {
          residentId: Number(residentId),
          companyId: Number(companyId),
          currentStep: 0,
          completedSteps: [],
          caseAgencyData: {},
          documentsData: {},
          caseManagerData: {},
          transportationData: {},
          billingData: {},
          bedAvailabilityData: {},
          assessmentData: {},
        },
      });
    }

    return setup;
  },

  async updateStep(residentId: number, companyId: number, stepKey: string, data: any, userId: number) {
    if (!VALID_STEP_KEYS.includes(stepKey)) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, `Invalid step key: ${stepKey}. Valid keys: ${VALID_STEP_KEYS.join(', ')}`);
    }

    const setup = await this.getSetup(residentId, companyId);

    return prisma.patientSetup.update({
      where: { id: setup.id },
      data: {
        [stepKey]: data,
        updatedById: Number(userId),
      },
    });
  },

  async completeStep(residentId: number, companyId: number, stepIndex: number, userId: number) {
    const setup = await this.getSetup(residentId, companyId);

    const completedSteps = Array.isArray(setup.completedSteps) ? [...(setup.completedSteps as number[])] : [];
    if (!completedSteps.includes(stepIndex)) {
      completedSteps.push(stepIndex);
      completedSteps.sort((a: number, b: number) => a - b);
    }

    const currentStep = Math.max(setup.currentStep as number, stepIndex + 1);

    return prisma.patientSetup.update({
      where: { id: setup.id },
      data: {
        completedSteps,
        currentStep,
        updatedById: Number(userId),
      },
    });
  },
};
