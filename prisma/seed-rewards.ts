import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding rewards...');

  const rewards = [
    {
      title: 'Rp10k Cashback Voucher',
      pointsRequired: 10,
      type: 'VOUCHER',
      value: 10000,
      stock: 100,
      isActive: true
    },
    {
      title: 'Lanyards & Merch Pack',
      pointsRequired: 25,
      type: 'MERCHANDISE',
      value: 50000,
      stock: 50,
      isActive: true
    },
    {
      title: 'Elite Pass Discount 20%',
      pointsRequired: 15,
      type: 'DISCOUNT',
      value: 0.2,
      stock: 30,
      isActive: true
    }
  ];

  for (const reward of rewards) {
    await prisma.reward.upsert({
      where: { id: reward.title.toLowerCase().replace(/ /g, '-') }, // just a stable id for upsert
      update: reward,
      create: {
        id: reward.title.toLowerCase().replace(/ /g, '-'),
        ...reward
      }
    } as any);
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
