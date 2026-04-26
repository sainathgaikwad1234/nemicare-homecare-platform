import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

interface ListEmployeesOptions {
  companyId: number;
  facilityId?: number;
  status?: string;
  userRole?: string;
  department?: string;
  onboardingStatus?: 'IN_PROGRESS' | 'COMPLETED' | 'ALL';
  searchQuery?: string;
  page: number;
  pageSize: number;
}

const employeeInclude = {
  user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
  facility: { select: { id: true, name: true } },
};

export const employeeService = {
  async listEmployees(options: ListEmployeesOptions) {
    const { companyId, facilityId, status, userRole, department, onboardingStatus, searchQuery, page, pageSize } = options;

    const where: any = {
      companyId: Number(companyId),
      deletedAt: null,
    };

    if (facilityId) where.facilityId = Number(facilityId);
    if (status) where.status = status;
    if (userRole) where.userRole = userRole;
    if (department) where.department = department;
    // Default: exclude IN_PROGRESS employees from main list (they appear under /onboarding)
    if (onboardingStatus === 'IN_PROGRESS') where.onboardingStatus = 'IN_PROGRESS';
    else if (onboardingStatus === 'COMPLETED') where.onboardingStatus = 'COMPLETED';
    else if (onboardingStatus !== 'ALL') where.onboardingStatus = 'COMPLETED';

    if (searchQuery) {
      where.OR = [
        { firstName: { contains: searchQuery, mode: 'insensitive' } },
        { lastName: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { phone: { contains: searchQuery, mode: 'insensitive' } },
        { employeeIdNumber: { contains: searchQuery, mode: 'insensitive' } },
        { positionTitle: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const total = await (prisma as any).employee.count({ where });
    const employees = await (prisma as any).employee.findMany({
      where,
      include: employeeInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data: employees,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async getEmployeeById(id: number, companyId: number) {
    const employee = await (prisma as any).employee.findFirst({
      where: { id: Number(id), companyId: Number(companyId), deletedAt: null },
      include: {
        ...employeeInclude,
        documents: { orderBy: { createdAt: 'desc' } },
        leaveBalance: true,
        reportingManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
        onboardingDocuments: { orderBy: { createdAt: 'asc' } },
        onboardingMandatoryDocs: { orderBy: { uploadedAt: 'desc' } },
      },
    });

    if (!employee) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');
    }

    return employee;
  },

  async createEmployee(input: any, userId: number) {
    const companyId = Number(input.companyId);
    const facilityId = Number(input.facilityId);

    if (!input.firstName || !input.lastName || !input.email) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'firstName, lastName, and email are required');
    }

    const facility = await prisma.facility.findFirst({
      where: { id: facilityId, companyId, deletedAt: null },
    });
    if (!facility) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 'Invalid facility');
    }

    const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'An account with this email already exists');
    }

    const defaultRole = await prisma.role.findFirst({
      where: { OR: [{ companyId }, { companyId: null }], name: { in: ['Staff', 'Employee', 'Manager'] } },
      orderBy: { id: 'asc' },
    });
    if (!defaultRole) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 'No default role configured for company');
    }

    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          companyId,
          facilityId,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone || null,
          passwordHash,
          roleId: defaultRole.id,
          active: false,
        },
      });

      const employee = await tx.employee.create({
        data: {
          companyId,
          facilityId,
          userId: user.id,
          // Personal
          firstName: input.firstName,
          lastName: input.lastName,
          middleName: input.middleName || null,
          salutation: input.salutation || null,
          email: input.email,
          phone: input.phone || null,
          dob: input.dob ? new Date(input.dob) : null,
          gender: input.gender || null,
          profilePictureUrl: input.profilePictureUrl || null,
          address: input.address || null,
          addressLine2: input.addressLine2 || null,
          city: input.city || null,
          state: input.state || null,
          zip: input.zip || null,
          country: input.country || null,
          language: input.language || null,
          about: input.about || null,
          ssn: input.ssn || null,
          maritalStatus: input.maritalStatus || null,
          businessAddress: input.businessAddress || null,
          slackMemberId: input.slackMemberId || null,
          socialLinks: input.socialLinks || null,
          // Emergency contact
          emergencyContactName: input.emergencyContactName || null,
          emergencyContactPhone: input.emergencyContactPhone || null,
          emergencyContactRelation: input.emergencyContactRelation || null,
          // Employment
          employeeIdNumber: input.employeeIdNumber || null,
          positionTitle: input.positionTitle || null,
          designation: input.designation || null,
          clinicalRole: input.clinicalRole || null,
          department: input.department || null,
          employmentType: (input.employmentType || 'FULL_TIME') as any,
          userRole: (input.userRole || input.hrmsRole || 'EMPLOYEE') as any,
          hrmsRole: (input.userRole || input.hrmsRole || 'EMPLOYEE') as any,
          hireDate: input.hireDate ? new Date(input.hireDate) : (input.joiningDate ? new Date(input.joiningDate) : new Date()),
          reportingManagerId: input.reportingManagerId ? Number(input.reportingManagerId) : null,
          probationEndDate: input.probationEndDate ? new Date(input.probationEndDate) : null,
          noticeEndDate: input.noticeEndDate ? new Date(input.noticeEndDate) : null,
          overtimeAllowed: input.overtimeAllowed === true,
          // Licensing
          licenseType: input.licenseType || null,
          licenseNumber: input.licenseNumber || null,
          licenseExpiry: input.licenseExpiry ? new Date(input.licenseExpiry) : null,
          // Compensation
          baseSalary: input.baseSalary ? Number(input.baseSalary) : null,
          hourlyRate: input.hourlyRate ? Number(input.hourlyRate) : null,
          payFrequency: (input.payFrequency || 'BIWEEKLY') as any,
          // Onboarding defaults
          status: 'ACTIVE' as any, // employment status (will become TERMINATED later)
          onboardingStatus: 'IN_PROGRESS' as any,
          onboardingStep: 1,
        },
        include: employeeInclude,
      });

      const currentYear = new Date().getFullYear();
      await tx.leaveBalance.create({
        data: {
          companyId,
          employeeId: employee.id,
          annualBalance: 15,
          sickBalance: 10,
          personalBalance: 5,
          unpaidBalance: 0,
          year: currentYear,
        },
      });

      return employee;
    });

    return result;
  },

  async updateEmployee(id: number, companyId: number, input: any) {
    const existing = await (prisma as any).employee.findFirst({
      where: { id: Number(id), companyId: Number(companyId), deletedAt: null },
    });
    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');
    }

    const updateData: any = {};
    const stringFields = [
      'firstName', 'lastName', 'middleName', 'salutation', 'phone', 'gender', 'profilePictureUrl',
      'address', 'addressLine2', 'city', 'state', 'zip', 'country', 'language', 'about',
      'ssn', 'maritalStatus', 'businessAddress', 'slackMemberId',
      'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation',
      'employeeIdNumber', 'positionTitle', 'designation', 'clinicalRole', 'department',
      'licenseType', 'licenseNumber',
    ];
    for (const f of stringFields) if (input[f] !== undefined) updateData[f] = input[f];

    if (input.socialLinks !== undefined) updateData.socialLinks = input.socialLinks;
    if (input.dob !== undefined) updateData.dob = input.dob ? new Date(input.dob) : null;
    if (input.hireDate !== undefined) updateData.hireDate = new Date(input.hireDate);
    if (input.licenseExpiry !== undefined) updateData.licenseExpiry = input.licenseExpiry ? new Date(input.licenseExpiry) : null;
    if (input.probationEndDate !== undefined) updateData.probationEndDate = input.probationEndDate ? new Date(input.probationEndDate) : null;
    if (input.noticeEndDate !== undefined) updateData.noticeEndDate = input.noticeEndDate ? new Date(input.noticeEndDate) : null;
    if (input.officialStartDate !== undefined) updateData.officialStartDate = input.officialStartDate ? new Date(input.officialStartDate) : null;
    if (input.baseSalary !== undefined) updateData.baseSalary = input.baseSalary ? Number(input.baseSalary) : null;
    if (input.hourlyRate !== undefined) updateData.hourlyRate = input.hourlyRate ? Number(input.hourlyRate) : null;
    if (input.reportingManagerId !== undefined) updateData.reportingManagerId = input.reportingManagerId ? Number(input.reportingManagerId) : null;
    if (input.overtimeAllowed !== undefined) updateData.overtimeAllowed = input.overtimeAllowed === true;
    if (input.employmentType) updateData.employmentType = input.employmentType;
    if (input.userRole) { updateData.userRole = input.userRole; updateData.hrmsRole = input.userRole; }
    if (input.hrmsRole) { updateData.hrmsRole = input.hrmsRole; updateData.userRole = input.hrmsRole; }
    if (input.payFrequency) updateData.payFrequency = input.payFrequency;
    if (input.status) updateData.status = input.status;

    const updated = await (prisma as any).employee.update({
      where: { id: Number(id) },
      data: updateData,
      include: employeeInclude,
    });

    return updated;
  },

  async deleteEmployee(id: number, companyId: number) {
    const existing = await (prisma as any).employee.findFirst({
      where: { id: Number(id), companyId: Number(companyId), deletedAt: null },
    });
    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');
    }

    await (prisma as any).employee.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });

    return { message: 'Employee deleted successfully' };
  },

  async activateEmployee(id: number, companyId: number) {
    const existing = await (prisma as any).employee.findFirst({
      where: { id: Number(id), companyId: Number(companyId), deletedAt: null },
    });
    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const emp = await tx.employee.update({
        where: { id: Number(id) },
        data: {
          status: 'ACTIVE' as any,
          activatedAt: new Date(),
        },
        include: employeeInclude,
      });
      await tx.user.update({
        where: { id: existing.userId },
        data: { active: true },
      });
      return emp;
    });

    return result;
  },

  async terminateEmployee(id: number, companyId: number, terminationDate?: Date) {
    const existing = await (prisma as any).employee.findFirst({
      where: { id: Number(id), companyId: Number(companyId), deletedAt: null },
    });
    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');
    }

    return (prisma as any).employee.update({
      where: { id: Number(id) },
      data: {
        status: 'TERMINATED' as any,
        terminationDate: terminationDate ? new Date(terminationDate) : new Date(),
      },
      include: employeeInclude,
    });
  },

  async sendWelcomeEmail(id: number, companyId: number) {
    const existing = await (prisma as any).employee.findFirst({
      where: { id: Number(id), companyId: Number(companyId), deletedAt: null },
    });
    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');
    }

    const updated = await (prisma as any).employee.update({
      where: { id: Number(id) },
      data: { welcomeEmailSentAt: new Date() },
      include: employeeInclude,
    });

    // TODO: integrate real email/SES sender. Placeholder logs to console.
    console.log(`[HRMS] Welcome email queued for ${updated.email}`);

    return { message: 'Welcome email sent', sentAt: updated.welcomeEmailSentAt };
  },

  async getEmployeeDocuments(employeeId: number, companyId: number) {
    const employee = await this.getEmployeeById(employeeId, companyId);
    return (prisma as any).employeeDocument.findMany({
      where: { employeeId: employee.id, companyId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async addEmployeeDocument(employeeId: number, companyId: number, input: any, userId: number) {
    const employee = await this.getEmployeeById(employeeId, companyId);
    return (prisma as any).employeeDocument.create({
      data: {
        companyId,
        employeeId: employee.id,
        documentType: input.documentType,
        documentName: input.documentName,
        fileUrl: input.fileUrl || null,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        status: input.fileUrl ? 'UPLOADED' : 'PENDING',
        notes: input.notes || null,
        uploadedById: userId,
      },
    });
  },

  async deleteEmployeeDocument(employeeId: number, documentId: number, companyId: number) {
    const doc = await (prisma as any).employeeDocument.findFirst({
      where: { id: Number(documentId), employeeId: Number(employeeId), companyId },
    });
    if (!doc) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Document not found');
    }
    await (prisma as any).employeeDocument.delete({ where: { id: Number(documentId) } });
    return { message: 'Document deleted' };
  },
};
