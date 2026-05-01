import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { PaymentLogService } from '../services/payment-log.service';
import { TripayService } from '../services/tripay.service';
import { PointsService } from '../services/points.service';

export const requestUpgrade = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { paymentMethodId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Handle empty string paymentMethodId
    const targetPaymentMethodId = paymentMethodId && paymentMethodId.trim() !== '' ? paymentMethodId : null;
    
    // Check if there is already a pending request
    const existingOrder = await prisma.membershipOrder.findFirst({
      where: { userId, status: 'PENDING' },
      include: { paymentMethod: true }
    });

    if (existingOrder) {
      if (existingOrder.proofUrl) {
         return res.status(200).json({ ...existingOrder, checkoutUrl: existingOrder.proofUrl });
      }
      return res.status(200).json(existingOrder);
    }

    const orderSize = await prisma.membershipOrder.count();
    const merchantRef = `MBR-${userId.slice(0, 4)}-${orderSize + 1}`;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.membershipOrder.create({
        data: {
          userId,
          amount: 50000,
          status: 'PENDING',
          paymentMethodId: targetPaymentMethodId
        },
        include: { paymentMethod: true }
      });

      // Create Payment Record
      await tx.payment.create({
        data: {
          userId,
          type: 'MEMBERSHIP',
          amount: 50000,
          status: 'PENDING',
          referenceId: newOrder.id
        }
      });

      // Update User Membership Status back to PENDING for existing logic
      await tx.user.update({
        where: { id: userId },
        data: { membershipStatus: 'PENDING' }
      });
      
      return newOrder;
    });

    // Log Creation
    await PaymentLogService.logMembershipOrder(
      order.id,
      'CREATED',
      `Upgrade request created using ${order.paymentMethod?.name || 'Manual'}`
    );

    // Tripay Integration
    if (order.paymentMethod?.type === 'gateway' && (order.paymentMethod.config as any)?.gatewayProvider === 'tripay') {
      const config = order.paymentMethod.config as any;
      const tripayRes = await TripayService.createTransaction({
        method: config.tripayCode || 'MY_CODE',
        merchant_ref: order.id, // Using order.id as merchant_ref for simplicity, or we could use merchantRef
        amount: order.amount,
        customer_name: user.name,
        customer_email: user.email,
        order_items: [{
          sku: 'MEMBERSHIP_UPGRADE',
          name: 'Premium Membership Upgrade',
          price: order.amount,
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
        await prisma.membershipOrder.update({
          where: { id: order.id },
          data: {
            gatewayRef: tripayRes.data.reference,
            proofUrl: tripayRes.data.checkout_url
          }
        });

        await PaymentLogService.logMembershipOrder(
          order.id,
          'GATEWAY_INITIATED',
          `Tripay transaction created: ${tripayRes.data.reference}`,
          tripayRes.data
        );

        return res.status(201).json({ ...order, checkoutUrl: tripayRes.data.checkout_url });
      } else {
        await PaymentLogService.logMembershipOrder(
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
        method: 'QRIS',
        merchant_ref: order.id,
        amount: order.amount,
        customer_name: user.name,
        customer_email: user.email,
        order_items: [{
          sku: 'MEMBERSHIP_UPGRADE',
          name: 'Premium Membership Upgrade',
          price: order.amount,
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
        await prisma.membershipOrder.update({
          where: { id: order.id },
          data: {
            gatewayRef: tripayRes.data.reference,
            proofUrl: tripayRes.data.qr_url || tripayRes.data.checkout_url
          }
        });

        await PaymentLogService.logMembershipOrder(
          order.id,
          'QRIS_DYNAMIC_INITIATED',
          `Dynamic QRIS created via Tripay: ${tripayRes.data.reference}`,
          tripayRes.data
        );

        return res.status(201).json({ 
          ...order, 
          checkoutUrl: tripayRes.data.checkout_url,
          qrUrl: tripayRes.data.qr_url 
        });
      } else {
        await PaymentLogService.logMembershipOrder(
          order.id,
          'QRIS_DYNAMIC_ERROR',
          `Failed to generate dynamic QRIS: ${tripayRes.message}`,
          tripayRes
        );
      }
    }

    // Notify Admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'New Membership Upgrade',
          message: `${user.name} requested premium upgrade - Rp 50.000`,
          link: '/dashboard?tab=MEMBERSHIP',
          roleTarget: 'ADMIN',
          type: 'SYSTEM'
        }
      }).catch(err => console.error('Admin notify failed:', err));
    }

    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const confirmMembershipPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, proofUrl } = req.body;
    const order = await prisma.membershipOrder.findUnique({
      where: { id: orderId },
      include: { paymentMethod: true }
    });

    if (!order || order.userId !== req.user!.id) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await prisma.membershipOrder.update({
      where: { id: orderId },
      data: { proofUrl, status: 'PENDING' } // Re-ensure status
    });

    await PaymentLogService.logMembershipOrder(
      orderId,
      'PROOF_SUBMITTED',
      `User submitted confirmation for membership upgrade`,
      { proofUrl }
    );

    res.json({ message: 'Confirmation received. Verification in progress.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMembershipOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.membershipOrder.findMany({
      include: { user: true, paymentMethod: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserMembershipOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.membershipOrder.findFirst({
      where: { userId: req.user!.id, status: 'PENDING' },
      include: { paymentMethod: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const approveMembership = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.membershipOrder.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!order) {
      console.error(`[MembershipApproval] Order ${id} not found`);
      return res.status(404).json({ message: `Order ${id} not found` });
    }
    
    if (order.status !== 'PENDING') {
      return res.status(400).json({ message: `Order already processed with status: ${order.status}` });
    }

    if (!order.userId) {
      console.error(`[MembershipApproval] Order ${id} has no associated userId`);
      return res.status(400).json({ message: 'Order has no associated user' });
    }

    const expiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // 1. Update Order Status
      await tx.membershipOrder.update({
        where: { id },
        data: { 
          status: 'APPROVED',
          expiredAt
        }
      });

      // 2. Sync Payment Status
      await tx.payment.updateMany({
        where: { referenceId: id, type: 'MEMBERSHIP' },
        data: { status: 'SUCCESS' }
      });

      // 3. Upgrade User
      await tx.user.update({
        where: { id: order.userId },
        data: { 
          membership: 'PREMIUM', 
          membershipStatus: 'PREMIUM',
          membershipExpiredAt: expiredAt
        }
      });

      // 4. Send Notification
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: 'Membership Activated',
          message: 'Your account is now PREMIUM. Enjoy your exclusive benefits!',
          link: '/membership',
          roleTarget: 'USER',
          type: 'SYSTEM'
        }
      });
    });

    await PaymentLogService.logMembershipOrder(id, 'APPROVED', 'Membership approved by administrator');
    
    // Award points safely
    await PointsService.awardPointsForMembershipOrder(id);

    console.info(`[MembershipApproval] Successfully approved membership for user ${order.userId}`);
    res.json({ message: 'Membership approved successfully' });
  } catch (error: any) {
    console.error('[MembershipApproval] Transaction Error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to approve membership due to an internal error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const rejectMembership = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.membershipOrder.findUnique({ where: { id } });

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'PENDING') return res.status(400).json({ message: 'Order already processed' });

    await prisma.$transaction([
      prisma.membershipOrder.update({
        where: { id },
        data: { status: 'REJECTED' }
      }),
      prisma.payment.updateMany({
        where: { referenceId: id, type: 'MEMBERSHIP' },
        data: { status: 'FAILED' }
      }),
      prisma.user.update({
        where: { id: order.userId },
        data: { 
          membership: 'FREE',
          membershipStatus: 'FREE'
        }
      }),
      prisma.notification.create({
        data: {
          userId: order.userId,
          title: 'Membership Request Rejected',
          message: 'Your membership upgrade request was rejected. Please contact support.',
          link: '/membership',
          roleTarget: 'USER',
          type: 'SYSTEM'
        }
      })
    ]);

    await PaymentLogService.logMembershipOrder(id, 'REJECTED', 'Membership rejected by administrator');
    res.json({ message: 'Membership rejected' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMembershipStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.membershipOrder.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const expiredAt = (status === 'PAID' || status === 'APPROVED') 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      : undefined;

    const updatedOrder = await prisma.membershipOrder.update({
      where: { id },
      data: { 
        status,
        ...(expiredAt && { expiredAt })
      }
    });

    // Sync Payment status
    let paymentStatus: any = 'PENDING';
    if (status === 'PAID' || status === 'APPROVED') paymentStatus = 'SUCCESS';
    if (status === 'FAILED' || status === 'REJECTED') paymentStatus = 'FAILED';

    await prisma.payment.updateMany({
      where: { referenceId: id, type: 'MEMBERSHIP' },
      data: { status: paymentStatus }
    });

    // Handle role update if status becomes PAID or APPROVED
    if (status === 'PAID' || status === 'APPROVED') {
      await prisma.user.update({
        where: { id: order.userId },
        data: { 
          membership: 'PREMIUM', 
          membershipStatus: 'PREMIUM',
          membershipExpiredAt: expiredAt
        }
      });
      // Award points safely
      await PointsService.awardPointsForMembershipOrder(id);
    } else if (status === 'REJECTED' || status === 'FAILED') {
      await prisma.user.update({
        where: { id: order.userId },
        data: { 
          membership: 'FREE',
          membershipStatus: 'FREE'
        }
      });
    }

    // Notify User
    let title = 'Membership Status Updated';
    let message = `Your membership request status is now ${status.toLowerCase()}`;
    let link = '/membership';

    if (status === 'PENDING') {
      title = 'Membership Review';
      message = 'Your membership request is currently under review by our team.';
    } else if (status === 'PAID' || status === 'APPROVED') {
      title = 'Membership Active';
      message = 'Welcome to the club! Your PREMIUM membership is now active.';
    } else if (status === 'REJECTED' || status === 'FAILED') {
      title = 'Membership Update';
      message = 'There was an issue with your membership request. Please check your details.';
    }

    await prisma.notification.create({
      data: {
        userId: order.userId,
        title,
        message,
        link,
        roleTarget: 'USER'
      }
    });

    res.json(updatedOrder);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
