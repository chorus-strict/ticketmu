import { prisma } from '../lib/prisma';

class FavoriteService {
  async toggle(userId: string, eventId: string) {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { favorited: false };
    } else {
      await prisma.favorite.create({
        data: {
          userId,
          eventId,
        },
      });
      return { favorited: true };
    }
  }

  async getUserFavorites(userId: string) {
    return await prisma.favorite.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            organizer: { select: { name: true, id: true } },
            _count: { select: { tickets: true } }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async isFavorited(userId: string, eventId: string) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });
    return !!favorite;
  }
}

export const favoriteService = new FavoriteService();
