import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { orderService } from './order.service';

export const organizerProfileSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters long" }),
  description: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
});

class OrganizerService {
  async createUpgradeRequest(userId: string, data: z.infer<typeof organizerProfileSchema>, paymentMethodId?: string) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      
      // Check if there's already a pending or waiting request
      const existingRequest = await tx.organizerRequest.findFirst({
        where: { 
          userId, 
          status: { in: ['PAYMENT_PENDING', 'WAITING_APPROVAL'] } 
        }
      });
      if (existingRequest) throw new Error('You already have an active organizer application');

      const amount = 300000;

      const pmId = paymentMethodId && paymentMethodId.trim() !== '' ? paymentMethodId : null;

      // Create Request
      const request = await tx.organizerRequest.create({
        data: {
          userId,
          companyName: data.companyName,
          description: data.description || '',
          logo: data.logo,
          website: data.website,
          bankAccount: data.bankAccount,
          bankName: data.bankName,
          amount,
          status: 'PAYMENT_PENDING'
        }
      });

      // Create Order using the unified flow
      const order = await orderService.createOrganizerActivation(userId, request.id, pmId, tx);

      return { request, order };
    });
  }

  async confirmPayment(requestId: string, userId: string, proofUrl?: string) {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.organizerRequest.findUnique({ where: { id: requestId } });
      if (!request || request.userId !== userId) throw new Error('Request not found');
      if (request.status !== 'PAYMENT_PENDING') throw new Error('Request is not in payment pending status');

      const updatedRequest = await tx.organizerRequest.update({
        where: { id: requestId },
        data: { 
          status: 'WAITING_APPROVAL',
          proofUrl: proofUrl || request.proofUrl,
          paidAt: proofUrl ? new Date() : request.paidAt
        }
      });

      // Notify Admins
      const admins = await tx.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            title: 'New Organizer Application',
            message: `${request.companyName} has submitted an organizer application.`,
            link: '/dashboard?tab=ORGANIZERS',
            roleTarget: 'ADMIN',
            type: 'ORGANIZER_REQUEST'
          }
        });
      }

      return updatedRequest;
    });
  }

  async getAllRequests() {
    return await prisma.organizerRequest.findMany({
      include: { user: { select: { name: true, email: true } }, paymentMethod: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMyRequest(userId: string) {
    return await prisma.organizerRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { 
        paymentMethod: true,
        order: {
          include: { paymentMethod: true }
        }
      }
    });
  }

  async approveRequest(requestId: string, adminId: string) {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.organizerRequest.findUnique({ 
        where: { id: requestId },
        include: { user: true }
      });
      if (!request) throw new Error('Request not found');
      if (request.status !== 'WAITING_APPROVAL') throw new Error('Request is not waiting for approval');

      // 1. Update Request Status
      await tx.organizerRequest.update({
        where: { id: requestId },
        data: { 
          status: 'APPROVED',
          processedAt: new Date(),
          processedBy: adminId
        }
      });

      // 2. Update Role and sync user data
      await tx.user.update({
        where: { id: request.userId },
        data: { role: 'ORGANIZER' }
      });

      // 3. Create/Update Profile
      await tx.organizerProfile.upsert({
        where: { userId: request.userId },
        create: {
          userId: request.userId,
          companyName: request.companyName,
          bio: request.description || '',
          logo: request.logo,
          website: request.website,
          bankAccount: request.bankAccount,
          bankName: request.bankName,
          isVerified: true
        },
        update: {
          companyName: request.companyName,
          bio: request.description || '',
          logo: request.logo,
          website: request.website,
          bankAccount: request.bankAccount,
          bankName: request.bankName,
          isVerified: true
        }
      });

      // 4. Update Payment Status
      await tx.payment.updateMany({
        where: { referenceId: requestId, type: 'ORGANIZER_APPLICATION' },
        data: { status: 'SUCCESS' }
      });

      // 5. Notify User
      await tx.notification.create({
        data: {
          userId: request.userId,
          title: 'Organizer Application Approved',
          message: `Congratulations! Your request to become an organizer for ${request.companyName} has been approved.`,
          link: '/dashboard',
          roleTarget: 'USER',
          type: 'ORGANIZER_REQUEST'
        }
      });

      return { message: 'Approved successfully' };
    });
  }

  async rejectRequest(requestId: string, adminId: string) {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.organizerRequest.findUnique({ where: { id: requestId } });
      if (!request) throw new Error('Request not found');

      await tx.organizerRequest.update({
        where: { id: requestId },
        data: { 
          status: 'REJECTED',
          processedAt: new Date(),
          processedBy: adminId
        }
      });

      // Update Payment Status
      await tx.payment.updateMany({
        where: { referenceId: requestId, type: 'ORGANIZER_APPLICATION' },
        data: { status: 'FAILED' }
      });

      // Notify User
      await tx.notification.create({
        data: {
          userId: request.userId,
          title: 'Organizer Application Rejected',
          message: `We regret to inform you that your organizer application for ${request.companyName} was rejected.`,
          link: '/settings',
          roleTarget: 'USER',
          type: 'ORGANIZER_REQUEST'
        }
      });

      return { message: 'Rejected successfully' };
    });
  }

  async getProfile(userId: string) {
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true, avatar: true } } }
    });
    if (!profile) throw new Error('Organizer profile not found');
    return profile;
  }

  async getStats(userId: string) {
    const events = await prisma.event.findMany({
      where: { organizerId: userId },
      include: {
        _count: { select: { tickets: true, orders: { where: { status: 'PAID' } } } }
      }
    });

    const totalTicketsSold = events.reduce((sum, e) => sum + e._count.tickets, 0);
    const totalOrders = events.reduce((sum, e) => sum + e._count.orders, 0);
    
    const profile = await prisma.organizerProfile.findUnique({ where: { userId } });

    return {
      totalEvents: events.length,
      totalTicketsSold,
      totalOrders,
      balance: profile?.balance || 0,
      totalRevenue: profile?.totalRevenue || 0
    };
  }

  async validateTicket(qrCode: string, organizerId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        event: true,
        user: { select: { name: true, email: true } }
      }
    });

    if (!ticket) throw new Error('Invalid ticket: QR Code not recognized');
    
    // Check if the ticket belongs to an event created by this organizer
    if (ticket.event.organizerId !== organizerId) {
      throw new Error('Unauthorized: This ticket is not for your event');
    }

    if (ticket.status !== 'ACTIVE') {
      if (ticket.status === 'USED') throw new Error('Security Alert: Ticket has already been used');
      throw new Error(`Ticket is ${ticket.status}`);
    }

    // Mark as used
    return await prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: 'USED' }
      });

      await tx.ticketScan.create({
        data: {
          ticketId: ticket.id,
          userId: organizerId
        }
      });

      return {
        ticket: updatedTicket,
        event: ticket.event,
        user: ticket.user
      };
    });
  }

  async getMyEvents(userId: string) {
    return await prisma.event.findMany({
      where: { 
        organizerId: userId,
        isArchived: false
      },
      include: {
        _count: { select: { tickets: true } },
        ticketTiers: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const organizerService = new OrganizerService();
