import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const methods = await prisma.paymentMethod.findMany({
      where: { status: true },
      orderBy: { createdAt: 'asc' }
    });
    res.json(methods);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPaymentMethods = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const methods = await prisma.paymentMethod.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.json(methods);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { name, type, status, config, nmid, mode, qrImageUrl, provider } = req.body;

    // Validation
    if (status) {
      if (!name) throw new Error('Method name is required');
      if (type === 'qris') {
        if (mode === 'static' && !qrImageUrl && !config?.qrUrl) {
          throw new Error('Static QRIS requires QR Image URL');
        }
        if (mode === 'dynamic' && !provider) {
          throw new Error('Dynamic QRIS requires a provider');
        }
      }
      if ((type === 'va' || type === 'manual') && (!config?.accountNumber || !config?.bankName)) {
        throw new Error(`${type.toUpperCase()} missing required config`);
      }
    }

    const method = await prisma.paymentMethod.create({
      data: { name, type, status, config, nmid, mode, qrImageUrl, provider }
    });
    res.status(201).json(method);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { id } = req.params;
    const { name, type, status, config, nmid, mode, qrImageUrl, provider } = req.body;

    // Validation
    if (status) {
      if (!name) throw new Error('Method name is required to activate');
      
      if (type === 'qris') {
        if (mode === 'static' && !qrImageUrl && !config?.qrImage && !config?.qrUrl) {
          throw new Error('Static QRIS requires a valid QR Code Image URL');
        }
        if (mode === 'dynamic' && !provider) {
          throw new Error('Dynamic QRIS requires a provider');
        }
      }
      
      if ((type === 'va' || type === 'manual') && (!config?.accountNumber || !config?.bankName)) {
        throw new Error(`${type.toUpperCase()} requires Bank Name and Account Number`);
      }
      
      if (type === 'ewallet' && !config?.phone) {
        throw new Error('E-Wallet requires a registered Phone Number');
      }
      
      if (type === 'gateway' && (!config?.gatewayProvider || !config?.apiKey)) {
        throw new Error('Gateway requires Provider and API Key');
      }
    }

    const method = await prisma.paymentMethod.update({
      where: { id },
      data: { name, type, status, config, nmid, mode, qrImageUrl, provider }
    });
    res.json(method);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { id } = req.params;
    await prisma.paymentMethod.delete({ where: { id } });
    res.json({ message: 'Payment method deleted' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
