/**
 * Prisma Seed Script
 * Seeds two companies with realistic user hierarchies and an open feedback cycle.
 *
 * Company 1: Ashoka Textiles
 *   - COO Amit (top-level employee)
 *   - Rohan (manager, reports to Amit)
 *   - Priya (manager, reports to Rohan) → manages 6 employees
 *   - Kavita (hr, reports to Amit) → manages 2 HR staff
 *
 * Company 2: Bright Path Consulting
 *   - Founder (manager, no reportsTo)
 *   - 8 employees reporting to Founder
 *   - Meera (hr, reports to Founder)
 *
 * All passwords are: Password@123
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PASSWORD = 'Password@123';

async function main() {
  console.log('🌱 Starting seed...\n');

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ────────────────────────────────────────────
  // COMPANY 1: Ashoka Textiles
  // ────────────────────────────────────────────
  console.log('Creating Ashoka Textiles...');

  const ashoka = await prisma.company.create({
    data: { name: 'Ashoka Textiles' },
  });

  // Top-level: COO Amit
  const amit = await prisma.user.create({
    data: {
      companyId: ashoka.id,
      name: 'Amit Sharma',
      email: 'amit@ashoka.com',
      passwordHash,
      role: 'employee',
      reportsToId: null,
    },
  });

  // Kavita: HR, reports to Amit
  const kavita = await prisma.user.create({
    data: {
      companyId: ashoka.id,
      name: 'Kavita Mehta',
      email: 'kavita@ashoka.com',
      passwordHash,
      role: 'hr',
      reportsToId: amit.id,
    },
  });

  // HR Staff under Kavita
  await prisma.user.createMany({
    data: [
      {
        companyId: ashoka.id,
        name: 'HR Staff Ananya',
        email: 'ananya@ashoka.com',
        passwordHash,
        role: 'employee',
        reportsToId: kavita.id,
      },
      {
        companyId: ashoka.id,
        name: 'HR Staff Vikram',
        email: 'vikram.hr@ashoka.com',
        passwordHash,
        role: 'employee',
        reportsToId: kavita.id,
      },
    ],
  });

  // Rohan: manager, reports to Amit
  const rohan = await prisma.user.create({
    data: {
      companyId: ashoka.id,
      name: 'Rohan Verma',
      email: 'rohan@ashoka.com',
      passwordHash,
      role: 'manager',
      reportsToId: amit.id,
    },
  });

  // Priya: manager, reports to Rohan
  const priya = await prisma.user.create({
    data: {
      companyId: ashoka.id,
      name: 'Priya Nair',
      email: 'priya@ashoka.com',
      passwordHash,
      role: 'manager',
      reportsToId: rohan.id,
    },
  });

  // 6 employees under Priya
  await prisma.user.createMany({
    data: [
      {
        companyId: ashoka.id,
        name: 'Sneha Kulkarni',
        email: 'sneha@ashoka.com',
        passwordHash,
        role: 'employee',
        reportsToId: priya.id,
      },
      {
        companyId: ashoka.id,
        name: 'Raj Patel',
        email: 'raj@ashoka.com',
        passwordHash,
        role: 'employee',
        reportsToId: priya.id,
      },
      {
        companyId: ashoka.id,
        name: 'Arjun Singh',
        email: 'arjun@ashoka.com',
        passwordHash,
        role: 'employee',
        reportsToId: priya.id,
      },
      {
        companyId: ashoka.id,
        name: 'Divya Reddy',
        email: 'divya@ashoka.com',
        passwordHash,
        role: 'employee',
        reportsToId: priya.id,
      },
      {
        companyId: ashoka.id,
        name: 'Kiran Joshi',
        email: 'kiran@ashoka.com',
        passwordHash,
        role: 'employee',
        reportsToId: priya.id,
      },
      {
        companyId: ashoka.id,
        name: 'Meena Iyer',
        email: 'meena@ashoka.com',
        passwordHash,
        role: 'employee',
        reportsToId: priya.id,
      },
    ],
  });

  // Open cycle for Ashoka — current month
  const now = new Date();
  await prisma.feedbackCycle.create({
    data: {
      companyId: ashoka.id,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      status: 'open',
    },
  });

  console.log('✅ Ashoka Textiles seeded\n');

  // ────────────────────────────────────────────
  // COMPANY 2: Bright Path Consulting
  // ────────────────────────────────────────────
  console.log('Creating Bright Path Consulting...');

  const brightPath = await prisma.company.create({
    data: { name: 'Bright Path Consulting' },
  });

  // Founder: no manager above
  const founder = await prisma.user.create({
    data: {
      companyId: brightPath.id,
      name: 'Founder Sanjay',
      email: 'sanjay@brightpath.com',
      passwordHash,
      role: 'manager',
      reportsToId: null,
    },
  });

  // 8 employees under Founder
  const brightEmployees = [
    'Aditya Kumar',
    'Pooja Sharma',
    'Rahul Gupta',
    'Neha Jain',
    'Vivek Rao',
    'Shruti Das',
    'Manish Tiwari',
    'Lakshmi Pillai',
  ];

  await prisma.user.createMany({
    data: brightEmployees.map((name, i) => ({
      companyId: brightPath.id,
      name,
      email: `${name.split(' ')[0].toLowerCase()}@brightpath.com`,
      passwordHash,
      role: 'employee',
      reportsToId: founder.id,
    })),
  });

  // Meera: HR, reports to Founder
  await prisma.user.create({
    data: {
      companyId: brightPath.id,
      name: 'Meera Nambiar',
      email: 'meera@brightpath.com',
      passwordHash,
      role: 'hr',
      reportsToId: founder.id,
    },
  });

  // Open cycle for Bright Path — current month
  await prisma.feedbackCycle.create({
    data: {
      companyId: brightPath.id,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      status: 'open',
    },
  });

  console.log('✅ Bright Path Consulting seeded\n');
  console.log('🎉 Seed complete! All passwords are: Password@123');
  console.log('\n📋 Login credentials:');
  console.log('─────────────────────────────────────────────');
  console.log('ASHOKA TEXTILES');
  console.log('  amit@ashoka.com      → employee (COO, top-level)');
  console.log('  kavita@ashoka.com    → hr (reports to Amit, manages 2)');
  console.log('  rohan@ashoka.com     → manager (reports to Amit)');
  console.log('  priya@ashoka.com     → manager (reports to Rohan, manages 6)');
  console.log('  sneha@ashoka.com     → employee (reports to Priya)');
  console.log('  raj@ashoka.com       → employee (reports to Priya)');
  console.log('  arjun@ashoka.com     → employee (reports to Priya)');
  console.log('  divya@ashoka.com     → employee (reports to Priya)');
  console.log('  kiran@ashoka.com     → employee (reports to Priya)');
  console.log('  meena@ashoka.com     → employee (reports to Priya)');
  console.log('  ananya@ashoka.com    → employee (reports to Kavita)');
  console.log('  vikram.hr@ashoka.com → employee (reports to Kavita)');
  console.log('─────────────────────────────────────────────');
  console.log('BRIGHT PATH CONSULTING');
  console.log('  sanjay@brightpath.com  → manager (Founder, top-level)');
  console.log('  meera@brightpath.com   → hr (reports to Founder)');
  console.log('  aditya@brightpath.com  → employee');
  console.log('  pooja@brightpath.com   → employee');
  console.log('  rahul@brightpath.com   → employee');
  console.log('  neha@brightpath.com    → employee');
  console.log('  vivek@brightpath.com   → employee');
  console.log('  shruti@brightpath.com  → employee');
  console.log('  manish@brightpath.com  → employee');
  console.log('  lakshmi@brightpath.com → employee');
  console.log('─────────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
