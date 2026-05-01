import { PrismaClient, Role, Membership } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('👤 Seeding additional regular users...');
  
  const hashedPassword = await bcrypt.hash('user123', 10);
  
  const users = [
    { email: 'user1@example.com', name: 'Budi Santoso' },
    { email: 'user2@example.com', name: 'Siti Aminah' },
    { email: 'user3@example.com', name: 'Agus Pratama' },
    { email: 'user4@example.com', name: 'Dewi Lestari' },
    { email: 'user5@example.com', name: 'Rizky Ramadhan' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: Role.USER,
        membership: Membership.FREE,
        avatar: `https://ui-avatars.com/api/?name=${u.name.replace(' ', '+')}&background=random`,
      },
    });
    console.log(`✅ User ${u.email} ensured.`);
  }

  console.log('✨ Additional users seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
