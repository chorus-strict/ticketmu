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
            description: `Earned ${points} point(s) for "${order.event?.title || 'Organizer Activation'}"`
          }
        });

        await tx.notification.create({
          data: {
            userId: order.userId,
            title: 'Points Earned!',
            message: `You earned ${points} ticket purchase points for "${order.event?.title || 'Event'}".`,
            link: '/rewards',
            roleTarget: 'USER',
            type: 'SYSTEM'
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

        await tx.notification.create({
          data: {
            userId: order.userId,
            title: 'Points Earned!',
            message: `You earned ${points} membership points for "Premium Membership Upgrade".`,
            link: '/rewards',
            roleTarget: 'USER',
            type: 'SYSTEM'
          }
        });
      });
    } catch (error) {
      console.error('[PointsService] awardPointsForMembershipOrder error:', error);
    }
  }

  static async adjustPoints(adminUserId: string, targetUserId: string, points: number, description: string) {
    if (isNaN(points)) {
      throw new Error('Points must be a valid number');
    }
    try {
      await prisma.$transaction(async (tx) => {
        // Fetch current points balance safely
        const pointRecord = await tx.userPoint.findUnique({
          where: { userId: targetUserId }
        });
        const currentBalance = pointRecord?.balance || 0;
        const newBalance = currentBalance + points;
        
        if (newBalance < 0) {
          throw new Error(`Deduction failed. User only has ${currentBalance} points, cannot deduct ${Math.abs(points)} points.`);
        }

        // Fetch admin info for audit history description
        const admin = await tx.user.findUnique({
          where: { id: adminUserId },
          select: { name: true, email: true }
        });
        const adminName = admin ? `${admin.name} (${admin.email})` : 'Administrator';

        // Update balance
        await tx.userPoint.upsert({
          where: { userId: targetUserId },
          update: { balance: newBalance },
          create: { userId: targetUserId, balance: newBalance }
        });

        // Log adjustment
        await tx.pointLog.create({
          data: {
            userId: targetUserId,
            type: 'ADJUST',
            points,
            description: `[Manual Adjustment by ${adminName}] ${description}`
          }
        });

        await tx.notification.create({
          data: {
            userId: targetUserId,
            title: points > 0 ? 'Points Credited' : 'Points Deducted',
            message: points > 0 
              ? `An administrator credited your account with ${points} points: "${description}".`
              : `An administrator deducted ${Math.abs(points)} points from your account: "${description}".`,
            link: '/rewards',
            roleTarget: 'USER',
            type: 'SYSTEM'
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

      await tx.notification.create({
        data: {
          userId,
          title: 'Reward Redeemed Successfully',
          message: `Successfully redeemed "${reward.title}" for ${reward.pointsRequired} points. Your voucher is ready!`,
          link: '/rewards',
          roleTarget: 'USER',
          type: 'SYSTEM'
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
    const pointsRequired = parseInt(data.pointsRequired);
    const stock = parseInt(data.stock);
    const parsedValue = parseFloat(data.value);

    return await prisma.reward.create({
      data: {
        title: data.title,
        pointsRequired: isNaN(pointsRequired) ? 0 : pointsRequired,
        type: data.type,
        value: isNaN(parsedValue) ? null : parsedValue,
        stock: isNaN(stock) ? 0 : stock,
        isActive: true
      }
    });
  }

  static async updateReward(id: string, data: any) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    
    if (data.pointsRequired !== undefined) {
      const parsed = parseInt(data.pointsRequired);
      updateData.pointsRequired = isNaN(parsed) ? 0 : parsed;
    }
    
    if (data.type !== undefined) updateData.type = data.type;
    
    if (data.value !== undefined) {
      const parsed = parseFloat(data.value);
      updateData.value = isNaN(parsed) ? null : parsed;
    }
    
    if (data.stock !== undefined) {
      const parsed = parseInt(data.stock);
      updateData.stock = isNaN(parsed) ? 0 : parsed;
    }
    
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
