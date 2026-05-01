import { Request, Response } from 'express';
import { authService, registerSchema, loginSchema } from '../services/auth.service';
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
