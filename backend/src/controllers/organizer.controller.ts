import { Request, Response } from 'express';
import { organizerService, organizerProfileSchema } from '../services/organizer.service';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

export const upgrade = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { paymentMethodId, ...formData } = req.body;
    const validatedData = organizerProfileSchema.parse(formData);
    const result = await organizerService.createUpgradeRequest(userId, validatedData, paymentMethodId);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('[UPGRADE ERROR DETAILED]:', error, error.stack);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    }
    res.status(400).json({ message: error.message || 'Upgrade failed' });
  }
};

export const confirmPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { requestId, proofUrl } = req.body;
    const result = await organizerService.confirmPayment(requestId, userId, proofUrl);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const request = await organizerService.getMyRequest(userId);
    res.json(request);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await organizerService.getAllRequests();
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const approveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const result = await organizerService.approveRequest(id, adminId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const rejectRequest = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const result = await organizerService.rejectRequest(id, adminId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const profile = await organizerService.getProfile(userId);
    res.json(profile);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const stats = await organizerService.getStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const validateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const organizerId = req.user?.id;
    if (!organizerId) return res.status(401).json({ message: 'Unauthorized' });

    const { qrCode } = req.body;
    if (!qrCode) return res.status(400).json({ message: 'QR Code is required' });

    const result = await organizerService.validateTicket(qrCode, organizerId);
    res.json({ message: 'Ticket validated successfully', data: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyEvents = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const events = await organizerService.getMyEvents(userId);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
