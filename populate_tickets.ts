import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Populating ticket event dates...');
  const tickets = await prisma.ticket.findMany({
    include: { event: true }
  });

  for (const ticket of tickets) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        eventStartDate: ticket.event.date,
        // Since original Event only has 'date', let's assume it ends 3 hours later for now
        eventEndDate: new Date(ticket.event.date.getTime() + 3 * 60 * 60 * 1000),
        ticketStatus: 'ACTIVE', // Restore status since it might have been lost in db push
      }
    });
  }
  console.log('Done.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
