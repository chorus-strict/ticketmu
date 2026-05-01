import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { PaymentLogService } from './payment-log.service';
import { TripayService } from './tripay.service';
import { PointsService } from './points.service';

class OrderService {
  async create(userId: string, eventId: string, paymentMethodId?: string, userRewardId?: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    if (!user) throw new Error('User not found');

    // Handle empty string paymentMethodId
    const targetPaymentMethodId = paymentMethodId && paymentMethodId.trim() !== '' ? paymentMethodId : null;

    let discountAmount = 0;
    if (userRewardId) {
      const userReward = await prisma.userReward.findUnique({
        where: { id: userRewardId, userId, isUsed: false }
      });
      if (!userReward) throw new Error('Invalid or used reward voucher');
      discountAmount = userReward.value;
    }

    const finalTotal = Math.max(0, event.price - discountAmount);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          eventId,
          total: finalTotal,
          discountAmount,
          userRewardId,
          status: 'PENDING',
          paymentMethodId: targetPaymentMethodId,
        },
        include: { event: true, user: { select: { name: true, email: true } }, paymentMethod: true },
      });

      // Mark reward as used to prevent double usage in other pending orders
      if (userRewardId) {
        await tx.userReward.update({
          where: { id: userRewardId },
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

  async getAll(limit: number = 10, offset: number = 0) {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        include: { event: true, user: { select: { name: true, email: true } }, paymentMethod: true },
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
      include: { event: true, paymentMethod: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { event: true },
    });

    if (!order) throw new Error('Order not found');
    if (order.status !== 'PENDING') throw new Error(`Order is already ${order.status}`);

    const qrCode = `TCK-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          userId: order.userId,
          eventId: order.eventId,
          qrCode,
          status: 'ACTIVE',
        },
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          title: 'Payment Confirmed',
          message: `Payment confirmed! Your ticket for "${order.event.title}" is ready.`,
          link: '/tickets',
          roleTarget: 'USER',
          type: 'PAYMENT'
        },
      });

      await tx.payment.updateMany({
        where: { referenceId: orderId, type: 'TICKET' },
        data: { status: 'SUCCESS' }
      });

      return await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          ticketId: ticket.id,
        },
        include: { ticket: true },
      });
    });

    await PaymentLogService.logOrder(orderId, 'APPROVED', 'Order approved by administrator');

    // Award Points safely using the new method
    await PointsService.awardPointsForOrder(orderId);

    return result;
  }

  async reject(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { event: true },
    });
    
    if (!order) throw new Error('Order not found');

    const result = await prisma.$transaction(async (tx) => {
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: 'Payment Rejected',
          message: `Your payment for "${order.event.title}" was rejected. Please contact support.`,
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
