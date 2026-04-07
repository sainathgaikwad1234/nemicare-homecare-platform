// Database seed script
// Run with: npx prisma db seed

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'Demo HomeCare Group',
      legalName: 'Demo HomeCare Group LLC',
      ein: '12-3456789',
      website: 'www.homecaregroup.com',
      phone: '1-800-HOME-CARE',
      address: '123 Healthcare Blvd',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'USA',
      timezone: 'America/Chicago',
      active: true,
    },
  });

  console.log('✓ Company created:', company.name);

  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      companyId: company.id,
      name: 'Admin',
      description: 'System administrator with all permissions',
      permissions: [
        'leads.read',
        'leads.create',
        'leads.update',
        'leads.delete',
        'leads.convert',
        'residents.read',
        'residents.create',
        'residents.update',
        'residents.delete',
        'residents.discharge',
        'billing.read',
        'billing.create',
        'billing.update',
        'charting.read',
        'charting.create',
        'charting.sign',
        'users.read',
        'users.create',
        'users.update',
        'users.delete',
        'audit.read',
      ],
      active: true,
    },
  });

  const staffRole = await prisma.role.create({
    data: {
      companyId: company.id,
      name: 'Staff',
      description: 'Caregiver and support staff',
      permissions: [
        'leads.read',
        'residents.read',
        'residents.update',
        'charting.read',
        'charting.create',
        'charting.sign',
      ],
      active: true,
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      companyId: company.id,
      name: 'Manager',
      description: 'Facility manager',
      permissions: [
        'leads.read',
        'leads.create',
        'leads.update',
        'leads.delete',
        'leads.convert',
        'residents.read',
        'residents.create',
        'residents.update',
        'residents.delete',
        'residents.discharge',
        'billing.read',
        'billing.create',
        'charting.read',
        'users.read',
        'audit.read',
      ],
      active: true,
    },
  });

  console.log('✓ Roles created: Admin, Staff, Manager');

  // Create facility
  const facility = await prisma.facility.create({
    data: {
      companyId: company.id,
      name: 'Demo Facility - Central',
      facilityType: 'MIXED',
      licenseNumber: 'IL-HC-2024-001',
      address: '123 Healthcare Blvd',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      phone: '(312) 555-0101',
      email: 'central@homecaregroup.com',
      capacityAlf: 50,
      capacityAdh: 30,
      capacityHomeCare: 100,
      medicaidApproved: true,
      stateLicenseNumber: 'IL-HC-2024-001',
      npiNumber: '1234567890',
      active: true,
    },
  });

  console.log('✓ Facility created:', facility.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123456', 10);
  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      facilityId: facility.id,
      email: 'admin@demo.nemicare.local',
      firstName: 'Demo',
      lastName: 'Admin',
      phone: '(312) 555-0101',
      passwordHash: hashedPassword,
      roleId: adminRole.id,
      active: true,
      otpEnabled: false,
    },
  });

  console.log('✓ Admin user created:', adminUser.email);

  // Create manager user
  const managerPassword = await bcrypt.hash('Manager@123456', 10);
  const managerUser = await prisma.user.create({
    data: {
      companyId: company.id,
      facilityId: facility.id,
      email: 'manager@demo.nemicare.local',
      firstName: 'Jane',
      lastName: 'Manager',
      phone: '(312) 555-0102',
      passwordHash: managerPassword,
      roleId: managerRole.id,
      active: true,
      otpEnabled: false,
    },
  });

  console.log('✓ Manager user created:', managerUser.email);

  // Create staff user
  const staffPassword = await bcrypt.hash('Staff@123456', 10);
  const staffUser = await prisma.user.create({
    data: {
      companyId: company.id,
      facilityId: facility.id,
      email: 'staff@demo.nemicare.local',
      firstName: 'John',
      lastName: 'Caregiver',
      phone: '(312) 555-0103',
      passwordHash: staffPassword,
      roleId: staffRole.id,
      active: true,
      otpEnabled: false,
    },
  });

  console.log('✓ Staff user created:', staffUser.email);

  // Create sample leads
  const lead1 = await prisma.lead.create({
    data: {
      companyId: company.id,
      facilityId: facility.id,
      firstName: 'Robert',
      lastName: 'Johnson',
      phone: '(312) 555-0104',
      email: 'robert.johnson@email.com',
      dob: new Date('1945-03-15'),
      gender: 'M',
      source: 'REFERRAL',
      status: 'QUALIFIED',
      qualificationScore: 85,
      interestedIn: 'ALF',
      assignedToId: managerUser.id,
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      companyId: company.id,
      facilityId: facility.id,
      firstName: 'Margaret',
      lastName: 'Smith',
      phone: '(312) 555-0105',
      email: 'margaret.smith@email.com',
      dob: new Date('1950-07-22'),
      gender: 'F',
      source: 'WEBSITE',
      status: 'PROSPECT',
      qualificationScore: 45,
      interestedIn: 'HOME_CARE',
      assignedToId: managerUser.id,
    },
  });

  console.log('✓ Sample leads created:', lead1.firstName, ',', lead2.firstName);

  // Create sample resident
  const resident = await prisma.resident.create({
    data: {
      companyId: company.id,
      facilityId: facility.id,
      firstName: 'James',
      lastName: 'Williams',
      middleName: 'Michael',
      dob: new Date('1940-01-10'),
      gender: 'M',
      phone: '(312) 555-0106',
      email: 'james.williams@email.com',
      address: '456 Oak Street',
      city: 'Chicago',
      state: 'IL',
      zip: '60602',
      emergencyContactName: 'Sarah Williams',
      emergencyContactPhone: '(312) 555-0107',
      emergencyContactRelationship: 'Daughter',
      allergies: JSON.stringify(['Penicillin', 'Nuts']),
      medicalConditions: JSON.stringify(['Hypertension', 'Diabetes Type 2']),
      currentMedications: JSON.stringify(['Lisinopril', 'Metformin']),
      primaryPhysicianName: 'Dr. Sarah Lee',
      primaryPhysicianPhone: '(312) 555-0200',
      admissionDate: new Date('2024-01-15'),
      admissionType: 'NEW_ARRIVAL',
      status: 'ACTIVE',
      primaryService: 'ALF',
      visitFrequency: 3,
      billingType: 'MEDICAID',
      medicaidNumber: 'IL-12345678',
      nextOfKinId: managerUser.id,
      caseManagerId: managerUser.id,
      createdById: adminUser.id,
      notes: 'Sample resident for testing',
    },
  });

  console.log('✓ Sample resident created:', resident.firstName, resident.lastName);

  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📋 Test Accounts (for local development):');
  console.log('   Admin:   admin@demo.nemicare.local / Admin@123456');
  console.log('   Manager: manager@demo.nemicare.local / Manager@123456');
  console.log('   Staff:   staff@demo.nemicare.local / Staff@123456');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
