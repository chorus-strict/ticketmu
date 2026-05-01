import React, { useState } from 'react';
import { 
  Search, 
  User as UserIcon, 
  UserX, 
  UserCheck, 
  Trash2, 
  Edit, 
  Zap,
  Crown,
  Loader2,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Mail,
  Lock,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  AlertCircle,
  Coins,
  History,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useManagement, ManagedUser, UserStatus } from '../../contexts/ManagementContext';
import { UserRole, MembershipLevel } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { getAvatar } from '../../lib/utils';
import { getSupabase, BUCKET_NAME } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import api from '../../services/api';

export default function UserManagement() {
  const { users, updateUser, deleteUser, userPagination, fetchUsers, isLoading } = useManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | UserRole>('ALL');
  const [filterMembership, setFilterMembership] = useState<'ALL' | MembershipLevel>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [localLoading, setLocalLoading] = useState(false);
  const [imageSource, setImageSource] = useState<'URL' | 'UPLOAD'>('URL');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adjustingUser, setAdjustingUser] = useState<ManagedUser | null>(null);
  const [adjustmentPoints, setAdjustmentPoints] = useState<string>('0');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [viewingHistory, setViewingHistory] = useState<ManagedUser | null>(null);
  const [pointHistory, setPointHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { adjustUserPoints } = useManagement();

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    const matchesMembership = filterMembership === 'ALL' || (
      filterMembership === 'PREMIUM' ? (u.membershipExpiredAt && new Date(u.membershipExpiredAt) > new Date()) :
      filterMembership === 'PENDING' ? u.membership === 'PENDING' :
      filterMembership === 'FREE' ? (!u.membershipExpiredAt || new Date(u.membershipExpiredAt) <= new Date()) && u.membership !== 'PENDING' :
      false
    );
    const matchesStatus = filterStatus === 'ALL' || u.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesMembership && matchesStatus;
  });

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > userPagination.totalPages || newPage === currentPage) return;
    setLocalLoading(true);
    setCurrentPage(newPage);
    await fetchUsers(newPage, userPagination.limit);
    setLocalLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setLocalLoading(true);
      setErrorMessage(null);
      try {
        await updateUser(editingUser.id, editingUser);
        setEditingUser(null);
      } catch (err: any) {
        setErrorMessage(err.response?.data?.message || err.message || 'Failed to update user');
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!editingUser) return;
    
    try {
      setIsUploading(true);
      const supabase = getSupabase();
      
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      setEditingUser({ ...editingUser, avatar: publicUrl });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setErrorMessage('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admins</option>
            <option value="USER">Users</option>
          </select>

          <select 
            value={filterMembership} 
            onChange={(e) => setFilterMembership(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Membership</option>
            <option value="PREMIUM">Premium</option>
            <option value="PENDING">Pending Approval</option>
            <option value="FREE">Free</option>
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* User List */}
      <div className="space-y-3 relative">
        <AnimatePresence>
          {(localLoading || isLoading) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 inset-y-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl"
            >
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {filteredUsers.map((user) => (
          <div 
            key={user.id} 
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group ${user.status === 'SUSPENDED' ? 'opacity-60' : ''}`}
          >
            <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 border-2 border-white dark:border-slate-800 shadow-sm relative">
                <img 
                  src={getAvatar(user.avatar)} 
                  alt={user.name} 
                  className="h-full w-full object-cover" 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getAvatar(null);
                  }}
                />
                {user.status === 'SUSPENDED' && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                    <UserX className="w-5 h-5 text-white" />
                  </div>
                )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</h4>
                <div className="flex items-center gap-1">
                  {user.role === 'ADMIN' && (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded text-[8px] font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/50">Admin</span>
                  )}
                  {user.membershipExpiredAt && (
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border flex items-center gap-0.5 ${
                      new Date(user.membershipExpiredAt) > new Date()
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50'
                      : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800/50'
                    }`}>
                      <Crown className="w-2 h-2" />
                      {new Date(user.membershipExpiredAt) > new Date() ? 'Premium' : 'Expired'}
                    </span>
                  )}
                  {user.membership === 'PENDING' && (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded text-[8px] font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-0.5">
                      <Clock className="w-2 h-2" />
                      Pending
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 rounded text-[8px] font-bold uppercase tracking-widest border border-yellow-100 dark:border-yellow-800/50 flex items-center gap-1">
                    <Coins className="w-2 h-2" />
                    {user.points?.balance || 0} Points
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-slate-400 truncate">{user.email}</p>
                {user.membershipExpiredAt && (
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hidden sm:block">• Exp: {new Date(user.membershipExpiredAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setAdjustingUser(user)}
                className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-xl transition-all"
                title="Adjust Points"
              >
                <Coins className="h-4 w-4" />
              </button>
              <button 
                onClick={async () => {
                   setViewingHistory(user);
                   setHistoryLoading(true);
                   try {
                     // Since point logs usually are globally fetched in context, 
                     // for the admin we might need a specific user fetch. 
                     // But for now let's assume we can fetch them via a query or reuse
                     const res = await api.get(`/points/logs?userId=${user.id}`);
                     setPointHistory(res.data);
                   } catch (err) {
                     console.error('Failed to fetch user point history');
                   } finally {
                     setHistoryLoading(false);
                   }
                }}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                title="View History"
              >
                <History className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setEditingUser(user)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button 
                onClick={() => updateUser(user.id, { status: user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                className={`p-2 rounded-xl transition-all ${user.status === 'ACTIVE' ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-emerald-600 hover:bg-emerald-50 bg-emerald-50/50 dark:bg-emerald-900/20'}`}
                title={user.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
              >
                {user.status === 'ACTIVE' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              </button>
              <button 
                onClick={() => setIsDeletingId(user.id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No users found</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {userPagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing Page</span>
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase italic">
              {userPagination.page} of {userPagination.totalPages}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || localLoading}
              className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-50 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1 hidden sm:flex px-2">
              {[...Array(userPagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                    currentPage === i + 1 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : 'text-slate-400 hover:text-indigo-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === userPagination.totalPages || localLoading}
              className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-50 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setEditingUser(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit User</h3>
                <button onClick={() => setEditingUser(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {errorMessage && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 animate-shake">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <p className="text-xs font-bold text-rose-600">{errorMessage}</p>
                  </div>
                )}

                {/* Avatar Section */}
                <div className="space-y-3">
                   <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile Avatar</label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button 
                          type="button"
                          onClick={() => setImageSource('URL')}
                          className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${imageSource === 'URL' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                        >
                          URL
                        </button>
                        <button 
                          type="button"
                          onClick={() => setImageSource('UPLOAD')}
                          className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${imageSource === 'UPLOAD' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                        >
                          Upload
                        </button>
                      </div>
                   </div>

                   <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 relative group">
                        {isUploading && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-10">
                            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                          </div>
                        )}
                        <img 
                          src={getAvatar(editingUser.avatar)} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getAvatar(null);
                          }}
                        />
                      </div>

                      <div className="flex-1 space-y-2">
                        {imageSource === 'URL' ? (
                          <div className="relative group">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="Image URL..."
                              value={editingUser.avatar}
                              onChange={(e) => setEditingUser({ ...editingUser, avatar: e.target.value })}
                              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-full min-h-[44px] flex flex-col items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-50/30 transition-all text-slate-400"
                          >
                            <Upload className="w-4 h-4" />
                            <span className="text-[8px] font-bold uppercase tracking-tighter">Choose Image</span>
                          </button>
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        />
                      </div>
                   </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="email" 
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password (leave blank to skip)</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={editingUser.password || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label>
                    <select 
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-bold text-xs"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Membership</label>
                    <select 
                      value={editingUser.membership}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        const updates: any = { membership: val };
                        if (val === 'PREMIUM') {
                          // If admin manually sets to premium, give 30 days
                          updates.membershipExpiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                        } else if (val === 'FREE') {
                          updates.membershipExpiredAt = null;
                        }
                        setEditingUser({ ...editingUser, ...updates });
                      }}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-bold text-xs"
                    >
                      <option value="FREE">Free</option>
                      <option value="PENDING">Pending</option>
                      <option value="PREMIUM">Premium</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl active:scale-95 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={localLoading || isUploading}
                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    {localLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {isDeletingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsDeletingId(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Are you profile-sure?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8">This action is permanent. All tickets and activity for this user will be purged from existence.</p>
              
              <div className="flex gap-3">
                 <button 
                    onClick={() => setIsDeletingId(null)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl active:scale-95 transition-all text-sm"
                  >
                    Keep User
                  </button>
                  <button 
                    onClick={async () => { await deleteUser(isDeletingId); setIsDeletingId(null); }}
                    className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/20 active:scale-95 transition-all text-sm"
                  >
                    Delete Forever
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Points History Modal */}
      <AnimatePresence>
        {viewingHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setViewingHistory(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Point History</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{viewingHistory.name}</p>
                </div>
                <button onClick={() => setViewingHistory(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading history...</p>
                  </div>
                ) : pointHistory.length > 0 ? (
                  pointHistory.map((log: any) => (
                    <div key={log.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        log.type === 'EARN' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                        log.type === 'REDEEM' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                        'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
                      }`}>
                        {log.points > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{log.description}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(log.createdAt).toLocaleDateString()} • {log.type}
                        </p>
                      </div>
                      <div className={`text-sm font-black italic ${log.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {log.points > 0 ? `+${log.points}` : log.points}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No history recorded yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adjust Points Modal */}
      <AnimatePresence>
        {adjustingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setAdjustingUser(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Adjust User Points</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{adjustingUser.name}</p>
                </div>
                <button onClick={() => setAdjustingUser(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-900/30 flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-400/20 rounded-xl flex items-center justify-center shrink-0">
                    <Coins className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-yellow-700 dark:text-yellow-400 uppercase tracking-widest">Current Balance</p>
                    <p className="text-2xl font-display font-black text-yellow-800 dark:text-yellow-100 leading-none italic uppercase">
                       {adjustingUser.points?.balance || 0} pts
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Points to add/subtract</label>
                  <input 
                    type="number" 
                    value={adjustmentPoints}
                    onChange={(e) => setAdjustmentPoints(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-lg text-slate-900 dark:text-white"
                  />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Use negative values to deduct (e.g. -10)</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reason for adjustment</label>
                  <textarea 
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="E.g. Bonus for participation, Customer recovery..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                  />
                </div>

                <button 
                  onClick={async () => {
                    if (!adjustmentReason) return alert('Please enter a reason');
                    try {
                      await adjustUserPoints(adjustingUser.id, parseInt(adjustmentPoints), adjustmentReason);
                      setAdjustingUser(null);
                      setAdjustmentPoints('0');
                      setAdjustmentReason('');
                    } catch (err) {
                      // Handled in context
                    }
                  }}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest italic"
                >
                  Confirm Adjustment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
