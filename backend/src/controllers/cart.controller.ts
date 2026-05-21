import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { orderService } from '../services/order.service';

export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            ticketTiers: true,
          },
        },
        ticketTier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(cartItems);
  } catch (error: any) {
    console.error('ERROR [CartController.getCart]:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch cart' });
  }
};

export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { eventId, ticketTierId, quantity = 1 } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    // Verify Event exists and capacity
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTiers: true },
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Validate ticket purchase limit
    try {
      await orderService.checkTicketLimit(userId, eventId, quantity);
    } catch (limitErr: any) {
      return res.status(400).json({ message: limitErr.message });
    }

    // Check visibility restriction
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, membership: true },
    });
    if (!dbUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPrivileged = dbUser.membership === 'PREMIUM' || dbUser.role === 'ORGANIZER' || dbUser.role === 'ADMIN';
    if (event.visibility === 'PREMIUM' && !isPrivileged) {
      return res.status(403).json({ message: 'This premium event is restricted to Elite Members only.' });
    }

    let priceSnapshot = event.price;

    // Verify Tier if provided
    if (ticketTierId) {
      const tier = event.ticketTiers.find((t) => t.id === ticketTierId);
      if (!tier) {
        return res.status(404).json({ message: 'Valid package or ticket tier not found' });
      }
      if (tier.sold >= tier.quantity) {
        return res.status(400).json({ message: 'Selected package is sold out' });
      }
      priceSnapshot = tier.price;
    } else {
      // Check general ticket capacity (excluding tiered sold counts)
      const soldCount = await prisma.ticket.count({
        where: { eventId, ticketTierId: null },
      });
      if (soldCount >= event.capacity) {
        return res.status(400).json({ message: 'Event tickets are sold out' });
      }
    }

    // Find if item already exists in cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        eventId,
        ticketTierId: ticketTierId || null,
      },
    });

    let result;
    if (existingCartItem) {
      result = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
          priceSnapshot, // Update latest price snapshot
        },
        include: { event: true, ticketTier: true },
      });
    } else {
      result = await prisma.cartItem.create({
        data: {
          userId,
          eventId,
          ticketTierId: ticketTierId || null,
          quantity,
          priceSnapshot,
        },
        include: { event: true, ticketTier: true },
      });
    }

    res.status(201).json(result);
  } catch (error: any) {
    console.error('ERROR [CartController.addToCart]:', error);
    res.status(400).json({ message: error.message || 'Failed to add item to cart' });
  }
};

export const updateCartItemQuantity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ message: 'Quantity is required' });
    }

    if (quantity <= 0) {
      // If quantity is 0 or negative, remove the item
      await prisma.cartItem.deleteMany({
        where: { id, userId },
      });
      return res.json({ success: true, message: 'Item removed from cart' });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id, userId },
      include: { event: { include: { ticketTiers: true } } },
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Validate ticket purchase limit
    try {
      await orderService.checkTicketLimit(userId, cartItem.eventId, quantity, { excludeCartItemIds: [id] });
    } catch (limitErr: any) {
      return res.status(400).json({ message: limitErr.message });
    }

    // Stock verification
    if (cartItem.ticketTierId) {
      const tier = cartItem.event.ticketTiers.find((t) => t.id === cartItem.ticketTierId);
      if (tier && tier.sold + quantity > tier.quantity) {
        return res.status(400).json({
          message: `Cannot request ${quantity} tickets. Only ${tier.quantity - tier.sold} packages remain available.`,
        });
      }
    } else {
      const generalSoldCount = await prisma.ticket.count({
        where: { eventId: cartItem.eventId, ticketTierId: null },
      });
      if (generalSoldCount + quantity > cartItem.event.capacity) {
        return res.status(400).json({
          message: `Cannot request ${quantity} tickets. Only ${cartItem.event.capacity - generalSoldCount} tickets remain.`,
        });
      }
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: { event: true, ticketTier: true },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('ERROR [CartController.updateQuantity]:', error);
    res.status(400).json({ message: error.message || 'Failed to update quantity' });
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await prisma.cartItem.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('ERROR [CartController.removeFromCart]:', error);
    res.status(400).json({ message: error.message || 'Failed to remove from cart' });
  }
};

export const checkoutFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { paymentMethodId, userRewardId } = req.body;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { event: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // 1. Validate total ticket purchase limits for each event in the cart
    const eventQuantities: Record<string, number> = {};
    for (const item of cartItems) {
      eventQuantities[item.eventId] = (eventQuantities[item.eventId] || 0) + item.quantity;
    }

    for (const [eventId, qty] of Object.entries(eventQuantities)) {
      try {
        await orderService.checkTicketLimit(userId, eventId, qty, { excludeCartItemsForThisEvent: true });
      } catch (limitErr: any) {
        return res.status(400).json({ message: limitErr.message });
      }
    }

    let lastOrderId = '';
    let checkoutUrl = '';

    // Create order for each item & quantity
    // Using a transactional or sequential approach to keep order service intact
    for (const item of cartItems) {
      for (let q = 0; q < item.quantity; q++) {
        const order = await orderService.create(
          userId,
          item.eventId,
          item.ticketTierId || undefined,
          paymentMethodId,
          userRewardId,
          true // bypassLimitCheck is true since we already pre-validated the entire cart quantity
        );
        lastOrderId = order.id;
        if ((order as any).checkoutUrl) {
          checkoutUrl = (order as any).checkoutUrl;
        }
      }
    }

    // Clear cart in DB
    await prisma.cartItem.deleteMany({
      where: { userId },
    });

    res.json({ orderId: lastOrderId, checkoutUrl, success: true });
  } catch (error: any) {
    console.error('ERROR [CartController.checkoutFromCart]:', error);
    res.status(400).json({ message: error.message || 'Checkout failed' });
  }
};
