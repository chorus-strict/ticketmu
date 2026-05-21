import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { PaymentLogService } from './payment-log.service';
import { TripayService } from './tripay.service';
import { PointsService } from './points.service';

class OrderService {
  async checkTicketLimit(
    userId: string,
    eventId: string,
    additionalQty: number,
    options?: {
      excludeCartItemIds?: string[];
      excludeCartItemsForThisEvent?: boolean;
      excludeOrderIds?: string[];
      tx?: any;
    }
  ) {
    const prismaClient = options?.tx || prisma;

    const event = await prismaClient.event.findUnique({
      where: { id: eventId },
      select: { maxTicketsPerUser: true, title: true }
    });
    if (!event) throw new Error('Event not found');

    const limit = event.maxTicketsPerUser ?? 5;

    let cartCount = 0;
    if (!options?.excludeCartItemsForThisEvent) {
      const cartAgg = await prismaClient.cartItem.aggregate({
        where: {
          userId,
          eventId,
          ...(options?.excludeCartItemIds ? { NOT: { id: { in: options.excludeCartItemIds } } } : {})
        },
        _sum: {
          quantity: true
        }
      });
      cartCount = cartAgg._sum.quantity || 0;
    }

    const orderCount = await prismaClient.order.count({
      where: {
        userId,
        eventId,
        type: 'TICKET',
        status: {
          in: ['PENDING', 'PAID', 'APPROVED']
        },
        ...(options?.excludeOrderIds ? { NOT: { id: { in: options.excludeOrderIds } } } : {})
      }
    });

    const total = cartCount + orderCount + additionalQty;
    if (total > limit) {
      throw new Error(`Anda telah mencapai batas maksimum pembelian ticket untuk event ini (${limit} ticket per user).`);
    }
    return { limit, currentCount: cartCount + orderCount, total };
  }

