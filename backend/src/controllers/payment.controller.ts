import { Response } from 'express';
import { orderService } from '../services/order.service';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { PaymentLogService } from '../services/payment-log.service';

export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, status } = req.query;

    const where: any = { userId: req.user!.id };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enhance payments with details
    const enhancedPayments = await Promise.all(payments.map(async (payment) => {
      if (payment.type === 'TICKET' && payment.referenceId) {
        const order = await prisma.order.findUnique({
          where: { id: payment.referenceId },
          include: { 
            event: { select: { title: true } },
            paymentMethod: true 
          }
        });
        return { 
          ...payment, 
          eventTitle: order?.event?.title,
          paymentMethod: order?.paymentMethod
        };
      }
      if (payment.type === 'MEMBERSHIP' && payment.referenceId) {
        const mOrder = await prisma.membershipOrder.findUnique({
          where: { id: payment.referenceId },
          include: { paymentMethod: true }
        });
        return {
          ...payment,
          paymentMethod: mOrder?.paymentMethod
        };
      }
      if (payment.type === 'ORGANIZER_APPLICATION' && payment.referenceId) {
        const order = await prisma.order.findUnique({
          where: { id: payment.referenceId },
          include: { paymentMethod: true }
        });
        return {
          ...payment,
          eventTitle: 'Organizer Activation',
          paymentMethod: order?.paymentMethod
        };
      }
      return payment;
    }));

    res.json(enhancedPayments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, proofUrl } = req.body;
    
    // Verify order belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { paymentMethod: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId !== req.user!.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ message: `Order is already ${order.status}` });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        proofUrl: proofUrl || 'manual_confirmation',
        status: 'PENDING' // Keep as pending but enriched
      }
    });

    // Log the action
    await PaymentLogService.logOrder(
      orderId, 
      'PROOF_SUBMITTED', 
      `User ${req.user!.id} submitted payment confirmation using ${order.paymentMethod?.name || 'Manual Transfer'}`,
      { proofUrl }
    );

    // Notify Admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    const user = await prisma.user.findUnique({ where: { id: order.userId } });
    const event = order.eventId ? await prisma.event.findUnique({ where: { id: order.eventId } }) : null;

    if (admins.length > 0 && user) {
      const subject = event ? `for ${event.title}` : 'for Organizer Activation';
      await Promise.all(admins.map(admin => 
        prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'Payment Confirmation Received',
            message: `${user.name} confirmed payment ${subject} (${order.paymentMethod?.name || 'Manual Bank'})`,
            link: order.type === 'ORGANIZER_ACTIVATION' ? '/dashboard?tab=ORGANIZERS' : '/dashboard?tab=PAYMENTS',
            roleTarget: 'ADMIN',
            type: 'ORDER'
          }
        }).catch(err => console.error('Failed to notify admin:', err))
      ));
    }

    res.json({
      message: 'Confirmation received. Our team will verify your transaction shortly.',
      order: updatedOrder
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
