import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  UserRole, 
  MembershipLevel,
  useAuth
} from './AuthContext';
import { CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';

export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type EventStatus = 'LIVE' | 'DRAFT' | 'ENDED';
export type EventVisibility = 'PUBLIC' | 'PREMIUM';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  membership: MembershipLevel;
  membershipStatus: MembershipLevel;
  membershipExpiredAt?: string | null;
  status: UserStatus;
  avatar: string;
  points?: { balance: number };
  password?: string;
}

export interface ManagedEvent {
  id: string;
  title: string;
  date: string;
  status: EventStatus;
  visibility: EventVisibility;
  price: number;
  capacity: number;
  sold: number;
  image: string;
  category: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  isFeatured?: boolean;
  createdAt?: string;
}

export interface CartItem {
  eventId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

export type TicketStatus = 'ACTIVE' | 'USED' | 'CANCELLED';
export type OrderStatus = 'PENDING' | 'PAID' | 'APPROVED' | 'REJECTED' | 'FAILED';

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  status: TicketStatus;
  qrCode: string;
  purchaseDate: string;
  createdAt?: string;
  event?: ManagedEvent;
}

export interface ManagedOrder {
  id: string;
  userId: string;
  eventId: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  user?: { name: string; email: string };
  event?: ManagedEvent;
  ticketId?: string;
}

export interface ManagedMembershipOrder {
  id: string;
  userId: string;
  amount: number;
  status: OrderStatus;
  expiredAt?: string | null;
  createdAt: string;
  user?: { name: string; email: string };
}

export interface ManagedPayment {
  id: string;
  userId: string;
  type: 'TICKET' | 'MEMBERSHIP';
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  referenceId?: string;
  createdAt: string;
  eventTitle?: string;
}

export interface ManagedPaymentMethod {
  id: string;
  name: string;
  type: string;
  status: boolean;
  config: any;
}

