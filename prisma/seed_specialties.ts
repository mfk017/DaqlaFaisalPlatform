import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const specialties = [
    { name: 'cutting', label: 'قص' },
    { name: 'embroidery', label: 'تطريز' },
    { name: 'sewing', label: 'خياطة' },
    { name: 'buttons', label: 'أزرار' },
    { name: 'ironing', label: 'كوي' },
    { name: 'other', label: 'أخرى' },
  ];

  for (const sp of specialties) {
    await prisma.specialty.upsert({
      where: { name: sp.name },
      update: {},
      create: sp,
    });
  }

  console.log('Seeded default specialties');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
