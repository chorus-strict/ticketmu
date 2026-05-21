import { getJakartaStartOfDay, getJakartaEndOfDay } from '../lib/date';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  location: z.string().min(1),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  price: z.number().min(0),
  capacity: z.number().int().min(1),
  image: z.string().url(),
  category: z.string(), // More lenient than enum for sync
  status: z.enum(['DRAFT', 'LIVE', 'ENDED']).default('DRAFT'),
  visibility: z.enum(['PUBLIC', 'PREMIUM']).default('PUBLIC'),
  isFeatured: z.boolean().default(false),
  maxTicketsPerUser: z.number().int().min(1).default(5),
  ticketTiers: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    price: z.number().min(0),
    quantity: z.number().int().min(1),
    benefits: z.any().optional(),
    colorTheme: z.string().nullable().optional(),
    isFeatured: z.boolean().default(false),
    salesStart: z.union([z.string(), z.date(), z.null()]).optional().transform(s => s ? new Date(s) : undefined),
    salesEnd: z.union([z.string(), z.date(), z.null()]).optional().transform(s => s ? new Date(s) : undefined),
  })).optional(),
}).strip();

export const updateEventSchema = eventSchema.partial().omit({
  // Omitting fields that should not be updated directly through this schema
});

class EventService {
  async getAll(filters?: { status?: string; category?: string; search?: string }) {
    const where: any = { isArchived: false };
    if (filters?.status) where.status = filters.status;
    if (filters?.category && filters.category !== 'All') where.category = filters.category;
    if (filters?.search) {
      where.AND = [
        {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { location: { contains: filters.search, mode: 'insensitive' } },
            { category: { contains: filters.search, mode: 'insensitive' } },
          ]
        }
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: { 
        organizer: { select: { name: true, id: true } },
        ticketTiers: true,
        _count: { select: { tickets: true } }
      },
      orderBy: { date: 'asc' },
    });

