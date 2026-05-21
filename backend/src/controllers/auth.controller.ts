import { Request, Response } from 'express';
import { authService, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../services/auth.service';
import { z } from 'zod';

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.register(validatedData);
    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    }
    const status = error.message === 'Email sudah terdaftar' ? 409 : 400;
    res.status(status).json({ message: error.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData);
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    }
    
    if (error.message === 'Email belum terdaftar' || error.message === 'Password salah' || error.message === 'Invalid credentials') {
      return res.status(401).json({ message: error.message });
    }

    console.error('Login error detail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    
    // Resolve frontend URL dynamically
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const protocolAndHost = `${protocol}://${host}`;

    const result = await authService.forgotPassword(validatedData, protocolAndHost);
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    }
    const status = error.message === 'Email belum terdaftar' ? 404 : 400;
    res.status(status).json({ message: error.message || 'Forgot password failed' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(validatedData);
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    }
    res.status(400).json({ message: error.message || 'Reset password failed' });
  }
};
