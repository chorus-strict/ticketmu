import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  CreditCard, 
  Ticket as TicketIcon, 
  Calendar,
  Users,
  Activity,
  ArrowUpRight,
  Filter,
  RefreshCcw,
  Search,
  Loader2,
  X,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { useManagement } from '../../contexts/ManagementContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import DateFilter from './DateFilter';
import { 
  formatDate, 
  getJakartaStartOfDay, 
  getJakartaEndOfDay, 
  getJakartaTodayString 
} from '../../lib/utils';

export default function Overview() {
  const { user } = useAuth();
  const { 
    users, 
    events, 
    tickets, 
    myEvents,
    organizerStats,
    organizerProfile,
    refreshData, 
    isLoading: contextLoading 
  } = useManagement();
  
  const isOrganizer = user?.role === 'ORGANIZER';
  const isAdmin = user?.role === 'ADMIN';

  // Unified Date Filter State
  const [filterValue, setFilterValue] = useState<any>({ 
    mode: 'MONTH', 
    month: getJakartaTodayString().substring(0, 7) 
  });
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    try {
      let url = '/analytics/monthly'; // Fallback
      
      if (filterValue.mode === 'MONTH' && filterValue.month) {
        url = `/analytics/month?month=${filterValue.month}`;
      } else if (filterValue.mode === 'RANGE' && (filterValue.start || filterValue.end)) {
        url = `/analytics/daily?startDate=${filterValue.start || ''}&endDate=${filterValue.end || ''}`;
      }

      const res = await api.get(url);
      setAnalyticsData(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, [filterValue]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const categories = useMemo(() => {
    const list = isOrganizer ? myEvents : events;
    return ['All', ...new Set(list.map(e => e.category))];
  }, [events, myEvents, isOrganizer]);

  // Filtering Logic
  const filteredTickets = useMemo(() => {
    const list = isOrganizer ? tickets : tickets; // Ticket management already filters for organizer in backend
    return list.filter(t => {
      const matchCategory = categoryFilter === 'All' || t.event?.category === categoryFilter;
      const tDate = new Date(t.purchasedAt);
      
      let matchDate = true;
      if (filterValue.mode === 'MONTH' && filterValue.month) {
        const [year, month] = filterValue.month.split('-').map(Number);
        const start = getJakartaStartOfDay(new Date(year, month - 1, 1));
        const end = getJakartaEndOfDay(new Date(year, month, 0));
        matchDate = tDate >= start && tDate <= end;
      } else if (filterValue.mode === 'RANGE') {
        const matchStart = !filterValue.start || tDate >= getJakartaStartOfDay(filterValue.start);
        const matchEnd = !filterValue.end || tDate <= getJakartaEndOfDay(filterValue.end);
        matchDate = matchStart && matchEnd;
      }
      
      return matchCategory && matchDate;
    });
  }, [tickets, categoryFilter, filterValue]);

  const filteredEvents = useMemo(() => {
    const list = isOrganizer ? myEvents : events;
    return list.filter(e => {
      const matchCategory = categoryFilter === 'All' || e.category === categoryFilter;
      const eDate = new Date(e.date);
      
      let matchDate = true;
      if (filterValue.mode === 'MONTH' && filterValue.month) {
        const [year, month] = filterValue.month.split('-').map(Number);
        const start = getJakartaStartOfDay(new Date(year, month - 1, 1));
        const end = getJakartaEndOfDay(new Date(year, month, 0));
        matchDate = eDate >= start && eDate <= end;
      } else if (filterValue.mode === 'RANGE') {
        const matchStart = !filterValue.start || eDate >= getJakartaStartOfDay(filterValue.start);
        const matchEnd = !filterValue.end || eDate <= getJakartaEndOfDay(filterValue.end);
        matchDate = matchStart && matchEnd;
      }
      
      return matchCategory && matchDate;
    });
  }, [events, categoryFilter, filterValue]);

  // Today specific stats (Always Jakarta Today)
  const todayStats = useMemo(() => {
    const todayStart = getJakartaStartOfDay();
    const todayEnd = getJakartaEndOfDay();
    
    const todayTickets = tickets.filter(t => {
      const d = new Date(t.purchasedAt);
      return d >= todayStart && d <= todayEnd;
    });
    
    const todayRevenue = todayTickets.reduce((sum, t) => sum + (t.event?.price || 0), 0);
    
    return {
      count: todayTickets.length,
      revenue: todayRevenue
    };
  }, [tickets]);

  // Calculations based on filtered data
  const stats = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const totalUsers = users.length;
    const totalTickets = filteredTickets.length;

    if (isOrganizer) {
      return [
        { label: 'Your Events', value: totalEvents.toString(), icon: <Calendar className="w-5 h-5" />, color: 'indigo' },
        { label: 'Today Sales', value: todayStats.count.toString(), icon: <Activity className="w-5 h-5" />, color: 'amber', sub: `Rp ${(todayStats.revenue / 1000).toFixed(0)}k revenue` },
        { label: 'Total Sold', value: totalTickets.toString(), icon: <TicketIcon className="w-5 h-5" />, color: 'rose' },
        { label: 'Revenue Share', value: `Rp ${(organizerStats?.totalRevenue || 0).toLocaleString()}`, icon: <TrendingUp className="w-5 h-5" />, color: 'emerald', sub: `Balance: Rp ${(organizerStats?.balance || 0).toLocaleString()}` },
      ];
    }

    return [
      { label: 'Platform Events', value: totalEvents.toString(), icon: <Calendar className="w-5 h-5" />, color: 'indigo' },
      { label: 'Today Sales', value: todayStats.count.toString(), icon: <Activity className="w-5 h-5" />, color: 'amber', sub: `Rp ${(todayStats.revenue / 1000).toFixed(0)}k revenue` },
      { label: 'Passes Sold', value: totalTickets.toString(), icon: <TicketIcon className="w-5 h-5" />, color: 'rose' },
      { label: 'Platform Users', value: totalUsers.toString(), icon: <Users className="w-5 h-5" />, color: 'emerald' },
    ];
  }, [filteredEvents, filteredTickets, users, todayStats, isOrganizer, organizerStats]);

  const totalRevenue = useMemo(() => {
    if (isOrganizer) return organizerStats?.totalRevenue || 0;
    return analyticsData.reduce((sum, item) => sum + item.revenue, 0);
  }, [analyticsData, isOrganizer, organizerStats]);

  // Data for Revenue (Daily or Monthly)
  const revenueChartData = useMemo(() => {
    return analyticsData.map(item => ({
      name: item.label,
      revenue: item.revenue,
      rawDate: item.date
    }));
  }, [analyticsData]);

  // Data for Events Growth (Creation Date)
  const eventsGrowthData = useMemo(() => {
    const dailyGrowth: { [key: string]: number } = {};
    filteredEvents.forEach(e => {
      const dateStr = (e.createdAt || e.date);
      const jakartaDate = new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      dailyGrowth[jakartaDate] = (dailyGrowth[jakartaDate] || 0) + 1;
    });

    // Sort by date and cumulative sum
    const sortedDates = Object.keys(dailyGrowth).sort();
    let cumulative = 0;
    return sortedDates.map(date => {
      cumulative += dailyGrowth[date];
      return { date: formatDate(date), count: cumulative };
    });
  }, [filteredEvents]);

  // Data for Category Distribution
  const categoryData = useMemo(() => {
    const distribution: { [key: string]: number } = {};
    filteredEvents.forEach(e => {
      distribution[e.category] = (distribution[e.category] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [filteredEvents]);

  // Data for Ticket Status Distribution
  const ticketStatusData = useMemo(() => {
    const distribution: { [key: string]: number } = { ACTIVE: 0, USED: 0, EXPIRED: 0, CANCELLED: 0 };
    filteredTickets.forEach(t => {
      if (t.ticketStatus) {
        distribution[t.ticketStatus] = (distribution[t.ticketStatus] || 0) + 1;
      }
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [filteredTickets]);

  // Top Events by Tickets Sold
  const topEventsData = useMemo(() => {
    const eventSales: { [key: string]: { title: string; sold: number } } = {};
    filteredTickets.forEach(t => {
      if (!t.eventId) return;
      if (!eventSales[t.eventId]) {
        eventSales[t.eventId] = { title: t.event?.title || 'Unknown', sold: 0 };
      }
      eventSales[t.eventId].sold += 1;
    });

    return Object.values(eventSales)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
      .map(item => ({ name: item.title, sold: item.sold }));
  }, [filteredTickets]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Tools */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tighter">
            {isOrganizer ? 'Organizer Hub' : 'Ecosystem Insights'}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {isOrganizer ? 'Track your event performance and earnings' : 'Platform analytics and performance metrics'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Category Filter */}
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Unified Date Filter */}
          <DateFilter 
            value={filterValue}
            onChange={setFilterValue}
          />

          <button 
            onClick={() => refreshData()}
            className="flex items-center gap-2 p-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${contextLoading ? 'animate-spin' : ''}`} />
            <span>{contextLoading ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-500/5 group">
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
              <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white mt-1 leading-none">{stat.value}</h3>
              {stat.sub && (
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">{stat.sub}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Stats Row */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Revenue Focus */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden h-full">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Platform Revenue</p>
                  <h2 className="text-5xl font-display font-black text-indigo-600 leading-none tracking-tighter italic">
                    {formatCurrency(totalRevenue)}
                  </h2>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +24.8%
                </div>
              </div>
              
              <div className="h-[300px] w-full mt-10 relative">
                {isAnalyticsLoading && (
                  <div className="absolute inset-0 z-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Updating Chart...</p>
                    </div>
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }}
                      dy={10}
                      interval="preserveStartEnd"
                      minTickGap={5}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      tickFormatter={(val) => `Rp ${(val/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-white/10">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{payload[0].payload.name}</p>
                              <p className="text-sm font-black italic">{formatCurrency(payload[0].value as number)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#6366f1" 
                      radius={[8, 8, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Inventory Growth</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eventsGrowthData}>
                  <XAxis 
                    dataKey="date" 
                    hide 
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-2xl border border-white/10">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{payload[0].payload.date}</p>
                            <p className="text-xs font-black">{payload[0].value} Events</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                  {isOrganizer ? myEvents.length : events.length}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">
                  {isOrganizer ? 'My Events' : 'Total Managed'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-emerald-500 tracking-tighter">+12%</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">vs Last Month</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
            <div className="flex items-center gap-2 mb-6">
               <Activity className="w-5 h-5 text-indigo-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">{isOrganizer ? 'Organizer Info' : 'Audience Mood'}</span>
            </div>
            {isOrganizer ? (
              <div className="space-y-6">
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Company</p>
                   <p className="text-sm font-black italic">{organizerProfile?.companyName}</p>
                </div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bank Node</p>
                   <p className="text-xs font-bold">{organizerProfile?.bankName} • {organizerProfile?.bankAccount}</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                   <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Revenue is automatically split 90/10 after each successful order approval.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pro Members</span>
                  <span className="text-xs font-black text-white">{users.filter(u => u.membership === 'PREMIUM').length}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: `${(users.filter(u => u.membership === 'PREMIUM').length / Math.max(1, users.length)) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Distribution Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Category Dist */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Category Distribution</h4>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="h-[250px] w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 w-full space-y-3">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{cat.name}</span>
                   </div>
                   <span className="text-[10px] font-black text-slate-900 dark:text-white">{cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Events */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Top Selling Events</h4>
          <div className="space-y-6">
            {topEventsData.map((event, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                   <span className="text-slate-900 dark:text-white italic truncate max-w-[200px]">{event.name}</span>
                   <span className="text-indigo-600">{event.sold} Passes</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" 
                     style={{ width: `${(event.sold / (topEventsData[0]?.sold || 1)) * 100}%` }}
                   ></div>
                </div>
              </div>
            ))}
            {topEventsData.length === 0 && (
              <div className="py-10 text-center opacity-40">
                 <TicketIcon className="w-10 h-10 mx-auto mb-2" />
                 <p className="text-[10px] font-bold uppercase tracking-widest">No ticket data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
