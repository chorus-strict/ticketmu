import { Response } from 'express';
import { ticketService } from '../services/ticket.service';
import { AuthRequest } from '../middleware/auth';

import { orderService } from '../services/order.service';

export const purchaseTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, ticketTierId, paymentMethodId, userRewardId } = req.body;
    const order = await orderService.create(req.user!.id, eventId, ticketTierId, paymentMethodId, userRewardId);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Order creation failed' });
  }
};

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const status = req.query.status as string | undefined;

    let result;
    const isOrganizer = req.user!.role === 'ORGANIZER';
    const isAdmin = req.user!.role === 'ADMIN';

    if (isAdmin && req.query.all === 'true') {
      // If all=true, we fetch everything for admin analytics, but with a reasonable upper bound
      const maxLimit = 10000; 
      result = await ticketService.getAll(maxLimit, 0, status);
    } else if (isOrganizer) {
      result = await ticketService.getByOrganizer(req.user!.id, limit, offset, status);
    } else {
      result = await ticketService.getByUser(req.user!.id, limit, offset, status);
    }
    
    console.log(`[TicketAPI] Fetched ${result.tickets.length} tickets (total: ${result.total})`);
    
    res.json({
      tickets: result.tickets,
      total: result.total,
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await ticketService.update(req.params.id, req.body);
    res.json(ticket);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTicket = async (req: AuthRequest, res: Response) => {
  try {
    await ticketService.delete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const validateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { qrCode } = req.body;
    const result = await ticketService.validate(qrCode, req.user!.id, req.user!.role);
    res.json({ message: 'Ticket validated successfully', ticket: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
