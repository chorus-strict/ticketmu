import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🎫 Starting ticket seeding...');

  // Get all users and events
  const users = await prisma.user.findMany();
  const events = await prisma.event.findMany();

  if (users.length === 0 || events.length === 0) {
    console.error('❌ No users or events found. Please run main seed first.');
    return;
  }

  console.log(`Found ${users.length} users and ${events.length} events.`);

  // Clear existing tickets first? User said "Only add tickets", but for a clean start in dev it might be good.
  // Actually the request was "Fix ticket system and seed ticket data". 
  // I will just add tickets.

  const ticketsToCreate = [];

  // Ensure each user has at least 1 ticket
  for (const user of users) {
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    ticketsToCreate.push({
      userId: user.id,
      eventId: randomEvent.id,
      qrCode: `TCK-${uuidv4().slice(0, 8).toUpperCase()}`,
      status: 'ACTIVE' as const,
      purchaseDate: new Date(Date.now() - Math.floor(Math.random() * 1000000000)), // Random date in the past
    });
  }

  // Create additional random tickets to reach at least 50
  const remaining = 55 - ticketsToCreate.length;
  for (let i = 0; i < remaining; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    ticketsToCreate.push({
      userId: randomUser.id,
      eventId: randomEvent.id,
      qrCode: `TCK-${uuidv4().slice(0, 8).toUpperCase()}`,
      status: 'ACTIVE' as const,
      purchaseDate: new Date(Date.now() - Math.floor(Math.random() * 1000000000)),
    });
  }

  console.log(`Pushing ${ticketsToCreate.length} tickets to database...`);
  
  // Use createMany for speed
  await prisma.ticket.createMany({
    data: ticketsToCreate,
    skipDuplicates: true,
  });

  console.log('✅ Ticket seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
