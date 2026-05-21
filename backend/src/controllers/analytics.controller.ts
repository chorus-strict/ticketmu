import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { getJakartaStartOfDay, getJakartaEndOfDay } from '../lib/date';

export const getDailyAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const start = getJakartaStartOfDay(new Date(startDate as string));
    const end = getJakartaEndOfDay(new Date(endDate as string));

    let payments: { amount: number; createdAt: Date }[] = [];

    if (req.user?.role === 'ORGANIZER') {
      const orders = await prisma.order.findMany({
        where: {
          status: { in: ['PAID', 'APPROVED'] },
          event: { organizerId: req.user.id },
          createdAt: { gte: start, lte: end },
        },
        select: { organizerShare: true, total: true, createdAt: true },
      });
      payments = orders.map(o => ({ 
        amount: o.organizerShare || (o.total * 0.90), // Fallback if share not set yet
        createdAt: o.createdAt 
      }));
    } else {
      const paymentData = await prisma.payment.findMany({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: start, lte: end },
        },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
      payments = paymentData.map(p => ({ amount: p.amount, createdAt: p.createdAt }));
    }

    // Group by day (Jakarta timezone)
    const dailyData: { [key: string]: number } = {};
    
    // Initialize all dates in range with 0
    let current = new Date(start);
    while (current <= end) {
      const dateStr = current.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      dailyData[dateStr] = 0;
      current.setDate(current.getDate() + 1);
    }

    payments.forEach((payment) => {
      const dateStr = new Date(payment.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      if (dailyData[dateStr] !== undefined) {
        dailyData[dateStr] += payment.amount;
      }
    });

    const result = Object.entries(dailyData).map(([date, revenue]) => ({
      date,
      revenue,
      // Add a formatted date for the chart labels
      label: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' }),
    }));

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching daily analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMonthlyAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    // Fetch SUCCESS payments for the last 12 months by default
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    const start = getJakartaStartOfDay(twelveMonthsAgo);
    start.setDate(1); // Start of the month 11 months ago

    let payments: { amount: number; createdAt: Date }[] = [];

    if (req.user?.role === 'ORGANIZER') {
      const orders = await prisma.order.findMany({
        where: {
          status: { in: ['PAID', 'APPROVED'] },
          event: { organizerId: req.user.id },
          createdAt: { gte: start },
        },
        select: { organizerShare: true, total: true, createdAt: true },
      });
      payments = orders.map(o => ({ 
        amount: o.organizerShare || (o.total * 0.90), 
        createdAt: o.createdAt 
      }));
    } else {
      const paymentData = await prisma.payment.findMany({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: start },
        },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
      payments = paymentData.map(p => ({ amount: p.amount, createdAt: p.createdAt }));
    }

    // Group by month (Jakarta timezone)
    const monthlyData: { [key: string]: number } = {};
    
    // Initialize last 12 months with 0
    let current = new Date(start);
    const now = new Date();
    while (current <= now) {
      const monthStr = current.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }).substring(0, 7); // YYYY-MM
      monthlyData[monthStr] = 0;
      current.setMonth(current.setMonth(current.getMonth() + 1));
    }

    payments.forEach((payment) => {
      const monthStr = new Date(payment.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }).substring(0, 7);
      if (monthlyData[monthStr] !== undefined) {
        monthlyData[monthStr] += payment.amount;
      }
    });

    const result = Object.entries(monthlyData).map(([yearMonth, revenue]) => {
      const [year, month] = yearMonth.split('-');
      // Use YYYY-MM-DD format to ensure correct parsing
      const dateLabel = new Date(`${yearMonth}-01`);
      return {
        date: yearMonth,
        revenue,
        label: dateLabel.toLocaleDateString('id-ID', { month: 'short', year: '2-digit', timeZone: 'Asia/Jakarta' }),
      };
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching monthly analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMonthAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.query; // Expecting YYYY-MM
    if (!month) {
      return res.status(400).json({ message: 'Month is required' });
    }

    const [year, monthNum] = (month as string).split('-').map(Number);
    const start = getJakartaStartOfDay(new Date(year, monthNum - 1, 1));
    const end = getJakartaEndOfDay(new Date(year, monthNum, 0)); // last day of month

    let payments: { amount: number; createdAt: Date }[] = [];

    if (req.user?.role === 'ORGANIZER') {
      const orders = await prisma.order.findMany({
        where: {
          status: { in: ['PAID', 'APPROVED'] },
          event: { organizerId: req.user.id },
          createdAt: { gte: start, lte: end },
        },
        select: { organizerShare: true, total: true, createdAt: true },
      });
      payments = orders.map(o => ({ 
        amount: o.organizerShare || (o.total * 0.90), 
        createdAt: o.createdAt 
      }));
    } else {
      const paymentData = await prisma.payment.findMany({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: start, lte: end },
        },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
      payments = paymentData.map(p => ({ amount: p.amount, createdAt: p.createdAt }));
    }

    const dailyData: { [key: string]: number } = {};
    let current = new Date(start);
    while (current <= end) {
      const dateStr = current.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      dailyData[dateStr] = 0;
      current.setDate(current.getDate() + 1);
    }

    payments.forEach((payment) => {
      const dateStr = new Date(payment.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      if (dailyData[dateStr] !== undefined) {
        dailyData[dateStr] += payment.amount;
      }
    });

    const result = Object.entries(dailyData).map(([date, revenue]) => ({
      date,
      revenue,
      label: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' }),
    }));

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching month analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
