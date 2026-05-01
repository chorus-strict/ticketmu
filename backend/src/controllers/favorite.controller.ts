import { Request, Response } from 'express';
import { favoriteService } from '../services/favorite.service';

export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = (req as any).user.id;
    const result = await favoriteService.toggle(userId, eventId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const favorites = await favoriteService.getUserFavorites(userId);
    res.json(favorites.map(f => ({
      ...f.event,
      sold: (f.event as any)._count.tickets
    })));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getIsFavorited = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = (req as any).user.id;
    const isFavorited = await favoriteService.isFavorited(userId, eventId);
    res.json({ isFavorited });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
