import { Request, Response } from 'express';
import { eventService, eventSchema } from '../services/event.service';
import { AuthRequest } from '../middleware/auth';

export const getEvents = async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      category: req.query.category as string,
      search: (req.query.search || req.query.q) as string, // Added req.query.q for /events/search?q=
    };
    const events = await eventService.getAll(filters);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch events' });
  }
};

export const getTrendingEvents = async (req: Request, res: Response) => {
  try {
    const events = await eventService.getTrending();
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch trending events' });
  }
};

export const getSpotlightEvents = async (req: Request, res: Response) => {
  try {
    const spotlight = await eventService.getSpotlight();
    res.json(spotlight);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch spotlight events' });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await eventService.getById(req.params.id);
    res.json(event);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = eventSchema.parse(req.body);
    const event = await eventService.create(validatedData, req.user!.id);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Validation failed' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await eventService.update(req.params.id, req.body, req.user!.id, req.user!.role);
    res.json(event);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    await eventService.delete(req.params.id, req.user!.id, req.user!.role);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
