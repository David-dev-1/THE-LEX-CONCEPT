const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@thelexconcept.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.ADMIN_NAME || 'Alexandra Fajemirokun';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { email, password: hashed, name } });
    console.log(`✓ Admin account created: ${email}`);
    console.log(`  Password: ${password} (change this after first login)`);
  } else {
    console.log(`Admin account already exists for ${email}, skipping.`);
  }

  const workCount = await prisma.work.count();
  if (workCount === 0) {
    console.log('Seeding a few sample works (replace these from the admin dashboard)...');
    await prisma.work.createMany({
      data: [
        {
          title: 'Aurea Skincare',
          category: 'brand',
          description: 'Full brand identity for a skincare line — logo, packaging, and social templates.',
          imageUrl: '/images/placeholder-work.svg',
          thumbUrl: '/images/placeholder-work.svg',
        },
        {
          title: 'Nomad Coffee Co.',
          category: 'logo',
          description: 'Primary and secondary logo marks for a specialty coffee roaster.',
          imageUrl: '/images/placeholder-work.svg',
          thumbUrl: '/images/placeholder-work.svg',
        },
        {
          title: 'Campus Fest 2026',
          category: 'flyer',
          description: 'Event poster and social flyer series for a university festival.',
          imageUrl: '/images/placeholder-work.svg',
          thumbUrl: '/images/placeholder-work.svg',
        },
        {
          title: 'Verve Law Journal',
          category: 'print',
          description: 'Cover design and interior layout for a student law journal.',
          imageUrl: '/images/placeholder-work.svg',
          thumbUrl: '/images/placeholder-work.svg',
        },
      ],
    });
  }

  const contentExists = await prisma.siteContent.findUnique({ where: { id: 1 } });
  if (!contentExists) {
    await prisma.siteContent.create({ data: { id: 1 } });
    console.log('✓ Default site content created (edit it from Admin → Site Content).');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
