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
  Gift,
  Tag,
  Ticket
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
                value={isNaN(formConfig.pointsPerOrder) ? '' : formConfig.pointsPerOrder}
                onChange={(e) => setFormConfig({...formConfig, pointsPerOrder: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Conversion Rate (1 Point = [X] Rp)</label>
              <input 
                type="number"
                value={isNaN(formConfig.conversionRate) ? '' : formConfig.conversionRate}
                onChange={(e) => setFormConfig({...formConfig, conversionRate: parseInt(e.target.value) || 0})}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" 
              onClick={() => {
                setIsAddingReward(false);
                setEditingReward(null);
                resetRewardForm();
              }}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80 z-10 flex flex-col max-h-[90vh] lg:max-h-[85vh]"
            >
              {/* Layout body grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
                
                {/* Left Area: Modern Form */}
                <form onSubmit={handleRewardSubmit} className="lg:col-span-7 p-6 sm:p-10 space-y-6 sm:space-y-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800/60">
                  
                  {/* Form Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">Campaign Controller Desk</p>
                      <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                        {editingReward ? 'Edit Campaign Reward' : 'New Campaign Reward'}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        Configure premium high-incentive programmatic assets to drive user action.
                      </p>
                    </div>
                  </div>

                  {/* Form Section A: Basic Info */}
                  <div className="space-y-5">
                    <div className="border-l-2 border-indigo-500 pl-3">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">A. Basic Information</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Define general attributes & catalog details.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reward Title</label>
                      <input 
                        type="text"
                        required
                        value={rewardForm.title}
                        onChange={(e) => setRewardForm({...rewardForm, title: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all text-sm"
                        placeholder="e.g. VIP Gold Ticket Voucher, 50k Cashback..."
                      />
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium ml-1">Create an engaging title explaining exactly what the user receives.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reward Classification Type</label>
                      
                      {/* Tactile Segmented Selector */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
                        {[
                          { id: 'DISCOUNT', label: 'Discount', desc: 'Deduction', icon: Tag },
                          { id: 'VOUCHER', label: 'Voucher', desc: 'Promo Code', icon: Ticket },
                          { id: 'CASH', label: 'Cashback', desc: 'Refund Bonus', icon: Coins },
                          { id: 'MERCHANDISE', label: 'Merch', desc: 'Physical Gem', icon: Gift }
                        ].map((typeItem) => {
                          const IconComponent = typeItem.icon;
                          const isSelected = rewardForm.type === typeItem.id;
                          return (
                            <button
                              key={typeItem.id}
                              type="button"
                              onClick={() => setRewardForm({...rewardForm, type: typeItem.id})}
                              className={`p-3 border text-left rounded-2xl transition-all duration-300 relative overflow-hidden group flex flex-col gap-1.5 ${
                                isSelected 
                                  ? 'border-indigo-500 bg-indigo-500/[0.05] dark:bg-indigo-500/[0.08] ring-2 ring-indigo-500/25 dark:ring-indigo-500/15' 
                                  : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                              }`}
                            >
                              <div className="flex items-center justify-between pointer-events-none">
                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${
                                  isSelected 
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                }`}>
                                  <IconComponent className="w-3.5 h-3.5" />
                                </div>
                              </div>
                              <div className="mt-1 pointer-events-none">
                                <p className={`text-[11px] font-black uppercase tracking-wider ${
                                  isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'
                                }`}>
                                  {typeItem.label}
                                </p>
                                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5 truncate">
                                  {typeItem.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Form Section B: Reward Config */}
                  <div className="space-y-5">
                    <div className="border-l-2 border-indigo-500 pl-3">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">B. Campaign Logistics</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Fine-tune financial token requirements and caps.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      {/* Points Cost */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Points Cost</label>
                        <input 
                          type="number"
                          required
                          min="1"
                          value={isNaN(rewardForm.pointsRequired) ? '' : rewardForm.pointsRequired}
                          onChange={(e) => setRewardForm({...rewardForm, pointsRequired: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-900 dark:text-white text-sm"
                        />
                        <p className="text-[8px] text-slate-400 dark:text-slate-500 font-medium ml-1">Exchange balance ticket.</p>
                      </div>

                      {/* Stock */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Cap</label>
                        <input 
                          type="number"
                          required
                          min="0"
                          value={isNaN(rewardForm.stock) ? '' : rewardForm.stock}
                          onChange={(e) => setRewardForm({...rewardForm, stock: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-900 dark:text-white text-sm"
                        />
                        <p className="text-[8px] text-slate-400 dark:text-slate-500 font-medium ml-1">Available inventory limit.</p>
                      </div>

                      {/* Value (Rp) */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal Value (Rp)</label>
                        <input 
                          type="number"
                          min="0"
                          required
                          value={isNaN(rewardForm.value) ? '' : rewardForm.value}
                          onChange={(e) => setRewardForm({...rewardForm, value: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-900 dark:text-white text-sm"
                          placeholder="e.g. 50000"
                        />
                        <p className="text-[8px] text-slate-400 dark:text-slate-500 font-medium ml-1">Monetary equivalence.</p>
                      </div>
                    </div>
                  </div>

                  {/* Submit and Cancel Grid */}
                  <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAddingReward(false);
                        setEditingReward(null);
                        resetRewardForm();
                      }}
                      className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-sm transition-all text-center uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 transition-all text-sm uppercase tracking-widest italic flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingReward ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingReward ? 'Update Set' : 'Deploy Set'}
                    </button>
                  </div>
                </form>

                {/* Right Area: Holographic Live Preview */}
                <div className="lg:col-span-5 p-8 sm:p-10 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-center items-center gap-6 border-l border-slate-100 dark:border-slate-800/40 relative min-h-[400px]">
                  
                  {/* Accent design headers */}
                  <div className="absolute top-6 left-8 right-8 flex justify-between items-center pointer-events-none hidden lg:flex">
                     <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Real-Time Core Feed</span>
                     <div className="flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">WIDGET_LIVE</span>
                     </div>
                  </div>

                  {/* Neon Glowing Hologram Card */}
                  <div className="w-full max-w-[280px] sm:max-w-xs relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800/85 rounded-[2rem] p-6 overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] dark:shadow-indigo-950/25 group transition-all duration-500">
                    
                    {/* Hologram Gradient mesh grids */}
                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-yellow-500/5 blur-2xl rounded-full pointer-events-none" />
                    
                    {/* Top Type indicator & badge */}
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="w-10 h-10 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner">
                        {rewardForm.type === 'DISCOUNT' && <Tag className="w-5 h-5 text-indigo-400" />}
                        {rewardForm.type === 'VOUCHER' && <Ticket className="w-5 h-5 text-emerald-400" />}
                        {rewardForm.type === 'CASH' && <Coins className="w-5 h-5 text-amber-400" />}
                        {rewardForm.type === 'MERCHANDISE' && <Gift className="w-5 h-5 text-rose-400" />}
                      </div>

                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border shadow-sm ${
                        rewardForm.type === 'DISCOUNT' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' :
                        rewardForm.type === 'VOUCHER' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                        rewardForm.type === 'CASH' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}>
                        {rewardForm.type}
                      </span>
                    </div>

                    {/* Reward description & titles */}
                    <div className="space-y-1.5 mb-10 relative z-10">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 leading-none">PROGRAMMABLE CAMPAIGN TICKET</p>
                      <h4 className="text-xl font-display font-black text-white uppercase italic tracking-tight leading-snug line-clamp-2 min-h-[3rem] group-hover:text-indigo-200 transition-colors">
                        {rewardForm.title ? rewardForm.title.trim() : 'UNTITLED REWARD ASSET'}
                      </h4>
                    </div>

                    {/* Dotted border ticket style divider */}
                    <div className="relative border-t border-dashed border-slate-800/80 my-5 -mx-6 h-px pointer-events-none">
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-slate-100 dark:bg-slate-900 border border-slate-800/80 rounded-full" />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-slate-100 dark:bg-slate-900 border border-slate-800/80 rounded-full" />
                    </div>

                    {/* Specs values details rows */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4 relative z-10">
                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Exchange Cost</p>
                        <p className="text-sm font-display font-black text-yellow-500 uppercase italic">
                          {rewardForm.pointsRequired > 0 ? `${rewardForm.pointsRequired.toLocaleString()} PTS` : 'FREE'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Benefit Value</p>
                        <p className="text-sm font-display font-black text-white uppercase italic">
                          {rewardForm.value > 0 ? `Rp ${rewardForm.value.toLocaleString('id-ID')}` : 'COMPLIMENTS'}
                        </p>
                      </div>

                      <div className="col-span-2 pt-2 border-t border-slate-800/60">
                        <div className="flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-widest">
                          <span>Inventory Stock Status</span>
                          <span className={`${rewardForm.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {rewardForm.stock > 0 ? `${rewardForm.stock} available` : 'OUT OF STOCK'}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-950 rounded-full mt-2.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${rewardForm.stock > 10 ? 'bg-emerald-500' : rewardForm.stock > 0 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(100, Math.max(rewardForm.stock > 0 ? 5 : 0, (rewardForm.stock / 200) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* UI guidelines footer message */}
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500/80 text-center max-w-[200px] leading-relaxed select-none">
                    Preview represents visual typography pairs deployed onto active customer reward terminals.
                  </span>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
