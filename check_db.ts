import { prisma } from './backend/src/lib/prisma';

async function checkDb() {
  try {
    console.log('Checking database connection...');
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    console.log('Checking Notification table...');
    const notificationCount = await prisma.notification.count();
    console.log('Notification count:', notificationCount);

    console.log('--- Event Images ---');
    const events = await prisma.event.findMany({
      select: { id: true, title: true, image: true }
    });
    events.forEach(e => {
      console.log(`Event: ${e.title} | Image: ${e.image}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Database check failed:', error);
    process.exit(1);
  }
}

checkDb();
