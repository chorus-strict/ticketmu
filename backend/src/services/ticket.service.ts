import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

class TicketService {
  async purchase(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const soldCount = await prisma.ticket.count({ where: { eventId } });
    if (soldCount >= event.capacity) {
      throw new Error('Event is sold out');
    }

    const qrCode = `TKT-${uuidv4().slice(0, 8).toUpperCase()}`;

    return await prisma.ticket.create({
      data: {
        userId,
        eventId,
        qrCode,
        status: 'ACTIVE',
      },
      include: { event: true },
    });
  }

  async getByUser(userId: string, limit?: number, offset?: number, status?: string) {
    const where: any = { userId };
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: { event: true },
        orderBy: { purchaseDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.ticket.count({ where })
    ]);

    return { tickets, total };
  }

  async getAll(limit?: number, offset?: number, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: { event: true, user: { select: { name: true, email: true } } },
        orderBy: { purchaseDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.ticket.count({ where })
    ]);

    return { tickets, total };
  }

  async update(id: string, data: any) {
    return await prisma.ticket.update({
      where: { id },
      data,
      include: { event: true, user: { select: { name: true, email: true } } },
    });
  }

  async delete(id: string) {
    return await prisma.ticket.delete({
      where: { id },
    });
  }

  async validate(code: string) {
    console.log(`[TicketService] Validating ticket: "${code}"`);
    if (!code) throw new Error('Ticket code is required');

    // Clean the input: uppercase and remove all non-alphanumeric
    let cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // If it starts with TKT or TCK, remove that prefix to get the actual hex parts
    if (cleanCode.startsWith('TKT') || cleanCode.startsWith('TCK')) {
      cleanCode = cleanCode.slice(3);
    }

    console.log(`[TicketService] Cleaned code: "${cleanCode}" (length: ${cleanCode.length})`);

    // Strategy 1: Exact match on qrCode using original code
    let ticket = await prisma.ticket.findUnique({
      where: { qrCode: code },
      include: { event: true, user: { select: { name: true, email: true, id: true } } },
    });

    // Strategy 2: Exact match on qrCode using cleaned versions
    if (!ticket) {
      // Try with common prefixes if the user didn't include them
      const possibleQrCodes = [
        code,
        `TKT-${code}`,
        `TCK-${code}`,
        cleanCode,
        `TKT-${cleanCode}`,
        `TCK-${cleanCode}`
      ];

      for (const qr of possibleQrCodes) {
        if (ticket) break;
        ticket = await prisma.ticket.findUnique({
          where: { qrCode: qr },
          include: { event: true, user: { select: { name: true, email: true, id: true } } },
        });
      }
    }

    // Strategy 3: Match on full ID (UUID)
    if (!ticket && (code.length === 36 || cleanCode.length === 32)) {
      const possibleId = code.length === 36 ? code : cleanCode.toLowerCase();
      try {
        ticket = await prisma.ticket.findUnique({
          where: { id: possibleId },
          include: { event: true, user: { select: { name: true, email: true, id: true } } },
        });
      } catch (e) {
        // Not a valid UUID format
      }
    }

    // Strategy 4: Fuzzy match on ID parts (TKT-XXXX-XXXX format)
    if (!ticket && cleanCode.length >= 8) {
      const part1 = cleanCode.slice(0, 4);
      const part2 = cleanCode.slice(-4);

      console.log(`[TicketService] Searching for ID starting with "${part1}" and ending with "${part2}"`);

      // We use findMany because startsWith/endsWith might match multiple if bits are short
      const matchingTickets = await prisma.ticket.findMany({
        where: {
          OR: [
            { id: { startsWith: part1.toLowerCase(), endsWith: part2.toLowerCase() } },
            { id: { startsWith: part1.toUpperCase(), endsWith: part2.toUpperCase() } }
          ]
        },
        include: { event: true, user: { select: { name: true, email: true, id: true } } },
      });

      if (matchingTickets.length === 1) {
        console.log(`[TicketService] Found unique match via ID parts: ${matchingTickets[0].id}`);
        ticket = matchingTickets[0];
      } else if (matchingTickets.length > 1) {
        console.warn(`[TicketService] Multiple tickets (${matchingTickets.length}) matched ID parts ${part1}...${part2}`);
        throw new Error('Multiple tickets matched. Please provide full ID.');
      }
    }

    if (!ticket) {
      console.error(`[TicketService] Validation failed: No ticket found for "${code}"`);
      throw new Error('Invalid ticket');
    }
    
    console.log(`[TicketService] Ticket found! Status: ${ticket.status}, Event: ${ticket.event.title}`);

    if (ticket.status !== 'ACTIVE') {
      throw new Error(`Ticket is already ${ticket.status.toLowerCase()}`);
    }

    const now = new Date();
    // Allow a bit of leeway for event time - set to end of event day
    const eventDate = new Date(ticket.event.date);
    eventDate.setHours(23, 59, 59, 999);

    if (eventDate < now) {
      console.warn(`[TicketService] Ticket date passed. Event: ${eventDate}, Now: ${now}`);
      throw new Error('This ticket was for a past event');
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'USED' },
      include: { event: true, user: { select: { name: true, email: true, id: true } } },
    });

    console.log(`[TicketService] Ticket ${updatedTicket.id} successfully validated and marked as USED`);
    return updatedTicket;
  }
}

export const ticketService = new TicketService();