interface ManagementContextType {
  users: ManagedUser[];
  events: ManagedEvent[];
  trendingEvents: ManagedEvent[];
  cart: CartItem[];
  tickets: Ticket[];
  orders: ManagedOrder[];
  membershipOrders: ManagedMembershipOrder[];
  myMembershipOrder: ManagedMembershipOrder | null;
  paymentMethods: ManagedPaymentMethod[];
  userPoints: number;
  rewards: any[];
  myRewards: any[];
  pointLogs: any[];
  rewardsConfig: {
    pointsPerOrder: number;
    conversionRate: number;
    isRewardsActive: boolean;
  } | null;
  isLoading: boolean;
  userPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  addUser: (user: any) => Promise<void>;
  updateUser: (id: string, updates: Partial<ManagedUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  fetchUsers: (page: number, limit: number) => Promise<void>;
  addEvent: (event: Omit<ManagedEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<ManagedEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addToCart: (event: ManagedEvent) => void;
  removeFromCart: (eventId: string) => void;
  updateCartQuantity: (eventId: string, quantity: number) => void;
  checkout: (paymentMethodId?: string, userRewardId?: string) => Promise<string | undefined>;
  confirmPayment: (orderId: string) => Promise<void>;
  fetchPaymentHistory: (filters?: { startDate?: string; endDate?: string; status?: string }) => Promise<ManagedPayment[]>;
  fetchOrders: () => Promise<void>;
  requestMembershipUpgrade: (paymentMethodId?: string) => Promise<void>;
  fetchMembershipOrders: () => Promise<void>;
  fetchPaymentMethods: () => Promise<ManagedPaymentMethod[]>;
  approveMembership: (id: string) => Promise<void>;
  rejectMembership: (id: string) => Promise<void>;
  setMembershipPending: (id: string) => Promise<void>;
  confirmMembershipPayment: (id: string) => Promise<void>;
  markMembershipPaymentFailed: (id: string) => Promise<void>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  suspendUser: (id: string) => Promise<void>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  validateTicket: (qrCode: string) => Promise<{ success: boolean; message: string; ticket?: Ticket }>;
  fetchTicketsPaginated: (page: number, limit: number, filters?: { status?: string }) => Promise<{ tickets: Ticket[]; total: number; page: number; totalPages: number }>;
  searchEvents: (query: string) => Promise<ManagedEvent[]>;
  toggleFavorite: (eventId: string) => Promise<void>;
  fetchUserFavorites: () => Promise<ManagedEvent[]>;
  isFavorited: (eventId: string) => boolean;
  favoriteEventIds: Set<string>;
  backendNotifications: any[];
  fetchBackendNotifications: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  markNotificationsReadById: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  notification: string | null;
  showNotification: (msg: string) => void;
  fetchUserPoints: () => Promise<void>;
  fetchRewards: () => Promise<void>;
  fetchMyRewards: () => Promise<void>;
  fetchPointLogs: () => Promise<void>;
  redeemReward: (rewardId: string) => Promise<void>;
  adjustUserPoints: (userId: string, points: number, description: string) => Promise<void>;
  fetchRewardsConfig: () => Promise<void>;
  updateRewardsConfig: (config: any) => Promise<void>;
  addReward: (reward: any) => Promise<void>;
  updateReward: (id: string, updates: any) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const ManagementContext = createContext<ManagementContextType | undefined>(undefined);

const MOCK_EVENTS: ManagedEvent[] = [
  {
    id: 'mock-1',
    title: 'Jakarta Summer Festival (Offline)',
    date: '2024-08-24',
    status: 'LIVE',
    visibility: 'PUBLIC',
    price: 450000,
    capacity: 5000,
    sold: 3240,
    image: 'https://images.unsplash.com/photo-1459749411177-042180ceea72?auto=format&fit=crop&q=80&w=600',
    category: 'Electronic',
    description: 'The biggest summer electronic festival in Jakarta. Experience world-class DJs and immersive light shows.',
    location: 'Ancol Carnival Beach, Jakarta',
    latitude: -6.1176,
    longitude: 106.8407,
    isFeatured: true
  },
  {
    id: 'mock-2',
    title: 'Tech Connect 2024 (Offline)',
    date: '2024-09-12',
    status: 'DRAFT',
    visibility: 'PUBLIC',
    price: 250000,
    capacity: 1000,
    sold: 0,
    image: 'https://images.unsplash.com/photo-1540575861501-7ad058139a30?auto=format&fit=crop&q=80&w=600',
    category: 'Conference',
    description: 'Connect with tech leaders and innovators from across the globe. Join us for a day of inspiring talks and networking.',
    location: 'ICE BSD City, Tangerang',
    latitude: -6.3001,
    longitude: 106.6385
  }
];

export const ManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [trendingEvents, setTrendingEvents] = useState<ManagedEvent[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('tiketmu_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<ManagedOrder[]>([]);
  const [membershipOrders, setMembershipOrders] = useState<ManagedMembershipOrder[]>([]);
  const [myMembershipOrder, setMyMembershipOrder] = useState<ManagedMembershipOrder | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<ManagedPaymentMethod[]>([]);
  const [favoriteEventIds, setFavoriteEventIds] = useState<Set<string>>(new Set());
  const [backendNotifications, setBackendNotifications] = useState<any[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [rewards, setRewards] = useState<any[]>([]);
  const [myRewards, setMyRewards] = useState<any[]>([]);
  const [pointLogs, setPointLogs] = useState<any[]>([]);
  const [rewardsConfig, setRewardsConfig] = useState<any>(null);
  const isFetchingNotifications = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userPagination, setUserPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchUsers = useCallback(async (page: number, limit: number) => {
    try {
      const res = await api.get(`/users?page=${page}&limit=${limit}`);
      setUsers(res.data.users);
      setUserPagination({
        total: res.data.total,
        page: res.data.page,
        limit: res.data.limit,
        totalPages: res.data.totalPages
      });
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  const fetchTrendingEvents = useCallback(async () => {
    try {
      const res = await api.get('/events/trending');
      setTrendingEvents(res.data);
    } catch (err) {
      console.error('Failed to fetch trending events:', err);
    }
  }, []);

  const searchEvents = async (query: string) => {
    try {
      const res = await api.get(`/events/search?q=${encodeURIComponent(query)}`);
      return res.data;
    } catch (err) {
      console.error('Search failed:', err);
      return [];
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders || res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, []);

  const fetchMembershipOrders = useCallback(async () => {
    try {
      const res = await api.get('/membership/orders');
      setMembershipOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch membership orders:', err);
    }
  }, []);

  const fetchMyMembershipOrder = useCallback(async () => {
    try {
      const res = await api.get('/membership/my-request');
      setMyMembershipOrder(res.data);
    } catch (err) {
      console.error('Failed to fetch my membership request:', err);
    }
  }, []);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const res = await api.get('/payment-methods');
      setPaymentMethods(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch payment methods:', err);
      return [];
    }
  }, []);

  const requestMembershipUpgrade = async (paymentMethodId?: string) => {
    try {
      const res = await api.post('/membership/request', { paymentMethodId });
      await refreshData();
      await refreshUser();
      showNotification('Membership upgrade requested!');
      return { id: res.data.id, checkoutUrl: res.data.checkoutUrl };
    } catch (error: any) {
      console.error('Membership request failed:', error);
      showNotification(error.response?.data?.message || 'Request failed');
      throw error;
    }
  };

  const approveMembership = async (id: string) => {
    try {
      await api.post(`/membership/approve/${id}`);
      await refreshData();
      await refreshUser();
      showNotification('Membership approved!');
    } catch (error: any) {
      console.error('Membership approval failed:', error);
      showNotification(error.response?.data?.message || 'Failed to approve membership');
      throw error;
    }
  };

  const rejectMembership = async (id: string) => {
    try {
      await api.post(`/membership/reject/${id}`);
      await refreshData();
      await refreshUser();
      showNotification('Membership rejected');
    } catch (error: any) {
      console.error('Membership rejection failed:', error);
      showNotification(error.response?.data?.message || 'Failed to reject membership');
      throw error;
    }
  };

  const setMembershipPending = async (id: string) => {
    try {
      await api.post(`/membership/status/${id}`, { status: 'PENDING' });
      await refreshData();
      await refreshUser();
      showNotification('Status updated to Pending');
    } catch (error) {
      console.error('Failed to update status:', error);
      showNotification('Failed to update status');
    }
  };

  const confirmMembershipPayment = async (orderId: string, proofUrl?: string) => {
    try {
      setIsLoading(true);
      await api.post('/membership/confirm', { orderId, proofUrl });
      await refreshData();
      await refreshUser();
      showNotification('Payment confirmed! We will verify it shortly.');
    } catch (error: any) {
      console.error('Failed to confirm membership payment:', error);
      showNotification(error.response?.data?.message || 'Confirmation failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const markMembershipPaymentFailed = async (id: string) => {
    try {
      await api.post(`/membership/status/${id}`, { status: 'FAILED' });
      await refreshData();
      await refreshUser();
      showNotification('Payment marked as failed');
    } catch (error) {
      console.error('Failed to mark payment as failed:', error);
      showNotification('Failed to update status');
    }
  };

  const updateUserRole = async (id: string, role: UserRole) => {
    try {
      await api.put(`/users/${id}`, { role });
      await refreshData();
      showNotification(`Role updated to ${role}`);
    } catch (error) {
      console.error('Failed to update role:', error);
      showNotification('Failed to update role');
    }
  };

  const suspendUser = async (id: string) => {
    try {
      await api.put(`/users/${id}`, { status: 'SUSPENDED' });
      await refreshData();
      showNotification('User suspended');
    } catch (error) {
      console.error('Failed to suspend user:', error);
      showNotification('Failed to suspend user');
    }
  };

  const fetchPaymentHistory = useCallback(async (filters?: { startDate?: string; endDate?: string; status?: string }) => {
    try {
      let url = '/payments/history';
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const res = await api.get(url);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
      return [];
    }
  }, []);

  const confirmUserPayment = async (orderId: string) => {
    try {
      await api.post('/payments/confirm', { orderId });
      await refreshData();
      showNotification('Payment submitted! Waiting for admin verification.');
    } catch (error: any) {
      console.error('Payment confirmation failed:', error);
      showNotification(error.response?.data?.message || 'Confirmation failed');
      throw error;
    }
  };

  const approveOrder = async (id: string) => {
    try {
      await api.post(`/orders/${id}/approve`);
      await refreshData();
      showNotification('Order approved and ticket issued!');
    } catch (error) {
      console.error('Order approval failed:', error);
      showNotification('Failed to approve order');
      throw error;
    }
  };

  const rejectOrder = async (id: string) => {
    try {
      await api.post(`/orders/${id}/reject`);
      await refreshData();
      showNotification('Order rejected');
    } catch (error) {
      console.error('Order rejection failed:', error);
      showNotification('Failed to reject order');
      throw error;
    }
  };

  const fetchBackendNotifications = useCallback(async () => {
    if (isFetchingNotifications.current || !user) return;
    
    try {
      isFetchingNotifications.current = true;
      const res = await api.get('/notifications');
      if (Array.isArray(res.data)) {
        setBackendNotifications(res.data);
      } else {
        console.warn('Backend notifications response is not an array:', res.data);
        setBackendNotifications([]);
      }
    } catch (err: any) {
      if (err.status === 429 || err.response?.status === 429) {
        console.warn('Notification fetching rate limited (429)');
      } else {
        console.error('Failed to fetch notifications:', err);
      }
    } finally {
      isFetchingNotifications.current = false;
    }
  }, [user]);

  const markNotificationsRead = async () => {
    try {
      await api.post('/notifications/mark-read');
      setBackendNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err: any) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const markNotificationsReadById = async (id: string) => {
    try {
      await api.patch(`/notifications/read/${id}`);
      setBackendNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Optimistic update
      setBackendNotifications(prev => prev.filter(n => n.id !== id));
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.error('Delete notification failed:', err);
      // Synchronize with backend on error
      fetchBackendNotifications();
    }
  };

  const clearAllNotifications = async () => {
    try {
      // Optimistic update
      setBackendNotifications([]);
      await api.delete('/notifications');
    } catch (err) {
      console.error('Clear notifications failed:', err);
      fetchBackendNotifications();
    }
  };

  const lastFetchRef = useRef<number>(0);

  const fetchUserPoints = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/points/balance');
      setUserPoints(res.data.balance);
    } catch (err) {
      console.error('Failed to fetch user points:', err);
    }
  }, [user]);

  const fetchPointLogs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/points/logs');
      setPointLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch point logs:', err);
    }
  }, [user]);

  const fetchMyRewards = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/points/my-rewards');
      setMyRewards(res.data);
    } catch (err) {
      console.error('Failed to fetch my rewards:', err);
    }
  }, [user]);

  const fetchRewards = useCallback(async () => {
    try {
      const res = await api.get('/points/rewards');
      setRewards(res.data);
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
    }
  }, []);

  const redeemReward = async (rewardId: string) => {
    try {
      setIsLoading(true);
      await api.post('/points/redeem', { rewardId });
      showNotification('Reward redeemed successfully!');
      await Promise.all([
        fetchUserPoints(),
        fetchMyRewards(),
        fetchPointLogs(),
        fetchRewards()
      ]);
    } catch (error: any) {
      console.error('Redeem failed:', error);
      showNotification(error.response?.data?.message || 'Redeem failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const adjustUserPoints = async (userId: string, points: number, description: string) => {
    try {
      setIsLoading(true);
      await api.post('/points/adjust', { userId, points, description });
      showNotification(`Successfully ${points > 0 ? 'awarded' : 'deducted'} points`);
      await fetchUsers(userPagination.page);
    } catch (error: any) {
      console.error('Adjustment failed:', error);
      showNotification(error.response?.data?.message || 'Adjustment failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRewardsConfig = useCallback(async () => {
    try {
      const res = await api.get('/points/config');
      setRewardsConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch rewards config:', err);
    }
  }, []);

  const updateRewardsConfig = async (config: any) => {
    try {
      setIsLoading(true);
      const res = await api.patch('/points/config', config);
      setRewardsConfig(res.data);
      showNotification('Rewards system settings updated!');
    } catch (error: any) {
      console.error('Update config failed:', error);
      showNotification(error.response?.data?.message || 'Update failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addReward = async (rewardData: any) => {
    try {
      setIsLoading(true);
      await api.post('/points/rewards', rewardData);
      showNotification('Reward created successfully!');
      await fetchRewards();
    } catch (error: any) {
      console.error('Add reward failed:', error);
      showNotification(error.response?.data?.message || 'Failed to create reward');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateReward = async (id: string, updates: any) => {
    try {
      setIsLoading(true);
      await api.patch(`/points/rewards/${id}`, updates);
      showNotification('Reward updated successfully!');
      await fetchRewards();
    } catch (error: any) {
      console.error('Update reward failed:', error);
      showNotification(error.response?.data?.message || 'Failed to update reward');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReward = async (id: string) => {
    try {
      setIsLoading(true);
      await api.delete(`/points/rewards/${id}`);
      showNotification('Reward deactivated');
      await fetchRewards();
    } catch (error: any) {
      console.error('Delete reward failed:', error);
      showNotification(error.response?.data?.message || 'Failed to delete reward');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = useCallback(async () => {
    // Throttling: only refresh once every 5 seconds unless explicitly forced
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) {
      return;
    }
    lastFetchRef.current = now;

    setIsLoading(prev => prev || true);

    const loadingTimeout = setTimeout(() => {
      setEvents(prev => prev.length === 0 ? MOCK_EVENTS : prev);
      setIsLoading(false);
    }, 2000);

    try {
      const [eventsRes] = await Promise.all([
        api.get('/events').catch(err => {
          console.error('Failed to fetch events:', err);
          return { data: MOCK_EVENTS };
        }),
        fetchTrendingEvents()
      ]);
      
      setEvents(eventsRes.data);

      if (user) {
        // Only fetch if not already in progress
        if (!isFetchingNotifications.current) {
          fetchBackendNotifications();
        }
        fetchMyMembershipOrder();
        fetchUserFavorites();
        fetchPaymentMethods();
        fetchUserPoints();
      }

      if (user && user.role === 'ADMIN') {
        try {
          const ticketsRes = await api.get('/tickets?all=true');
          setTickets(ticketsRes.data.tickets || ticketsRes.data);
          await fetchUsers(1, 10);
          await fetchOrders();
          await fetchMembershipOrders();
        } catch (err) {
          console.error('Failed to fetch admin data:', err);
        }
      } else if (user) {
        try {
          const ticketsRes = await api.get('/tickets');
          setTickets(ticketsRes.data.tickets || ticketsRes.data);
          await fetchOrders();
        } catch (err) {
          console.error('Failed to fetch user tickets:', err);
        }
      }
    } catch (error) {
      console.error('General error in refreshData:', error);
      if (events.length === 0) setEvents(MOCK_EVENTS);
    } finally {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
    }
  }, [user, fetchUsers, fetchTrendingEvents, fetchBackendNotifications, fetchMyMembershipOrder]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchBackendNotifications();
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [user, fetchBackendNotifications]);

  useEffect(() => {
    localStorage.setItem('tiketmu_cart', JSON.stringify(cart));
  }, [cart]);

  const addUser = async (userData: any) => {
    try {
      await api.post('/auth/register', userData);
      await refreshData();
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<ManagedUser>) => {
    try {
      await api.put(`/users/${id}`, updates);
      await refreshData();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      await refreshData();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const addEvent = async (eventData: Omit<ManagedEvent, 'id'>) => {
    try {
      await api.post('/events', eventData);
      await refreshData();
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  };

  const updateEvent = async (id: string, updates: Partial<ManagedEvent>) => {
    try {
      await api.put(`/events/${id}`, updates);
      await refreshData();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await api.delete(`/events/${id}`);
      await refreshData();
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  const addToCart = (event: ManagedEvent) => {
    setCart(prev => {
      const existing = prev.find(item => item.eventId === event.id);
      if (existing) {
        return prev.map(item => item.eventId === event.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        eventId: event.id, 
        title: event.title, 
        price: event.price, 
        image: event.image,
        quantity: 1 
      }];
    });
    showNotification(`Added ${event.title} to cart`);
  };

  const removeFromCart = (eventId: string) => {
    setCart(prev => prev.filter(item => item.eventId !== eventId));
  };

  const updateCartQuantity = (eventId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(eventId);
      return;
    }
    setCart(prev => prev.map(item => item.eventId === eventId ? { ...item, quantity } : item));
  };

  const checkout = async (paymentMethodId?: string, userRewardId?: string) => {
    try {
      setIsLoading(true);
      let lastOrderId = '';
      let checkoutUrl = '';
      // Backend doesn't have bulk purchase yet, loop for now or add to backend
      for (const item of cart) {
        for (let i = 0; i < item.quantity; i++) {
          const res = await api.post('/tickets/purchase', { 
            eventId: item.eventId,
            paymentMethodId,
            userRewardId
          });
          lastOrderId = res.data.id;
          if (res.data.checkoutUrl) checkoutUrl = res.data.checkoutUrl;
        }
      }
      setCart([]);
      await refreshData();
      showNotification('Order created! Please proceed to payment.');
      return { orderId: lastOrderId, checkoutUrl };
    } catch (error: any) {
      console.error('Checkout error:', error);
      showNotification(error.response?.data?.message || 'Checkout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
      await api.patch(`/tickets/${id}`, updates);
      await refreshData();
      showNotification('Ticket updated successfully');
    } catch (error) {
      console.error('Error updating ticket:', error);
      showNotification('Failed to update ticket');
      throw error;
    }
  };

  const deleteTicket = async (id: string) => {
    try {
      await api.delete(`/tickets/${id}`);
      await refreshData();
      showNotification('Ticket deleted successfully');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      showNotification('Failed to delete ticket');
      throw error;
    }
  };

  const validateTicket = async (qrCode: string) => {
    try {
      const res = await api.post('/tickets/validate', { qrCode });
      await refreshData();
      return { success: true, message: res.data.message, ticket: res.data.ticket };
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      console.error('Ticket validation error:', {
        status: error.response?.status,
        message: backendMessage,
        fullError: error
      });
      return { 
        success: false, 
        message: backendMessage || error.message || 'Validation failed' 
      };
    }
  };

  const fetchUserFavorites = useCallback(async () => {
    try {
      const res = await api.get('/favorites');
      const events = res.data;
      setFavoriteEventIds(new Set(events.map((e: any) => e.id)));
      return events;
    } catch (err) {
      console.error('Fetch favorites failed:', err);
      return [];
    }
  }, []);

  const toggleFavorite = useCallback(async (eventId: string) => {
    if (!user) return;
    try {
      // Optimistic update
      setFavoriteEventIds(prev => {
        const next = new Set(prev);
        if (next.has(eventId)) next.delete(eventId);
        else next.add(eventId);
        return next;
      });
      await api.post(`/favorites/${eventId}/toggle`);
    } catch (err: any) {
      if (err.status === 429) {
        console.warn('Favorite toggle rate limited');
      } else {
        console.error('Toggle favorite failed:', err);
      }
      // Revert on error
      fetchUserFavorites();
    }
  }, [user, fetchUserFavorites]);

  const isFavorited = useCallback((eventId: string) => {
    return favoriteEventIds.has(eventId);
  }, [favoriteEventIds]);

  const fetchTicketsPaginated = async (page: number, limit: number, filters?: { status?: string }) => {
    try {
      const offset = (page - 1) * limit;
      const res = await api.get(`/tickets?limit=${limit}&offset=${offset}${filters?.status ? `&status=${filters.status}` : ''}`);
      
      const data = res.data;
      return { 
        tickets: data.tickets || [], 
        total: data.total || 0,
        page: data.page || page,
        totalPages: data.totalPages || 0
      };
    } catch (error) {
      console.error('Paginated ticket fetch failed:', error);
      return { tickets: [], total: 0, page, totalPages: 0 };
    }
  };

  return (
    <ManagementContext.Provider value={{ 
      users, 
      events, 
      trendingEvents,
      cart, 
      tickets, 
      orders,
      membershipOrders,
      myMembershipOrder,
      paymentMethods,
      isLoading,
      userPagination,
      addUser, 
      updateUser, 
      deleteUser, 
      fetchUsers,
      addEvent, 
      updateEvent, 
      deleteEvent,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      checkout,
      confirmPayment: confirmUserPayment,
      fetchPaymentHistory,
      fetchOrders,
      requestMembershipUpgrade,
      fetchMembershipOrders,
      fetchPaymentMethods,
      approveMembership,
      rejectMembership,
      setMembershipPending,
      confirmMembershipPayment,
      markMembershipPaymentFailed,
      updateUserRole,
      suspendUser,
      fetchBackendNotifications,
      markNotificationsRead,
      markNotificationsReadById,
      deleteNotification,
      clearAllNotifications,
      backendNotifications,
      approveOrder,
      rejectOrder,
      updateTicket,
      deleteTicket,
      validateTicket,
      toggleFavorite,
      fetchUserFavorites,
      isFavorited,
      favoriteEventIds,
      fetchTicketsPaginated,
      searchEvents,
      notification,
      showNotification,
      userPoints,
      rewards,
      myRewards,
      pointLogs,
      rewardsConfig,
      fetchUserPoints,
      fetchRewards,
      fetchMyRewards,
      fetchPointLogs,
      redeemReward,
      adjustUserPoints,
      fetchRewardsConfig,
      updateRewardsConfig,
      addReward,
      updateReward,
      deleteReward,
      refreshData
    }}>
      {children}
      
      {/* Global Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: -20, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[100] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm whitespace-nowrap border border-white/10"
          >
            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
    </ManagementContext.Provider>
  );
};

export const useManagement = () => {
  const context = useContext(ManagementContext);
  if (context === undefined) {
    throw new Error('useManagement must be used within a ManagementProvider');
  }
  return context;
};
