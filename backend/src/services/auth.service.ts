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

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
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

  async forgotPassword(data: z.infer<typeof forgotPasswordSchema>, protocolAndHost: string) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Email belum terdaftar');
    }

    // Generate a reset token valid for 1 hour
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetUrl = `${protocolAndHost}/reset-password?token=${resetToken}`;

    return {
      message: 'Reset link generated successfully',
      resetToken,
      resetUrl,
      // For AI Studio environment to test seamlessly:
      simulatedEmail: {
        to: user.email,
        subject: 'Reset Password Protocol - TIKETMU',
        html: `
          <div style="font-family: sans-serif; background-color: #020617; color: #f8fafc; padding: 40px; border-radius: 20px;">
            <h2 style="color: #4f46e5; text-transform: uppercase; font-style: italic;">TIKETMU PROTOCOL RESET</h2>
            <p>Hello ${user.name},</p>
            <p>We received a request to initialize password override classification for your user account.</p>
            <p>Please click the link below to configure your new cipher credentials:</p>
            <p style="margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase;">RESET PASSWORD</a>
            </p>
            <p style="font-size: 11px; color: #64748b;">The reset link will expire in 1 hour. If you did not request this, please disregard this email.</p>
          </div>
        `
      }
    };
  }

  async resetPassword(data: z.infer<typeof resetPasswordSchema>) {
    try {
      const decoded = jwt.verify(data.token, JWT_SECRET) as { userId: string; purpose?: string };
      
      if (decoded.purpose !== 'password_reset') {
        throw new Error('Invalid token purpose');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      });

      const { password, ...userWithoutPassword } = user;
      return { 
        success: true, 
        message: 'Password as user credentials has been reset successfully',
        user: userWithoutPassword 
      };
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new Error('Auth Reset link has expired. Please initiate forgot password protocol again.');
      }
      throw new Error(err.message || 'Invalid or tampered reset link.');
    }
  }

  private generateToken(id: string, role: string) {
    return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' });
  }
}

export const authService = new AuthService();
