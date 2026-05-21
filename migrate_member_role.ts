import { prisma } from './backend/src/lib/prisma';

async function migrateRoles() {
  try {
    console.log('Migrating MEMBER roles to USER...');
    const result = await prisma.user.updateMany({
      where: {
        role: 'MEMBER' as any
      },
      data: {
        role: 'USER',
        membership: 'PREMIUM' // Assuming members are premium
      }
    });
    console.log(`Successfully migrated ${result.count} users.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateRoles();
