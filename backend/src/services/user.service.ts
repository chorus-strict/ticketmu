import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

class UserService {
  async getAll(page: number = 1, limit: number = 10) {
    console.log(`[UserService] Fetching users page=${page} limit=${limit}`);
    const skip = (page - 1) * limit;
    const take = limit;

    try {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            membership: true,
            membershipStatus: true,
            membershipExpiredAt: true,
            status: true,
            avatar: true,
            createdAt: true,
            points: {
              select: { balance: true }
            }
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
      ]);

      console.log(`[UserService] Successfully fetched ${users.length} users`);
      return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch (error: any) {
      console.error('[UserService] Error in getAll:', error);
      throw error;
    }
  }
  
  async getById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        membership: true,
        membershipStatus: true,
        membershipExpiredAt: true,
        status: true,
        avatar: true,
        phone: true,
        createdAt: true,
        points: {
          select: { balance: true }
        }
      },
    });
  }

  async update(id: string, data: any) {
    const updateData = { ...data };

    // Handle password hashing if provided
    if (updateData.password && updateData.password.trim() !== '') {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    // Handle email uniqueness if provided
    if (updateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: id }
        }
      });
      if (existingUser) {
        throw new Error('Email already already in use by another account');
      }
    }

    return await prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  }
}

export const userService = new UserService();
