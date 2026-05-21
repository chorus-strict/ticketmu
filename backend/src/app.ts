import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import ticketRoutes from './routes/ticket.routes';
import userRoutes from './routes/user.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';
import membershipRoutes from './routes/membership.routes';
import analyticsRoutes from './routes/analytics.routes';
import favoriteRoutes from './routes/favorite.routes';
import ogRoutes from './routes/og.routes';
import paymentMethodRoutes from './routes/payment-method.routes';
import webhookRoutes from './routes/webhook.routes';
import pointsRoutes from './routes/points.routes';
import organizerRoutes from './routes/organizer.routes';
import cartRoutes from './routes/cart.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/og/event', ogRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/cart', cartRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[GlobalErrorHandler]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

export default app;
