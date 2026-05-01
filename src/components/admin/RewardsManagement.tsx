import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Settings2, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Trophy,
  Activity,
  Plus,
  Edit2,
  Trash2,
  SwitchCamera,
  X,
  Gift
} from 'lucide-react';
import { useManagement } from '../../contexts/ManagementContext';
import { motion, AnimatePresence } from 'motion/react';

export default function RewardsManagement() {
  const { 
    rewardsConfig, 
    fetchRewardsConfig, 
    updateRewardsConfig, 
    isLoading,
    rewards,
    fetchRewards,
    addReward,
    updateReward,
    deleteReward
  } = useManagement();

  const [editingReward, setEditingReward] = useState<any>(null);
  const [isAddingReward, setIsAddingReward] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    title: '',
    pointsRequired: 10,
    type: 'DISCOUNT',
    value: 0,
    stock: 100
  });

  const resetRewardForm = () => {
    setRewardForm({
      title: '',
      pointsRequired: 10,
      type: 'DISCOUNT',
      value: 0,
      stock: 100
    });
  };

  const handleRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardForm.title) return alert('Title is required');
    
    try {
       if (editingReward) {
         await updateReward(editingReward.id, rewardForm);
       } else {
         await addReward(rewardForm);
       }
       setIsAddingReward(false);
       setEditingReward(null);
       resetRewardForm();
    } catch (err) {
       // Handled in context
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to deactivate "${title}"?`)) {
      await deleteReward(id);
    }
  };

  const [formConfig, setFormConfig] = useState({
    pointsPerOrder: 1,
    conversionRate: 10,
    isRewardsActive: true
  });

  useEffect(() => {
    fetchRewardsConfig();
    fetchRewards();
  }, [fetchRewardsConfig, fetchRewards]);

  useEffect(() => {
    if (rewardsConfig) {
      setFormConfig({
        pointsPerOrder: rewardsConfig.pointsPerOrder,
        conversionRate: rewardsConfig.conversionRate,
        isRewardsActive: rewardsConfig.isRewardsActive
      });
    }
  }, [rewardsConfig]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateRewardsConfig(formConfig);
  };

  return (
    <div className="space-y-10">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center">
                  <Coins className="w-6 h-6 text-yellow-600" />
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Engine</span>
            </div>
            <p className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase italic leading-none mb-1">
               {formConfig.pointsPerOrder} pts
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">per order completed</p>
         </div>

         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-600" />
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Value conversion</span>
            </div>
            <p className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase italic leading-none mb-1">
               1:{formConfig.conversionRate}
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Point to Rupiah ratio</p>
         </div>

         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${formConfig.isRewardsActive ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                  <Activity className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</span>
            </div>
            <p className={`text-3xl font-display font-black uppercase italic leading-none mb-1 ${formConfig.isRewardsActive ? 'text-indigo-600' : 'text-rose-600'}`}>
               {formConfig.isRewardsActive ? 'Active' : 'Offline'}
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">global loyalty system</p>
         </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Global Logic Settings */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <Settings2 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">System Logic</h2>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Points Per Order</label>
              <input 
                type="number"
                value={formConfig.pointsPerOrder}
                onChange={(e) => setFormConfig({...formConfig, pointsPerOrder: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Conversion Rate (1 Point = [X] Rp)</label>
              <input 
                type="number"
                value={formConfig.conversionRate}
                onChange={(e) => setFormConfig({...formConfig, conversionRate: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100/50">
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formConfig.isRewardsActive ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                     <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">Master Toggle</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Enable reward awarding</p>
                  </div>
               </div>
               <button 
                  type="button"
                  onClick={() => setFormConfig({...formConfig, isRewardsActive: !formConfig.isRewardsActive})}
                  className={`w-12 h-6 rounded-full transition-all relative ${formConfig.isRewardsActive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
               >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formConfig.isRewardsActive ? 'left-7' : 'left-1'}`} />
               </button>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 transition-all text-sm uppercase tracking-widest italic flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
              Save Configuration
            </button>
          </form>
        </section>

        {/* Existing Rewards List */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Voucher Lab</h2>
            </div>
            <button 
              onClick={() => {
                resetRewardForm();
                setIsAddingReward(true);
              }}
              className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all group"
            >
              <Plus className="w-5 h-5 transition-transform group-active:scale-90" />
            </button>
          </div>

          <div className="flex-1 space-y-4">
             {rewards.map((reward) => (
                <div key={reward.id} className={`p-5 border rounded-2xl flex items-center gap-4 transition-all group ${reward.isActive ? 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30' : 'border-rose-100 dark:border-rose-900/20 bg-rose-50/10 opacity-60'}`}>
                   <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                      {reward.isActive && <div className="absolute inset-0 bg-yellow-400/5 rotate-45 group-hover:scale-150 transition-transform" />}
                      <Trophy className={`w-6 h-6 relative z-10 ${reward.isActive ? 'text-yellow-600' : 'text-slate-400'}`} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black uppercase italic truncate transition-colors ${reward.isActive ? 'text-slate-900 dark:text-white group-hover:text-indigo-600' : 'text-slate-400'}`}>
                        {reward.title} {!reward.isActive && '(Deactivated)'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         {reward.pointsRequired} Points Required • {reward.stock} Left
                      </p>
                   </div>
                   <div className="flex items-center gap-1">
                      <button 
                         onClick={() => {
                           setEditingReward(reward);
                           setRewardForm({
                             title: reward.title,
                             pointsRequired: reward.pointsRequired,
                             type: reward.type,
                             value: reward.value || 0,
                             stock: reward.stock
                           });
                         }}
                         className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                         title="Edit Reward"
                      >
                         <Edit2 className="w-4 h-4" />
                      </button>
                      {reward.isActive && (
                        <button 
                           onClick={() => handleDelete(reward.id, reward.title)}
                           className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                           title="Deactivate Reward"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                   </div>
                </div>
             ))}

             {rewards.length === 0 && (
                <div className="text-center py-12 flex flex-col items-center">
                   <Zap className="w-12 h-12 text-slate-200 mb-4" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active rewards</p>
                </div>
             )}
          </div>

          <div className="mt-8 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-900/50">
             <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-indigo-400" />
                <p className="text-[9px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest leading-relaxed">
                   Reward items are immediately visible to all users with active balances.
                </p>
             </div>
          </div>
        </section>
      </div>

      {/* Add/Edit Reward Modal */}
      <AnimatePresence>
        {(isAddingReward || editingReward) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => {
                setIsAddingReward(false);
                setEditingReward(null);
                resetRewardForm();
              }}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
               <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                        <Gift className="w-5 h-5 text-indigo-600" />
                     </div>
                     <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                        {editingReward ? 'Edit Reward' : 'New Reward'}
                     </h3>
                  </div>
                  <button 
                     onClick={() => {
                        setIsAddingReward(false);
                        setEditingReward(null);
                        resetRewardForm();
                     }} 
                     className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <form onSubmit={handleRewardSubmit} className="p-8 space-y-6">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reward Title</label>
                     <input 
                        type="text"
                        required
                        value={rewardForm.title}
                        onChange={(e) => setRewardForm({...rewardForm, title: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-900 dark:text-white"
                        placeholder="e.g. 50% Off Summer Bash"
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Points Cost</label>
                        <input 
                           type="number"
                           required
                           min="1"
                           value={rewardForm.pointsRequired}
                           onChange={(e) => setRewardForm({...rewardForm, pointsRequired: parseInt(e.target.value)})}
                           className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-900 dark:text-white"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Stock</label>
                        <input 
                           type="number"
                           required
                           min="0"
                           value={rewardForm.stock}
                           onChange={(e) => setRewardForm({...rewardForm, stock: parseInt(e.target.value)})}
                           className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-900 dark:text-white"
                        />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reward Type</label>
                     <select 
                        value={rewardForm.type}
                        onChange={(e) => setRewardForm({...rewardForm, type: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-900 dark:text-white"
                     >
                        <option value="DISCOUNT">Discount Percentage</option>
                        <option value="CASHBACK">Point Cashback</option>
                        <option value="MERCHANDISE">Physical Item</option>
                        <option value="UPGRADE">Account Upgrade</option>
                     </select>
                  </div>

                  <button 
                     type="submit"
                     disabled={isLoading}
                     className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 transition-all text-sm uppercase tracking-widest italic flex items-center justify-center gap-2"
                  >
                     {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingReward ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                     {editingReward ? 'Update Reward' : 'Create Reward'}
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
