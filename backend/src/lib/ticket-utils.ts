import { Ticket } from '@prisma/client';

export function resolveTicketStatus(ticket: Ticket) {
  const now = new Date();

  if (ticket.ticketStatus === 'USED') {
    return 'USED';
  }

  if (ticket.ticketStatus === 'CANCELLED') {
    return 'CANCELLED';
  }

  if (
    ticket.ticketStatus === 'ACTIVE' &&
    ticket.eventEndDate &&
    now > new Date(ticket.eventEndDate)
  ) {
    return 'EXPIRED';
  }

  return ticket.ticketStatus;
}
