import { getJakartaStartOfDay, getJakartaEndOfDay } from '../lib/date';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().transform((str) => new Date(str)),
  location: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  price: z.number().min(0),
  capacity: z.number().int().min(1),
  image: z.string().url(),
  category: z.string().min(1),
  status: z.enum(['DRAFT', 'LIVE', 'ENDED']).default('DRAFT'),
  visibility: z.enum(['PUBLIC', 'PREMIUM']).default('PUBLIC'),
  isFeatured: z.boolean().default(false),
});

export const updateEventSchema = eventSchema.partial().omit({
  // Omitting fields that should not be updated directly through this schema
});

class EventService {
  async getAll(filters?: { status?: string; category?: string; search?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.category && filters.category !== 'All') where.category = filters.category;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: { 
        author: { select: { name: true, id: true } },
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
      where: { status: 'LIVE' },
      include: {
        _count: {
          select: { tickets: true }
        },
        tickets: {
          where: {
            purchaseDate: {
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
      const score = totalSales + (recentSales * 2);
      
      return {
        id: event.id,
        title: event.title,
        date: event.date,
        image: event.image,
        category: event.category,
        location: event.location,
        price: event.price,
        sold: totalSales,
        trendingScore: score
      };
    });

    // Sort by trendingScore DESC and return top 3
    return eventsWithScore
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 3);
  }

  async getById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { 
        author: { select: { name: true, id: true } },
        _count: { select: { tickets: true } }
      },
    });
    if (!event) throw new Error('Event not found');
    return {
      ...event,
      sold: event._count.tickets
    };
  }

  async create(data: z.infer<typeof eventSchema>, authorId: string) {
    return await prisma.event.create({
      data: {
        ...data,
        authorId,
      },
    });
  }

  async update(id: string, data: any) {
    // Validate data using update schema
    const validatedData = updateEventSchema.parse(data);
    
    return await prisma.event.update({
      where: { id },
      data: validatedData,
    });
  }

  async delete(id: string) {
    return await prisma.event.delete({
      where: { id },
    });
  }

  async getSpotlight() {
    const now = new Date();
    const todayStart = getJakartaStartOfDay(now);
    const todayEnd = getJakartaEndOfDay(now);

    // 1. Try to find events today
    let events = await prisma.event.findMany({
      where: {
        status: 'LIVE',
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      orderBy: { date: 'asc' }
    });

    let type: 'TODAY' | 'UPCOMING' = 'TODAY';

    // 2. If no today events, find upcoming
    if (events.length === 0) {
      type = 'UPCOMING';
      events = await prisma.event.findMany({
        where: {
          status: 'LIVE',
          date: {
            gt: now
          }
        },
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
