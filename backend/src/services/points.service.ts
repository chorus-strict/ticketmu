import { prisma } from '../lib/prisma';

export class PointsService {
  static async earnPoints(userId: string, points: number, referenceId: string, description: string) {
    try {
      if (points <= 0) return;

      await prisma.$transaction(async (tx) => {
        // Upsert user points
        await tx.userPoint.upsert({
          where: { userId },
          update: {
            balance: { increment: points }
          },
          create: {
            userId,
            balance: points
          }
        });

        // Log the transaction
        await tx.pointLog.create({
          data: {
            userId,
            type: 'EARN',
            points,
            referenceId,
            description
          }
        });
      });
    } catch (error) {
      console.error('[PointsService] Earn error:', error);
      // Failsafe: Do not block main process
    }
  }

  static async awardPointsForOrder(orderId: string) {
    try {
      const config = await this.getSystemConfig();
      if (!config.isRewardsActive) return;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { event: true }
      });

      if (!order || (order.status !== 'APPROVED' && order.status !== 'PAID') || order.pointsAwarded) {
        return;
      }

      await prisma.$transaction(async (tx) => {
        const currentOrder = await tx.order.findUnique({
          where: { id: orderId },
          select: { pointsAwarded: true }
        });

        if (currentOrder?.pointsAwarded) return;

        await tx.order.update({
          where: { id: orderId },
          data: { pointsAwarded: true }
        });

        const points = config.pointsPerOrder;

        await tx.userPoint.upsert({
          where: { userId: order.userId },
          update: { balance: { increment: points } },
          create: { userId: order.userId, balance: points }
        });

        await tx.pointLog.create({
          data: {
            userId: order.userId,
            type: 'EARN',
            points,
            referenceId: order.id,
            description: `Earned ${points} point(s) for "${order.event.title}"`
          }
        });
      });
    } catch (error) {
      console.error('[PointsService] awardPointsForOrder error:', error);
    }
  }

  static async awardPointsForMembershipOrder(orderId: string) {
    try {
      const config = await this.getSystemConfig();
      if (!config.isRewardsActive) return;

      const order = await prisma.membershipOrder.findUnique({
        where: { id: orderId }
      });

      if (!order || (order.status !== 'APPROVED' && order.status !== 'PAID') || order.pointsAwarded) {
        return;
      }

      await prisma.$transaction(async (tx) => {
        const currentOrder = await tx.membershipOrder.findUnique({
          where: { id: orderId },
          select: { pointsAwarded: true }
        });

        if (currentOrder?.pointsAwarded) return;

        await tx.membershipOrder.update({
          where: { id: orderId },
          data: { pointsAwarded: true }
        });

        const points = config.pointsPerOrder * 2; // Membership gets 2x points? Or just config.pointsPerOrder. Let's stick to config.

        await tx.userPoint.upsert({
          where: { userId: order.userId },
          update: { balance: { increment: points } },
          create: { userId: order.userId, balance: points }
        });

        await tx.pointLog.create({
          data: {
            userId: order.userId,
            type: 'EARN',
            points,
            referenceId: order.id,
            description: `Earned ${points} point(s) for "Premium Membership Upgrade"`
          }
        });
      });
    } catch (error) {
      console.error('[PointsService] awardPointsForMembershipOrder error:', error);
    }
  }

  static async adjustPoints(adminUserId: string, targetUserId: string, points: number, description: string) {
    try {
      await prisma.$transaction(async (tx) => {
        // Update balance
        await tx.userPoint.upsert({
          where: { userId: targetUserId },
          update: { balance: { increment: points } },
          create: { userId: targetUserId, balance: points }
        });

        // Log adjustment
        await tx.pointLog.create({
          data: {
            userId: targetUserId,
            type: 'ADJUST',
            points,
            description: `[Manual Adjustment] ${description}`
          }
        });
      });
    } catch (error) {
      console.error('[PointsService] adjustPoints error:', error);
      throw error;
    }
  }

  static async getSystemConfig() {
    let config = await prisma.systemConfig.findUnique({
      where: { id: 'global' }
    });

    if (!config) {
      config = await prisma.systemConfig.create({
        data: { id: 'global' }
      });
    }

    return config;
  }

  static async updateSystemConfig(data: Partial<Omit<import('@prisma/client').SystemConfig, 'id' | 'updatedAt'>>) {
    return await prisma.systemConfig.update({
      where: { id: 'global' },
      data
    });
  }

  static async backfillPoints() {
    try {
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: { in: ['PAID', 'APPROVED'] },
          pointsAwarded: false
        }
      });

      console.log(`[PointsService] Backfilling ${pendingOrders.length} orders...`);
      
      for (const order of pendingOrders) {
        await this.awardPointsForOrder(order.id);
      }
      
      return pendingOrders.length;
    } catch (error) {
      console.error('[PointsService] Backfill error:', error);
      return 0;
    }
  }

  static async redeemPoints(userId: string, rewardId: string) {
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId, isActive: true }
    });

    if (!reward) throw new Error('Reward not found or inactive');
    if (reward.stock <= 0) throw new Error('Reward out of stock');

    const userPoints = await prisma.userPoint.findUnique({
      where: { userId }
    });

    if (!userPoints || userPoints.balance < reward.pointsRequired) {
      throw new Error('Insufficient points balance');
    }

    return await prisma.$transaction(async (tx) => {
      // Deduct points
      await tx.userPoint.update({
        where: { userId },
        data: {
          balance: { decrement: reward.pointsRequired }
        }
      });

      // Update reward stock
      await tx.reward.update({
        where: { id: rewardId },
        data: {
          stock: { decrement: 1 }
        }
      });

      // Create UserReward (the actual "voucher" or digital benefit)
      const userReward = await tx.userReward.create({
        data: {
          userId,
          rewardId,
          value: reward.value || 0,
          isUsed: false
        }
      });

      // Log redemption
      await tx.pointLog.create({
        data: {
          userId,
          type: 'REDEEM',
          points: reward.pointsRequired,
          referenceId: rewardId,
          description: `Redeemed reward: ${reward.title}`
        }
      });

      return userReward;
    });
  }

  static async getUserAvailableRewards(userId: string) {
    return await prisma.userReward.findMany({
      where: {
        userId,
        isUsed: false
      },
      include: {
        reward: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async getUserPoints(userId: string) {
    const userPoint = await prisma.userPoint.findUnique({
      where: { userId }
    });
    return userPoint?.balance || 0;
  }

  static async getPointLogs(userId: string) {
    return await prisma.pointLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getRewards(includeInactive = false) {
    return await prisma.reward.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { pointsRequired: 'asc' }
    });
  }

  static async createReward(data: any) {
    return await prisma.reward.create({
      data: {
        title: data.title,
        pointsRequired: parseInt(data.pointsRequired),
        type: data.type,
        value: parseFloat(data.value) || null,
        stock: parseInt(data.stock),
        isActive: true
      }
    });
  }

  static async updateReward(id: string, data: any) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.pointsRequired !== undefined) updateData.pointsRequired = parseInt(data.pointsRequired);
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = parseFloat(data.value) || null;
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await prisma.reward.update({
      where: { id },
      data: updateData
    });
  }

  static async deleteReward(id: string) {
    return await prisma.reward.update({
      where: { id },
      data: { isActive: false }
    });
  }
}
