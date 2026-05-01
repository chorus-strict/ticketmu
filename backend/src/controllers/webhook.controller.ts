import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { TripayService } from '../services/tripay.service';
import { PaymentLogService } from '../services/payment-log.service';
import { orderService } from '../services/order.service';

export const handleTripayWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['x-callback-signature'] as string;
  const event = req.headers['x-callback-event'] as string;
  const data = req.body;

  try {
    // 1. Identify context (Order or Membership)
    const reference = data.merchant_ref;
    
    // Find payment method to get private key (needed for signature verification)
    // We assume the payment method used for this reference exists
    let paymentMethod;
    let order;
    let membershipOrder;

    order = await prisma.order.findUnique({
      where: { id: reference },
      include: { paymentMethod: true }
    });

    if (order) {
      paymentMethod = order.paymentMethod;
    } else {
      membershipOrder = await prisma.membershipOrder.findUnique({
        where: { id: reference },
        include: { paymentMethod: true }
      });
      if (membershipOrder) {
        paymentMethod = membershipOrder.paymentMethod;
      }
    }

    if (!paymentMethod || !paymentMethod.config) {
      return res.status(400).json({ success: false, message: 'Payment method not found for reference' });
    }

    const config = paymentMethod.config as any;
    
    // 2. Verify Signature
    const isVerified = TripayService.verifyWebhookSignature(
      JSON.stringify(data),
      signature,
      config.privateKey
    );

    if (!isVerified) {
       console.error('Invalid Tripay Signature for ref:', reference);
       return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // 3. Handle Status
    if (event === 'payment_status') {
      const status = data.status;

      if (status === 'PAID') {
        if (order) {
          await orderService.approve(order.id);
          await PaymentLogService.logOrder(order.id, 'WEBHOOK_PAID', 'Tripay webhook: Payment received', data);
        } else if (membershipOrder) {
          // Manual approval for membership for now or call membership approve logic
          // For consistency with existing flow:
          await prisma.$transaction([
            prisma.membershipOrder.update({
              where: { id: membershipOrder.id },
              data: { status: 'APPROVED', expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
            }),
            prisma.payment.updateMany({
              where: { referenceId: membershipOrder.id, type: 'MEMBERSHIP' },
              data: { status: 'SUCCESS' }
            }),
            prisma.user.update({
              where: { id: membershipOrder.userId },
              data: { membership: 'PREMIUM', membershipStatus: 'PREMIUM', membershipExpiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
            })
          ]);
          await PaymentLogService.logMembershipOrder(membershipOrder.id, 'WEBHOOK_PAID', 'Tripay webhook: Payment received', data);
        }
      } else if (status === 'EXPIRED' || status === 'FAILED') {
        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'FAILED' }
          });
          await prisma.payment.updateMany({
            where: { referenceId: order.id, type: 'TICKET' },
            data: { status: 'FAILED' }
          });
          await PaymentLogService.logOrder(order.id, 'WEBHOOK_EXPIRED', `Tripay webhook: Payment ${status.toLowerCase()}`, data);
        } else if (membershipOrder) {
          await prisma.membershipOrder.update({
            where: { id: membershipOrder.id },
            data: { status: 'REJECTED' }
          });
          await prisma.payment.updateMany({
            where: { referenceId: membershipOrder.id, type: 'MEMBERSHIP' },
            data: { status: 'FAILED' }
          });
          await PaymentLogService.logMembershipOrder(membershipOrder.id, 'WEBHOOK_EXPIRED', `Tripay webhook: Payment ${status.toLowerCase()}`, data);
        }
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Webhook Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
