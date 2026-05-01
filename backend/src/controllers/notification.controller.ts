import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  console.log(`[NotificationController] Fetching notifications for user: ${req.user?.id}, role: ${req.user?.role}`);
  try {
    const notifications = await prisma.notification.findMany({
      where: { 
        userId: req.user!.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    console.log(`[NotificationController] Found ${notifications.length} notifications`);
    res.json(notifications);
  } catch (error: any) {
    console.error('[NotificationController] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true }
    });
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsReadById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id, userId: req.user!.id },
      data: { isRead: true }
    });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notification.delete({
      where: { id, userId: req.user!.id }
    });
    res.status(200).json({ message: 'Notification deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAllNotifications = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user!.id }
    });
    res.status(200).json({ message: 'All notifications deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
