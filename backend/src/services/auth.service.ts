import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

class AuthService {
  async register(data: z.infer<typeof registerSchema>) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email sudah terdaftar');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });

    const token = this.generateToken(user.id, user.role);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(data: z.infer<typeof loginSchema>) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Email belum terdaftar');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Password salah');
    }

    const token = this.generateToken(user.id, user.role);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  private generateToken(id: string, role: string) {
    return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' });
  }
}

export const authService = new AuthService();
