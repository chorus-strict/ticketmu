import cron from 'node-cron';
import { prisma } from '../lib/prisma';

export function setupTicketCron() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Checking for expired tickets...');
    const now = new Date();

    try {
      const ticketsToExpire = await prisma.ticket.findMany({
        where: {
          ticketStatus: 'ACTIVE',
          eventEndDate: {
            lt: now,
          },
        },
        include: { event: true }
      });

      if (ticketsToExpire.length === 0) {
        console.log('[Cron] No tickets to expire.');
        return;
      }

      console.log(`[Cron] Found ${ticketsToExpire.length} tickets to expire.`);

      const result = await prisma.ticket.updateMany({
        where: {
          id: {
            in: ticketsToExpire.map(t => t.id)
          }
        },
        data: {
          ticketStatus: 'EXPIRED',
          expiredAt: now,
        },
      });

      console.log(`[Cron] Successfully expired ${result.count} tickets.`);

      // Send notifications for expired tickets
      for (const ticket of ticketsToExpire) {
        await prisma.notification.create({
          data: {
            userId: ticket.userId,
            title: 'Ticket Expired',
            message: `Your ticket for "${ticket.event?.title || 'Event'}" has expired.`,
            link: '/tickets',
            type: 'SYSTEM'
          },
        }).catch(() => {});
      }
    } catch (error) {
      console.error('[Cron] Error during ticket expiration check:', error);
    }
  });

  console.log('[Cron] Ticket lifecycle scheduler initiated (Hourly).');
}
