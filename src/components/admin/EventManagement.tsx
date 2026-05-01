import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Tag, 
  Users, 
  DollarSign, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  MoreVertical,
  ChevronRight,
  Globe,
  Lock,
  CheckCircle,
  Clock,
  Archive,
  X,
  Image as ImageIcon,
  Star,
  AlertCircle,
  MapPin,
  Upload,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import { useManagement, ManagedEvent, EventStatus, EventVisibility } from '../../contexts/ManagementContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate, formatCurrency, getImageUrl } from '../../lib/utils';
import { getSupabase, BUCKET_NAME } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { getFallbackImage, syncExternalImageToSupabase, isSupabaseUrl } from '../../lib/imageSync';

import MapPicker from './MapPicker';

export default function EventManagement() {
  const { events, updateEvent, deleteEvent, addEvent } = useManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | EventStatus>('ALL');
  const [filterVisibility, setFilterVisibility] = useState<'ALL' | EventVisibility>('ALL');
  const [editingEvent, setEditingEvent] = useState<ManagedEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [imageSource, setImageSource] = useState<'URL' | 'UPLOAD'>('URL');
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const featuredCount = events.filter(e => e.isFeatured).length;

  const toggleFeatured = (event: ManagedEvent) => {
    if (!event.isFeatured && featuredCount >= 4) {
      setWarningMessage('Maximum 4 featured events allowed.');
      setTimeout(() => setWarningMessage(null), 3000);
      return;
    }
    updateEvent(event.id, { isFeatured: !event.isFeatured });
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || e.status === filterStatus;
    const matchesVisibility = filterVisibility === 'ALL' || e.visibility === filterVisibility;
    
    return matchesSearch && matchesStatus && matchesVisibility;
  });

  const getStatusIcon = (status: EventStatus) => {
    switch (status) {
      case 'LIVE': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'DRAFT': return <Clock className="w-3.5 h-3.5" />;
      case 'ENDED': return <Archive className="w-3.5 h-3.5" />;
    }
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'LIVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'DRAFT': return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case 'ENDED': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingEvent) return;

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setWarningMessage('Invalid file type. Please use JPG, PNG or WEBP.');
      setTimeout(() => setWarningMessage(null), 3000);
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      setWarningMessage('File too large. Max size is 2MB.');
      setTimeout(() => setWarningMessage(null), 3000);
      return;
    }

    try {
      setIsUploading(true);
      const supabase = getSupabase();
      
      if (!supabase) {
        throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `posters/${fileName}`;

      // 1. Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      // 3. Update the temporary state for the modal preview
      setEditingEvent({ ...editingEvent, image: publicUrl });
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      setWarningMessage(error.message || 'Image upload failed.');
      setTimeout(() => setWarningMessage(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      let finalImage = editingEvent.image;

      // Ensure valid image and stored in Supabase if possible
      if (!finalImage || finalImage.includes('placeholder')) {
        finalImage = getFallbackImage(editingEvent.category);
      }

      // If it's a URL but not a Supabase URL, try to sync it
      if (imageSource === 'URL' && !isSupabaseUrl(finalImage)) {
        setIsUploading(true);
        try {
          finalImage = await syncExternalImageToSupabase(finalImage, editingEvent.category);
        } finally {
          setIsUploading(false);
        }
      }

      const updatedEvent = { ...editingEvent, image: finalImage };

      if (isCreating) {
        // @ts-ignore
        addEvent(updatedEvent);
      } else {
        updateEvent(updatedEvent.id, updatedEvent);
      }
      setEditingEvent(null);
      setIsCreating(false);
    }
  };

  const syncAllImagesToSupabase = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setWarningMessage('Starting image synchronization...');
    
    let successCount = 0;
    try {
      for (const event of events) {
        if (!isSupabaseUrl(event.image)) {
          const syncedUrl = await syncExternalImageToSupabase(event.image, event.category);
          if (syncedUrl !== event.image) {
            await updateEvent(event.id, { image: syncedUrl });
            successCount++;
          }
        }
      }
      setWarningMessage(`Synced ${successCount} images to Supabase.`);
    } catch (err) {
      console.error('Migration failed:', err);
      setWarningMessage('Some images failed to sync.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setWarningMessage(null), 3000);
    }
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingEvent({
      id: '',
      title: '',
      date: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      visibility: 'PUBLIC',
      price: 0,
      capacity: 0,
      sold: 0,
      image: 'https://images.unsplash.com/photo-1459749411177-042180ceea72?auto=format&fit=crop&q=80&w=800',
      category: 'Other',
      description: '',
      location: '',
      latitude: -6.2088,
      longitude: 106.8456,
      isFeatured: false
    });
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
           <input 
              type="text" 
              placeholder="Filter inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-sm"
           />
        </div>
        <div className="flex gap-2">
            <button 
              onClick={syncAllImagesToSupabase}
              disabled={isSyncing}
              className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-center gap-2 disabled:opacity-50"
              title="Ensure all images are hosted on Supabase Storage"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span className="hidden sm:inline">Sync All Asset Images</span>
            </button>
            <button 
              onClick={openCreateModal}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Event</span>
            </button>
        </div>
      </div>

       {/* Warning Toast */}
       <AnimatePresence>
        {warningMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-amber-100 border border-amber-200 text-amber-700 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm"
          >
            <AlertCircle className="w-5 h-5 text-amber-500" />
            {warningMessage}
          </motion.div>
        )}
       </AnimatePresence>

       {/* Filters */}
       <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
          {['ALL', 'LIVE', 'DRAFT', 'ENDED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold tracking-widest transition-all border whitespace-nowrap active:scale-95 ${
                filterStatus === status 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {status}
            </button>
          ))}
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2 self-center" />
          {['ALL', 'public', 'premium'].map((vis) => (
            <button
              key={vis}
              onClick={() => setFilterVisibility(vis as any)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold tracking-widest transition-all border whitespace-nowrap active:scale-95 uppercase ${
                filterVisibility === vis 
                  ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {vis}
            </button>
          ))}
        </div>

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((event) => (
          <div key={event.id} className="premium-card bg-white dark:bg-slate-900 overflow-hidden flex border border-slate-200 dark:border-slate-800 group hover:border-indigo-400 transition-colors">
            <div className="w-24 shrink-0 relative">
              <img 
                src={getImageUrl(event.image, event.category)} 
                alt={event.title} 
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getImageUrl(null, event.category);
                }}
              />
              <div className="absolute top-2 left-2">
                 {event.visibility === 'premium' ? (
                   <div className="p-1 bg-amber-400 text-slate-900 rounded-lg shadow-lg">
                      <Lock className="w-3 h-3" />
                   </div>
                 ) : (
                   <div className="p-1 bg-white/80 backdrop-blur-sm text-slate-600 rounded-lg shadow-lg">
                      <Globe className="w-3 h-3" />
                   </div>
                 )}
              </div>
            </div>
            
            <div className="p-4 flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate pr-4">{event.title}</h4>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold tracking-widest uppercase border flex items-center gap-1 shrink-0 ${getStatusColor(event.status)}`}>
                      {getStatusIcon(event.status)}
                      {event.status}
                    </span>
                    {event.isFeatured && (
                      <span className="px-2 py-0.5 bg-amber-500 text-white rounded-lg text-[7px] font-bold tracking-widest uppercase flex items-center gap-0.5">
                        <Star className="w-2 h-2 fill-current" />
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-3">
                  <Tag className="w-3 h-3" />
                  {event.category}
                </div>
                
                <div className="flex gap-4">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pricing</span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(event.price)}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Attendance</span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">{event.sold} / {event.capacity}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date</span>
                      <span className="text-xs font-extrabold text-indigo-600 underline decoration-indigo-200 underline-offset-2">{formatDate(event.date)}</span>
                   </div>
                   <div className="flex flex-col max-w-[80px]">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Location</span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate" title={event.location}>{event.location}</span>
                   </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                <button 
                  onClick={() => toggleFeatured(event)}
                  className={`p-2 transition-all rounded-xl ${event.isFeatured ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                  title={event.isFeatured ? 'Remove from Featured' : 'Set as Featured'}
                >
                  <Star className={`h-4 w-4 ${event.isFeatured ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={() => setEditingEvent(event)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => updateEvent(event.id, { status: event.status === 'LIVE' ? 'DRAFT' : 'LIVE' })}
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                  title={event.status === 'LIVE' ? 'Set as Draft' : 'Publish Live'}
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setShowConfirmDelete(event.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Event Modal */}
      <AnimatePresence>
        {editingEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => { setEditingEvent(null); setIsCreating(false); }}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            >
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{isCreating ? 'Create New Event' : 'Edit Event Inventory'}</h3>
                <button onClick={() => { setEditingEvent(null); setIsCreating(false); }} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-none">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Event Title</label>
                    <input 
                      type="text" 
                      required
                      value={editingEvent.title}
                      onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                        <select 
                          value={editingEvent.category}
                          onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none font-bold text-xs"
                        >
                          <option value="Electronic">Electronic</option>
                          <option value="Conference">Conference</option>
                          <option value="Comedy">Comedy</option>
                          <option value="Networking">Networking</option>
                          <option value="Music">Music</option>
                          <option value="Sports">Sports</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Event Date</label>
                        <div className="relative group">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 pointer-events-none transition-colors" />
                          <input 
                            type="date" 
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={editingEvent.date}
                            onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-bold text-xs appearance-none custom-date-input"
                          />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 ml-1 uppercase tracking-widest italic">
                          Selected: {formatDate(editingEvent.date) || 'None'}
                        </p>
                    </div>
                 </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 pointer-events-none transition-colors" />
                        <input 
                          type="text" 
                          required
                          value={editingEvent.location}
                          readOnly
                          onClick={() => setShowMapPicker(true)}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-bold text-xs cursor-pointer group-hover:bg-slate-100 dark:group-hover:bg-slate-700"
                          placeholder="Tap to select location on map..."
                        />
                        <button 
                          type="button"
                          onClick={() => setShowMapPicker(true)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-600/20 active:scale-90 transition-all"
                        >
                           <Search className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {(editingEvent.latitude && editingEvent.longitude) && (
                      <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 ml-1 uppercase tracking-widest italic">
                        Coordinates: {editingEvent.latitude.toFixed(4)}, {editingEvent.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Brief Description</label>
                    <textarea 
                      required
                      rows={3}
                      value={editingEvent.description}
                      onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-bold text-xs resize-none"
                      placeholder="Describe the event experience..."
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Price (IDR)</label>
                        <input 
                          type="number" 
                          required
                          value={editingEvent.price}
                          onChange={(e) => setEditingEvent({ ...editingEvent, price: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none font-bold text-xs"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Total Capacity</label>
                        <input 
                          type="number" 
                          required
                          value={editingEvent.capacity}
                          onChange={(e) => setEditingEvent({ ...editingEvent, capacity: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none font-bold text-xs"
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
                        <select 
                          value={editingEvent.status}
                          onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as any })}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none font-bold text-xs"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="LIVE">Live</option>
                          <option value="ENDED">Ended</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Visibility</label>
                        <select 
                          value={editingEvent.visibility}
                          onChange={(e) => setEditingEvent({ ...editingEvent, visibility: e.target.value as any })}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none font-bold text-xs"
                        >
                          <option value="PUBLIC">Public</option>
                          <option value="PREMIUM">Premium</option>
                        </select>
                    </div>
                 </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Poster</label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                         <button 
                          type="button" 
                          onClick={() => setImageSource('URL')}
                          className={`px-3 py-1 text-[8px] font-bold uppercase tracking-tight rounded-md transition-all ${imageSource === 'URL' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           URL
                         </button>
                         <button 
                          type="button"
                          onClick={() => setImageSource('UPLOAD')}
                          className={`px-3 py-1 text-[8px] font-bold uppercase tracking-tight rounded-md transition-all ${imageSource === 'UPLOAD' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           Upload
                         </button>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 items-start">
                       <div className="flex-1">
                         {imageSource === 'URL' ? (
                           <div className="relative group">
                              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 pointer-events-none transition-colors" />
                              <input 
                                type="text" 
                                value={editingEvent.image.startsWith('data:') ? '' : editingEvent.image}
                                onChange={(e) => setEditingEvent({ ...editingEvent, image: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-bold text-xs"
                                placeholder="https://example.com/image.jpg"
                              />
                           </div>
                         ) : (
                           <div 
                              onClick={() => !isUploading && fileInputRef.current?.click()}
                              className={`w-full h-[46px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-3 transition-all group ${isUploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                           >
                              {isUploading ? (
                                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                              )}
                              <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors uppercase tracking-widest">
                                {isUploading ? 'Uploading to Supabase...' : (editingEvent.image.includes('supabase.co') ? 'Change Selected File' : 'Click to Upload Asset')}
                              </span>
                              <input 
                                ref={fileInputRef}
                                type="file" 
                                className="hidden" 
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                              />
                           </div>
                         )}
                       </div>
                       
                       <div className="w-12 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 shadow-sm">
                          <img 
                            src={getImageUrl(editingEvent.image, editingEvent.category)} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getImageUrl(null, editingEvent.category);
                            }}
                          />
                       </div>
                    </div>
                    {editingEvent.image.includes('supabase.co') && imageSource === 'UPLOAD' && (
                      <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 ml-1 uppercase tracking-widest italic mt-1.5 flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" />
                        Asset synchronized with Supabase Storage
                      </p>
                    )}
                 </div>

                 <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => { setEditingEvent(null); setIsCreating(false); }}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl active:scale-95 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all text-sm"
                  >
                    {isCreating ? 'Launch Event' : 'Commit Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation */}
      <AnimatePresence>
        {showConfirmDelete && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
               onClick={() => setShowConfirmDelete(null)}
             />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-8 text-center"
             >
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Trash2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Inventory?</h3>
                <p className="text-slate-500 font-medium text-sm mb-8">This will delete the event and its associated ticket data permanently. This cannot be undone.</p>
                <div className="flex gap-3">
                   <button onClick={() => setShowConfirmDelete(null)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold rounded-xl active:scale-95 transition-all">Keep</button>
                   <button onClick={() => { deleteEvent(showConfirmDelete); setShowConfirmDelete(null); }} className="flex-1 py-3.5 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 active:scale-95 transition-all">Yes, Delete</button>
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
      {/* Map Picker Modal */}
      <AnimatePresence>
        {showMapPicker && editingEvent && (
          <MapPicker 
            initialLat={editingEvent.latitude}
            initialLng={editingEvent.longitude}
            onSelect={(loc) => {
              setEditingEvent({
                ...editingEvent,
                location: loc.address,
                latitude: loc.lat,
                longitude: loc.lng
              });
              setShowMapPicker(false);
            }}
            onClose={() => setShowMapPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