  async create(userId: string, eventId: string, ticketTierId?: string, paymentMethodId?: string, userRewardId?: string, bypassLimitCheck = false) {
    const event = await prisma.event.findUnique({ 
      where: { id: eventId },
      include: { ticketTiers: true }
    });
    if (!event) throw new Error('Event not found');
    if (event.isArchived) throw new Error('Event is no longer available for booking');

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, role: true, membership: true } });
    if (!user) throw new Error('User not found');

    // Elite Member / Premium Check
    const isPrivileged = user.membership === 'PREMIUM' || user.role === 'ORGANIZER' || user.role === 'ADMIN';
    if (event.visibility === 'PREMIUM' && !isPrivileged) {
      throw new Error('This event is restricted to Elite Members only. Upgrade your membership to proceed.');
    }

    // Handle empty strings for ID fields
    const targetPaymentMethodId = paymentMethodId && paymentMethodId.trim() !== '' ? paymentMethodId : null;
    const targetTicketTierId = ticketTierId && ticketTierId.trim() !== '' ? ticketTierId : null;
    const targetUserRewardId = userRewardId && userRewardId.trim() !== '' ? userRewardId : null;

    let ticketPrice = event.price;
    if (targetTicketTierId) {
      const tier = event.ticketTiers.find(t => t.id === targetTicketTierId);
      if (!tier) throw new Error('Invalid ticket tier selected');
      if (tier.sold >= tier.quantity) throw new Error('This ticket tier is sold out');
      ticketPrice = tier.price;
    }

    let discountAmount = 0;
    if (targetUserRewardId) {
      const userReward = await prisma.userReward.findUnique({
        where: { id: targetUserRewardId, userId, isUsed: false }
      });
      if (!userReward) throw new Error('Invalid or used reward voucher');
      discountAmount = userReward.value;
    }

    const finalTotal = Math.max(0, ticketPrice - discountAmount);

    const order = await prisma.$transaction(async (tx) => {
      if (!bypassLimitCheck) {
        await this.checkTicketLimit(userId, eventId, 1, { tx });
      }

      const newOrder = await tx.order.create({
        data: {
          userId,
          eventId,
          ticketTierId: targetTicketTierId,
          total: finalTotal,
          discountAmount,
          userRewardId: targetUserRewardId,
          status: 'PENDING',
          paymentMethodId: targetPaymentMethodId,
        },
        include: { event: true, user: true, paymentMethod: true },
      });

      // Mark reward as used to prevent double usage in other pending orders
      if (targetUserRewardId) {
        await tx.userReward.update({
          where: { id: targetUserRewardId },
          data: { isUsed: true }
        });
      }

      // Create Payment Record
      await tx.payment.create({
        data: {
          userId,
          type: 'TICKET',
          amount: finalTotal,
          status: 'PENDING',
          referenceId: newOrder.id
        }
      });

      // Create Ticket Checkout Notification
      await tx.notification.create({
        data: {
          userId,
          title: 'Ticket Checkout Successful',
          message: `Your checkout for "${event.title}" has been completed successfully. Please settle the payment.`,
          link: '/payment-history',
          roleTarget: 'USER',
          type: 'ORDER'
        }
      });

      return newOrder;
    });

    // Log Creation
    await PaymentLogService.logOrder(
      order.id, 
      'CREATED', 
      `Order for "${event.title}" created via ${order.paymentMethod?.name || 'Manual Transfer'}. Discount: Rp ${discountAmount}`
    );

    // Tripay Integration
    if (order.paymentMethod?.type === 'gateway' && (order.paymentMethod.config as any)?.gatewayProvider === 'tripay') {
      const config = order.paymentMethod.config as any;
      const tripayRes = await TripayService.createTransaction({
        method: config.tripayCode || 'MY_CODE', // Tripay payment code like 'BRIVA', 'QRIS', etc.
        merchant_ref: order.id,
        amount: order.total,
        customer_name: user.name,
        customer_email: user.email,
        order_items: [{
          sku: event.id,
          name: event.title,
          price: order.total,
          quantity: 1
        }],
        config: {
          api_key: config.apiKey,
          private_key: config.privateKey,
          merchant_code: config.merchantCode,
          environment: config.environment || 'sandbox'
        }
      });

      if (tripayRes.success) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            gatewayRef: tripayRes.data.reference,
            proofUrl: tripayRes.data.checkout_url // Use proofUrl to store redirection link for frontend
          }
        });
        
        await PaymentLogService.logOrder(
          order.id,
          'GATEWAY_INITIATED',
          `Tripay transaction created: ${tripayRes.data.reference}`,
          tripayRes.data
        );

        return { ...order, checkoutUrl: tripayRes.data.checkout_url };
      } else {
        await PaymentLogService.logOrder(
          order.id,
          'GATEWAY_ERROR',
          `Failed to initiate Tripay: ${tripayRes.message}`,
          tripayRes
        );
      }
    }

    // Dynamic QRIS Integration
    if (order.paymentMethod?.type === 'qris' && order.paymentMethod.mode === 'dynamic' && order.paymentMethod.provider === 'tripay') {
      const config = order.paymentMethod.config as any;
      const tripayRes = await TripayService.createTransaction({
        method: 'QRIS', // Force QRIS for this mode
        merchant_ref: order.id,
        amount: order.total,
        customer_name: user.name,
        customer_email: user.email,
        order_items: [{
          sku: event.id,
          name: event.title,
          price: order.total,
          quantity: 1
        }],
        config: {
          api_key: config.apiKey,
          private_key: config.privateKey,
          merchant_code: config.merchantCode,
          environment: config.environment || 'sandbox'
        }
      });

      if (tripayRes.success) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            gatewayRef: tripayRes.data.reference,
            proofUrl: tripayRes.data.qr_url || tripayRes.data.checkout_url
          }
        });

        await PaymentLogService.logOrder(
          order.id,
          'QRIS_DYNAMIC_INITIATED',
          `Dynamic QRIS created via Tripay: ${tripayRes.data.reference}`,
          tripayRes.data
        );

        return { 
          ...order, 
          checkoutUrl: tripayRes.data.checkout_url,
          qrUrl: tripayRes.data.qr_url 
        };
      } else {
        await PaymentLogService.logOrder(
          order.id,
          'QRIS_DYNAMIC_ERROR',
          `Failed to generate dynamic QRIS: ${tripayRes.message}`,
          tripayRes
        );
      }
    }

    return order;
  }

  async createOrganizerActivation(userId: string, requestId: string, paymentMethodId?: string, tx?: any) {
    const prismaClient = tx || prisma;
    const request = await prismaClient.organizerRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('Organizer request not found');
    
    const amount = 300000;
    const targetPaymentMethodId = paymentMethodId && paymentMethodId.trim() !== '' ? paymentMethodId : null;

    const user = await prismaClient.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    if (!user) throw new Error('User not found');

    const executeWork = async (client: any) => {
      const newOrder = await client.order.create({
        data: {
          userId,
          type: 'ORGANIZER_ACTIVATION',
          total: amount,
          status: 'PENDING',
          paymentMethodId: targetPaymentMethodId,
          organizerRequestId: requestId
        },
        include: { paymentMethod: true }
      });

      // Legacy Payment Record
      await client.payment.create({
        data: {
          userId,
          type: 'ORGANIZER_APPLICATION',
          amount,
          status: 'PENDING',
          referenceId: newOrder.id
        }
      });

      return newOrder;
    };

    const order = tx ? await executeWork(tx) : await prisma.$transaction(async (subTx) => executeWork(subTx));

    await PaymentLogService.logOrder(
      order.id, 
      'CREATED', 
      `Organizer activation order created via ${order.paymentMethod?.name || 'Manual Transfer'}`
    );

    // Tripay Integration for Organizer Activation
    if (order.paymentMethod?.type === 'gateway' && (order.paymentMethod.config as any)?.gatewayProvider === 'tripay') {
      const config = order.paymentMethod.config as any;
      const tripayRes = await TripayService.createTransaction({
        method: config.tripayCode || 'MY_CODE',
        merchant_ref: order.id,
        amount: order.total,
        customer_name: user.name,
        customer_email: user.email,
        order_items: [{
          sku: 'ORG_ACT',
          name: 'Organizer Activation',
          price: order.total,
          quantity: 1
        }],
        config: {
          api_key: config.apiKey,
          private_key: config.privateKey,
          merchant_code: config.merchantCode,
          environment: config.environment || 'sandbox'
        }
      });

      if (tripayRes.success) {
        await prismaClient.order.update({
          where: { id: order.id },
          data: {
            gatewayRef: tripayRes.data.reference,
            proofUrl: tripayRes.data.checkout_url
          }
        });
        return { ...order, checkoutUrl: tripayRes.data.checkout_url };
      }
    }

    return order;
  }

  async getAll(limit: number = 10, offset: number = 0) {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        include: { 
          event: true, 
          ticketTier: true,
          user: true, 
          paymentMethod: true,
          organizerRequest: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.order.count(),
    ]);

    return { orders, total };
  }

  async getByUser(userId: string) {
    return await prisma.order.findMany({
      where: { userId },
      include: { 
        event: true, 
        ticketTier: true, 
        paymentMethod: true, 
        user: true,
        organizerRequest: true
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByOrganizer(organizerId: string) {
    return await prisma.order.findMany({
      where: { 
        OR: [
          { event: { organizerId } },
          { userId: organizerId, type: 'ORGANIZER_ACTIVATION' }
        ]
      },
      include: { 
        event: true, 
        ticketTier: true, 
        paymentMethod: true, 
        user: true,
        organizerRequest: true
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(orderId: string, requesterId?: string, requesterRole?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { event: true, ticketTier: true, organizerRequest: true },
    });

    if (!order) throw new Error('Order not found');

    if (order.type === 'ORGANIZER_ACTIVATION') {
      if (requesterId && requesterRole !== 'ADMIN') throw new Error('Unauthorized');
      if (order.status !== 'PENDING') throw new Error(`Order is already ${order.status}`);

      const result = await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: { status: 'PAID' }
        });

        if (order.organizerRequestId) {
          await tx.organizerRequest.update({
            where: { id: order.organizerRequestId },
            data: { status: 'WAITING_APPROVAL', paidAt: new Date() }
          });

          await tx.payment.updateMany({
            where: { referenceId: orderId, type: 'ORGANIZER_APPLICATION' },
            data: { status: 'SUCCESS' }
          });

          await tx.notification.create({
            data: {
              userId: order.userId,
              title: 'Activation Payment Received',
              message: 'Your organizer activation payment has been confirmed.',
              link: '/settings',
              roleTarget: 'USER',
              type: 'PAYMENT'
            }
          });
        }
        return updatedOrder;
      });
      await PaymentLogService.logOrder(orderId, 'APPROVED', 'Organizer activation approved');
      return result;
    }

    // Authorization check
    if (requesterId && requesterRole !== 'ADMIN') {
      if (order.event?.organizerId !== requesterId) {
        throw new Error('Unauthorized: You can only approve orders for your own events');
      }
    }

    if (order.status !== 'PENDING') throw new Error(`Order is already ${order.status}`);

    const qrCode = `TCK-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // If there's a ticket tier, increment its sold count
      if (order.ticketTierId) {
        await tx.ticketTier.update({
          where: { id: order.ticketTierId },
          data: { sold: { increment: 1 } }
        });
      }

      const ticket = await tx.ticket.create({
        data: {
          userId: order.userId,
          eventId: order.eventId,
          ticketTierId: order.ticketTierId,
          qrCode,
          ticketStatus: 'ACTIVE',
          eventStartDate: order.event.date,
          eventEndDate: new Date(order.event.date.getTime() + 3 * 60 * 60 * 1000), // Default 3 hours
        },
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          title: 'Payment Confirmed',
          message: `Payment confirmed! Your ticket for "${order.event?.title || 'Event'}" is ready.`,
          link: '/tickets',
          roleTarget: 'USER',
          type: 'PAYMENT'
        },
      });

      await tx.payment.updateMany({
        where: { referenceId: orderId, type: 'TICKET' },
        data: { status: 'SUCCESS' }
      });

      // Calculate Revenue Split (Tiketmu 10%, Organizer 90%)
      const platformFee = order.total * 0.10;
      const organizerShare = order.total * 0.90;

      // Update Organizer Balance if organizer exists
      const eventOrganizer = await tx.user.findUnique({
        where: { id: order.event.organizerId },
        include: { organizerProfile: true }
      });

      if (eventOrganizer?.role === 'ORGANIZER' && eventOrganizer.organizerProfile) {
        await tx.organizerProfile.update({
          where: { id: eventOrganizer.organizerProfile.id },
          data: {
            totalRevenue: { increment: order.total },
            balance: { increment: organizerShare }
          }
        });
      }

      return await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          ticketId: ticket.id,
          platformFee,
          organizerShare,
          revenueStatus: 'SETTLED'
        },
        include: { ticket: true },
      });
    });

    await PaymentLogService.logOrder(orderId, 'APPROVED', 'Order approved by administrator');

    // Award Points safely using the new method
    await PointsService.awardPointsForOrder(orderId);

    return result;
  }

  async reject(orderId: string, requesterId?: string, requesterRole?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { event: true, organizerRequest: true },
    });
    
    if (!order) throw new Error('Order not found');

    if (order.type === 'ORGANIZER_ACTIVATION') {
      if (requesterId && requesterRole !== 'ADMIN') throw new Error('Unauthorized');
      
      const result = await prisma.$transaction(async (tx) => {
        if (order.organizerRequestId) {
          await tx.organizerRequest.update({
            where: { id: order.organizerRequestId },
            data: { status: 'REJECTED' }
          });
          
          await tx.payment.updateMany({
            where: { referenceId: orderId, type: 'ORGANIZER_APPLICATION' },
            data: { status: 'FAILED' }
          });

          await tx.notification.create({
            data: {
              userId: order.userId,
              title: 'Activation Payment Rejected',
              message: 'Your organizer activation payment was rejected.',
              link: '/settings',
              roleTarget: 'USER',
              type: 'PAYMENT'
            }
          });
        }

        return await tx.order.update({
          where: { id: orderId },
          data: { status: 'FAILED' }
        });
      });
      await PaymentLogService.logOrder(orderId, 'REJECTED', 'Organizer activation rejected');
      return result;
    }

    // Authorization check
    if (requesterId && requesterRole !== 'ADMIN') {
      if (order.event?.organizerId !== requesterId) {
        throw new Error('Unauthorized: You can only reject orders for your own events');
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: 'Payment Rejected',
          message: `Your payment for "${order.event?.title || 'Event'}" was rejected. Please contact support.`,
          link: '/payment-history',
          roleTarget: 'USER',
          type: 'PAYMENT'
        },
      });

      await tx.payment.updateMany({
        where: { referenceId: orderId, type: 'TICKET' },
        data: { status: 'FAILED' }
      });

      // Refund UserReward if present
      if (order.userRewardId) {
        await tx.userReward.update({
          where: { id: order.userRewardId },
          data: { isUsed: false }
        });
      }

      return await tx.order.update({
        where: { id: orderId },
        data: { status: 'FAILED' },
      });
    });

    await PaymentLogService.logOrder(orderId, 'REJECTED', 'Order rejected by administrator');
    return result;
  }
}

export const orderService = new OrderService();