    return events.map(event => ({
      ...event,
      sold: event._count.tickets
    }));
  }

  async getTrending() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch all LIVE events with their total tickets and recent tickets
    const events = await prisma.event.findMany({
      where: { status: 'LIVE', isArchived: false },
      include: {
        ticketTiers: true,
        _count: {
          select: { tickets: true }
        },
        tickets: {
          where: {
            purchasedAt: {
              gte: sevenDaysAgo
            }
          },
          select: {
            id: true
          }
        }
      }
    });

    const eventsWithScore = events.map(event => {
      const totalSales = event._count.tickets;
      const recentSales = event.tickets.length;
      // Boost featured events so they are prioritized in the trending score list
      const score = totalSales + (recentSales * 2) + (event.isFeatured ? 500 : 0);
      
      return {
        id: event.id,
        title: event.title,
        date: event.date,
        image: event.image,
        category: event.category,
        location: event.location,
        price: event.price,
        isFeatured: event.isFeatured,
        sold: totalSales,
        trendingScore: score
      };
    });

    // Sort by trendingScore DESC and return top 3
    return eventsWithScore
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 3);
  }

  async generateUniqueSlug(title: string, currentId?: string): Promise<string> {
    const slugify = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[-\s]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let suffix = 2;
    
    while (true) {
      const existing = await prisma.event.findFirst({
        where: {
          slug,
          NOT: currentId ? { id: currentId } : undefined
        }
      });
      if (!existing) break;
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }
    return slug;
  }

  async getById(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    const event = await prisma.event.findFirst({
      where: isUuid ? {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }]
      } : {
        slug: idOrSlug
      },
      include: { 
        organizer: { select: { name: true, id: true } },
        ticketTiers: true,
        _count: { select: { tickets: true } }
      },
    });
    
    if (!event) throw new Error('Event not found');
    if (event.isArchived) throw new Error('Event no longer available');
    return {
      ...event,
      sold: event._count.tickets
    };
  }

  async create(data: any, organizerId: string) {
    try {
      // Striking out passthrough fields by using parse on a schema that doesn't have .passthrough()
      const eventDataParsed = eventSchema.parse(data);
      
      const { 
        ticketTiers, 
        ...eventData 
      } = eventDataParsed as any;

      const slug = await this.generateUniqueSlug(eventData.title);
      
      return await prisma.event.create({
        data: {
          ...eventData,
          slug,
          organizerId,
          ticketTiers: ticketTiers ? {
            create: ticketTiers
          } : undefined
        },
        include: { ticketTiers: true }
      });
    } catch (err: any) {
      console.error('[EventService] Create failed:', err);
      throw err;
    }
  }

  async update(id: string, data: any, userId?: string, userRole?: string) {
    try {
      const existingEvent = await prisma.event.findUnique({ where: { id } });
      if (!existingEvent) throw new Error('Event not found');
      
      if (userId && userRole !== 'ADMIN' && existingEvent.organizerId !== userId) {
        throw new Error('Unauthorized: You can only modify your own events');
      }

      // Strip unknown fields by using parse
      const eventDataParsed = updateEventSchema.parse(data);
      
      const { 
        ticketTiers, 
        ...eventData 
      } = eventDataParsed as any;

      let slug = existingEvent.slug;
      if (eventData.title && eventData.title !== existingEvent.title) {
        slug = await this.generateUniqueSlug(eventData.title, id);
      }
      
      return await prisma.$transaction(async (tx) => {
        if (ticketTiers !== undefined) {
          // Robust mapping of ticket tier updates
          const currentTiers = await tx.ticketTier.findMany({ where: { eventId: id } });
          const incomingTiers = ticketTiers || [];
          
          // Separate tiers to update, create, and delete
          const tiersToUpdate = incomingTiers.filter((t: any) => t.id && currentTiers.some(ct => ct.id === t.id));
          const tiersToCreate = incomingTiers.filter((t: any) => !t.id || !currentTiers.some(ct => ct.id === t.id));
          const tiersToDelete = currentTiers.filter(ct => !incomingTiers.some((t: any) => t.id === ct.id));

          // 1. Delete tiers that are no longer present, safely skipping ones with sold tickets
          const safeTiersToDelete = tiersToDelete.filter(t => t.sold === 0);
          if (safeTiersToDelete.length > 0) {
            await tx.ticketTier.deleteMany({
              where: { id: { in: safeTiersToDelete.map(t => t.id) } }
            });
          }

          // 2. Update existing tiers
          for (const tier of tiersToUpdate) {
            const { id: tierId, ...tierData } = tier;
            await tx.ticketTier.update({
              where: { id: tierId },
              data: tierData
            });
          }

          // 3. Create new tiers
          for (const tier of tiersToCreate) {
            const { id: ignoredId, ...tierData } = tier;
            await tx.ticketTier.create({
              data: {
                ...tierData,
                eventId: id
              }
            });
          }
        }

        return await tx.event.update({
          where: { id },
          data: eventData,
          include: { ticketTiers: true }
        });
      });
    } catch (err: any) {
      console.error('[EventService] Update failed:', err);
      throw err;
    }
  }

  async delete(id: string, userId?: string, userRole?: string) {
    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) throw new Error('Event not found');

    if (userId && userRole !== 'ADMIN' && existingEvent.organizerId !== userId) {
      throw new Error('Unauthorized: You can only delete your own events');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Delete favorites associated with this event so they are cleaned up
      await tx.favorite.deleteMany({
        where: { eventId: id }
      });

      // 2. Delete cart items associated with this event so they cannot be checked out
      await tx.cartItem.deleteMany({
        where: { eventId: id }
      });

      // 3. Update the event isArchived status to true, preserving all tickets/orders
      return await tx.event.update({
        where: { id },
        data: { 
          isArchived: true,
          status: 'ENDED' // Mark it as ended
        }
      });
    });
  }

  async getSpotlight() {
    const now = new Date();
    const todayStart = getJakartaStartOfDay(now);
    const todayEnd = getJakartaEndOfDay(now);

    // 1. Try to find featured events first, which are highly prioritized
    let events = await prisma.event.findMany({
      where: {
        status: 'LIVE',
        isArchived: false,
        isFeatured: true,
        date: {
          gt: now
        }
      },
      include: { ticketTiers: true },
      orderBy: { date: 'asc' },
      take: 5
    });

    let type: 'FEATURED' | 'TODAY' | 'UPCOMING' = 'FEATURED';

    // 2. If no future featured events, find today's events
    if (events.length === 0) {
      type = 'TODAY';
      events = await prisma.event.findMany({
        where: {
          status: 'LIVE',
          isArchived: false,
          date: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        include: { ticketTiers: true },
        orderBy: { date: 'asc' }
      });
    }

    // 3. If no today events, find upcoming events
    if (events.length === 0) {
      type = 'UPCOMING';
      events = await prisma.event.findMany({
        where: {
          status: 'LIVE',
          isArchived: false,
          date: {
            gt: now
          }
        },
        include: { ticketTiers: true },
        orderBy: { date: 'asc' },
        take: 5
      });
    }

    return {
      type,
      events
    };
  }
}

export const eventService = new EventService();
