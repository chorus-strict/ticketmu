import { prisma } from '../lib/prisma';

export class PaymentLogService {
  static async logOrder(orderId: string, status: string, message: string, payload?: any) {
    try {
      return await prisma.paymentLog.create({
        data: {
          orderId,
          status,
          message,
          payload
        }
      });
    } catch (error) {
      console.error('Failed to create payment log for order:', error);
    }
  }

  static async logMembershipOrder(membershipOrderId: string, status: string, message: string, payload?: any) {
    try {
      return await prisma.paymentLog.create({
        data: {
          membershipOrderId,
          status,
          message,
          payload
        }
      });
    } catch (error) {
      console.error('Failed to create payment log for membership:', error);
    }
  }
}
