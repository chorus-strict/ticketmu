import { prisma } from './prisma';

export const backfillPayments = async () => {
  console.log('[Backfill] Starting payment backfill...');
  try {
    // 0. Ensure column exists and sync membershipStatus
    // Running raw query to handle potential schema sync delays
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "membershipStatus" "Membership" DEFAULT \'FREE\'');
      await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "membershipExpiredAt" TIMESTAMP');
      await prisma.$executeRawUnsafe('ALTER TABLE "MembershipOrder" ADD COLUMN IF NOT EXISTS "expiredAt" TIMESTAMP');
      
      await prisma.$executeRawUnsafe(`
        UPDATE "User" SET "membershipStatus" = "membership" WHERE "membershipStatus" IS NULL;
      `);
    } catch (e) {
      console.warn('[Backfill] Raw sync warning:', e);
    }

    const users = await prisma.user.findMany();

    // 1. Backfill Ticket Orders
    const orders = await prisma.order.findMany({
      where: {
        NOT: {
          id: {
            in: (await prisma.payment.findMany({
              where: { type: 'TICKET' },
              select: { referenceId: true }
            })).map((p: any) => p.referenceId).filter(Boolean) as string[]
          }
        }
      }
    });

    console.log(`[Backfill] Found ${orders.length} orders without payment records`);

    for (const order of orders) {
      let status: any = 'PENDING';
      if (order.status === 'PAID' || order.status === 'APPROVED') status = 'SUCCESS';
      if (order.status === 'FAILED' || order.status === 'REJECTED') status = 'FAILED';

      await prisma.payment.create({
        data: {
          userId: order.userId,
          type: 'TICKET',
          amount: order.total,
          status,
          referenceId: order.id,
          createdAt: order.createdAt
        }
      });
    }

    // 2. Backfill Membership Orders
    const mOrders = await prisma.membershipOrder.findMany({
      where: {
        NOT: {
          id: {
            in: (await prisma.payment.findMany({
              where: { type: 'MEMBERSHIP' },
              select: { referenceId: true }
            })).map((p: any) => p.referenceId).filter(Boolean) as string[]
          }
        }
      }
    });

    console.log(`[Backfill] Found ${mOrders.length} membership orders without payment records`);

    for (const order of mOrders) {
      let status: any = 'PENDING';
      if (order.status === 'PAID' || order.status === 'APPROVED') status = 'SUCCESS';
      if (order.status === 'FAILED' || order.status === 'REJECTED') status = 'FAILED';

      await prisma.payment.create({
        data: {
          userId: order.userId,
          type: 'MEMBERSHIP',
          amount: order.amount,
          status,
          referenceId: order.id,
          createdAt: order.createdAt
        }
      });
    }

    console.log('[Backfill] Payment backfill completed');
  } catch (error) {
    console.error('[Backfill] Payment backfill failed:', error);
  }
};
