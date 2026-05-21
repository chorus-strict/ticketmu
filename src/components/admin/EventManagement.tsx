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
import { EVENT_CATEGORIES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

import MapPicker from './MapPicker';

export default function EventManagement() {
  const { user } = useAuth();
  const { events: allEvents, myEvents, updateEvent, deleteEvent, addEvent } = useManagement();
  
  const isOrganizer = user?.role === 'ORGANIZER';
  const events = isOrganizer ? myEvents : allEvents;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | EventStatus>('ALL');
  const [filterVisibility, setFilterVisibility] = useState<'ALL' | EventVisibility>('ALL');
  const [filterFeatured, setFilterFeatured] = useState<'ALL' | 'FEATURED' | 'NORMAL'>('ALL');
  const [editingEvent, setEditingEvent] = useState<ManagedEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [imageSource, setImageSource] = useState<'URL' | 'UPLOAD'>('URL');
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [venueName, setVenueName] = useState('');
  const [cityName, setCityName] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('22:00');
  const [timezone, setTimezone] = useState('WIB');
  const [tagsText, setTagsText] = useState('');

  // Helper inside component to format location parts
  const parseLocationString = (locStr: string) => {
    let venue = '';
    let city = '';
    let address = locStr || '';

    if (locStr) {
      const bracketMatch = locStr.match(/^([^\(]+)\s*\(([^\)]+)\)$/);
      if (bracketMatch) {
        city = bracketMatch[1].trim();
        venue = bracketMatch[2].trim();
      } else {
        const parts = locStr.split(',');
        if (parts.length > 1) {
          venue = parts[0].trim();
          city = parts[1].trim();
        } else {
          venue = locStr;
        }
      }
    }
    return { venue, city, address };
  };

  const lastInitializedIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (editingEvent) {
      const currentId = editingEvent.id || 'NEW';
      if (lastInitializedIdRef.current !== currentId) {
        lastInitializedIdRef.current = currentId;
        
        // Populate Location Sub-Fields
        const locParts = parseLocationString(editingEvent.location);
        setVenueName(locParts.venue);
        setCityName(locParts.city);
        setFullAddress(locParts.address || editingEvent.location);

        // Date & Time Parser
        if (editingEvent.date) {
          const dateObj = new Date(editingEvent.date);
          if (!isNaN(dateObj.getTime())) {
            const timeStr = dateObj.toTimeString().split(' ')[0].substring(0, 5);
            setStartTime(timeStr);
          } else {
            setStartTime('19:00');
          }
        } else {
          setStartTime('19:00');
        }

        // Tags Serialization
        if (Array.isArray(editingEvent.tags)) {
          setTagsText(editingEvent.tags.join(', '));
        } else {
          setTagsText('');
        }
      }
    } else {
      lastInitializedIdRef.current = null;
    }
  }, [editingEvent]);

  const featuredCount = events.filter(e => e.isFeatured).length;

  const toggleFeatured = (event: ManagedEvent) => {
    if (!event.isFeatured && featuredCount >= 4) {
      setWarningMessage('Maximum 4 featured events allowed.');
      setTimeout(() => setWarningMessage(null), 3000);
      return;
    }
    updateEvent(event.id, { isFeatured: !event.isFeatured });
  };

  const filteredEvents = (Array.isArray(events) ? events : []).filter(e => {
    if (!e) return false;
    const title = String(e.title || '').toLowerCase();
    const category = String(e.category || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = title.includes(search) || category.includes(search);
    const matchesStatus = filterStatus === 'ALL' || e.status === filterStatus;
    const matchesVisibility = filterVisibility === 'ALL' || e.visibility === filterVisibility;
    const matchesFeatured = filterFeatured === 'ALL' || 
      (filterFeatured === 'FEATURED' ? e.isFeatured === true : !e.isFeatured);
    
    return matchesSearch && matchesStatus && matchesVisibility && matchesFeatured;
  }).sort((a, b) => {
    // Sort Featured events first
    const aFeatured = a.isFeatured ? 1 : 0;
    const bFeatured = b.isFeatured ? 1 : 0;
    if (aFeatured !== bFeatured) {
      return bFeatured - aFeatured;
    }
    // Fallback to chronological descending order
    return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
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
      // Validate Title
      if (!editingEvent.title || editingEvent.title.trim() === '') {
        setWarningMessage('Event Title is required.');
        setTimeout(() => setWarningMessage(null), 3000);
        return;
      }

      // Validate Description
      if (!editingEvent.description || editingEvent.description.trim() === '') {
        setWarningMessage('Event Description is required.');
        setTimeout(() => setWarningMessage(null), 3000);
        return;
      }

      // Validate Category
      if (!editingEvent.category || editingEvent.category.trim() === '') {
        setWarningMessage('Event Category is required.');
        setTimeout(() => setWarningMessage(null), 3000);
        return;
      }

      // Combine Date and StartTime
      if (!editingEvent.date) {
        setWarningMessage('Event Date is required.');
        setTimeout(() => setWarningMessage(null), 3000);
        return;
      }

      const parsedDate = new Date(editingEvent.date);
      if (isNaN(parsedDate.getTime())) {
        setWarningMessage('Invalid Date selected.');
        setTimeout(() => setWarningMessage(null), 3000);
        return;
      }

      let finalDateTime = parsedDate;
      if (startTime) {
        const [hours, minutes] = startTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          finalDateTime.setHours(hours, minutes, 0, 0);
        }
      }

      // Build combined location: e.g. "Jakarta (GBK)" if City and Venue are specified, or fallback to fullAddress
      let finalLocation = '';
      if (venueName && cityName) {
        finalLocation = `${cityName} (${venueName})`;
      } else if (venueName) {
        finalLocation = venueName;
      } else {
        finalLocation = fullAddress || 'Online';
      }

      if (!finalLocation || finalLocation.trim() === '') {
        setWarningMessage('Venue Name or Location address is required.');
        setTimeout(() => setWarningMessage(null), 3000);
        return;
      }

      // Calculate or validate capacity & price based on whether Ticket Tiers are used
      let finalPrice = Number(editingEvent.price);
      let finalCapacity = Number(editingEvent.capacity);

      if (editingEvent.ticketTiers && editingEvent.ticketTiers.length > 0) {
        // Validate each ticket tier
        for (const tier of editingEvent.ticketTiers) {
          if (!tier.name || tier.name.trim() === '') {
            setWarningMessage('Each Ticket Tier must have a name.');
            setTimeout(() => setWarningMessage(null), 3000);
            return;
          }
          const tPrice = Number(tier.price);
          if (isNaN(tPrice) || tPrice < 0) {
            setWarningMessage(`Ticket Tier "${tier.name}" must have a valid price (>= 0).`);
            setTimeout(() => setWarningMessage(null), 3000);
            return;
          }
          const tQty = Number(tier.quantity);
          if (isNaN(tQty) || tQty < 1) {
            setWarningMessage(`Ticket Tier "${tier.name}" allocation must be at least 1.`);
            setTimeout(() => setWarningMessage(null), 3000);
            return;
          }
        }
        
        // Calculate dynamic prices and capacity from the tiers to keep data strictly consistent
        finalPrice = Math.min(...editingEvent.ticketTiers.map(t => Number(t.price) || 0));
        finalCapacity = editingEvent.ticketTiers.reduce((acc, t) => acc + (Number(t.quantity) || 0), 0);
      } else {
        // Validate Standard Base Price and Capacity
        if (isNaN(finalPrice) || finalPrice < 0) {
          setWarningMessage('Base Ticket Price must be a valid number >= 0.');
          setTimeout(() => setWarningMessage(null), 3000);
          return;
        }
        if (isNaN(finalCapacity) || finalCapacity < 1) {
          setWarningMessage('Event Capacity must be at least 1.');
          setTimeout(() => setWarningMessage(null), 3000);
          return;
        }
      }

      setIsSyncing(true);
      try {
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
          } catch (err) {
            console.warn('Sync failed, using original URL:', err);
          } finally {
            setIsUploading(false);
          }
        }

        // Serialize Tags
        const finalTags = tagsText
          ? tagsText.split(',').map(t => t.trim()).filter(Boolean)
          : [];

        const updatedEvent = {
          ...editingEvent,
          location: finalLocation,
          date: finalDateTime.toISOString(),
          price: finalPrice,
          capacity: finalCapacity,
          tags: finalTags,
          image: finalImage,
        };

        if (isCreating) {
          const { id, createdAt, popularity, trendingScore, tags, ...rest } = updatedEvent;
          await addEvent(rest);
        } else {
          await updateEvent(updatedEvent.id, updatedEvent);
        }
        setEditingEvent(null);
        setIsCreating(false);
      } catch (error: any) {
        console.error('Failed to save event:', error);
        setWarningMessage(error.response?.data?.message || error.message || 'Failed to save event. Check your inputs.');
        setTimeout(() => setWarningMessage(null), 5000);
      } finally {
        setIsSyncing(false);
      }
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
      capacity: 100,
      sold: 0,
      image: 'https://images.unsplash.com/photo-1459749411177-042180ceea72?auto=format&fit=crop&q=80&w=800',
      category: 'Electronic',
      description: '',
      location: '',
      latitude: -6.2088,
      longitude: 106.8456,
      isFeatured: false,
      maxTicketsPerUser: 5,
      ticketTiers: []
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
          {['ALL', 'PUBLIC', 'PREMIUM'].map((vis) => (
            <button
              key={vis}
              onClick={() => setFilterVisibility(vis as any)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold tracking-widest transition-all border whitespace-nowrap active:scale-95 uppercase ${
                filterVisibility === vis 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/25' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {vis}
            </button>
          ))}
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2 self-center" />
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'FEATURED', label: '⭐ FEATURED' },
            { id: 'NORMAL', label: 'Normal' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterFeatured(item.id as any)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold tracking-widest transition-all border whitespace-nowrap active:scale-95 uppercase ${
                filterFeatured === item.id 
                  ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {item.label}
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
                 {event.visibility === 'PREMIUM' ? (
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
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {event.ticketTiers && event.ticketTiers.length > 0 
                          ? `From ${formatCurrency(Math.min(...event.ticketTiers.map(t => t.price)))}` 
                          : formatCurrency(event.price)}
                      </span>
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
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            >
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-left bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                  {isCreating ? (isOrganizer ? '🚀 Launch New Event' : '✨ Create New Event') : '📝 Edit Event Inventory'}
                </h3>
                <button onClick={() => { setEditingEvent(null); setIsCreating(false); }} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-6 max-h-[72vh] overflow-y-auto scrollbar-thin text-left">
                 {/* [ Basic Information ] */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                       <Tag className="w-4 h-4 text-indigo-500" />
                       <h4 className="text-xs font-black text-slate-950 dark:text-slate-50 uppercase tracking-widest">1. Basic Information</h4>
                    </div>

                    <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Event Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Grand Concert 2026"
                      value={editingEvent.title || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all font-bold text-sm text-slate-900 dark:text-white"
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 font-bold">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Event Category</label>
                       <select 
                         value={editingEvent.category || ''}
                         required
                         onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value as any })}
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all text-slate-900 dark:text-white font-bold text-xs"
                       >
                         <option value="">-- Select Category --</option>
                         {EVENT_CATEGORIES.map(cat => (
                           <option key={cat.id} value={cat.id}>{cat.label}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-1.5 font-bold">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Event Tags (comma separated)</label>
                       <input 
                         type="text" 
                         placeholder="e.g. concert, music, summer"
                         value={tagsText}
                         onChange={(e) => setTagsText(e.target.value)}
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium text-xs text-slate-900 dark:text-white"
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Event Description</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Describe your event highlights, guest stars, schedules, etc..."
                      value={editingEvent.description || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium text-sm leading-relaxed text-slate-950 dark:text-slate-100"
                    />
                 </div>
              </div>

                 {/* [ Event Location ] */}
                 <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-855 pb-2 bg-transparent">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-xs font-black text-slate-950 dark:text-slate-50 uppercase tracking-widest">2. Event Location</h4>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                         <MapPin className="w-3.5 h-3.5" />
                         <span>Select Pin on Map</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1.5 font-bold">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Venue / Building Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. GBK, Gasibu, Tunjungan Plaza"
                            value={venueName}
                            onChange={(e) => setVenueName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all text-slate-900 dark:text-white font-bold text-xs"
                          />
                       </div>
                       <div className="space-y-1.5 font-bold">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">City</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Jakarta, Bandung, Surabaya"
                            value={cityName}
                            onChange={(e) => setCityName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all text-slate-900 dark:text-white font-bold text-xs"
                          />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Address</label>
                       <input 
                         type="text" 
                         placeholder="e.g. Gelora Bung Karno Stadium, Jl. Pintu Satu Senayan..."
                         value={fullAddress}
                         onChange={(e) => setFullAddress(e.target.value)}
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium text-xs text-slate-900 dark:text-white"
                       />
                    </div>

                    {editingEvent.latitude && editingEvent.longitude ? (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-150 dark:border-slate-800 flex items-center justify-between text-xs">
                         <div className="flex items-center gap-2">
                           <CheckCircle className="w-4 h-4 text-emerald-500" />
                           <span className="font-bold text-[10px] text-slate-500 dark:text-slate-350 uppercase tracking-widest font-sans">Coordinates Active</span>
                         </div>
                         <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                           {editingEvent.latitude.toFixed(5)}, {editingEvent.longitude.toFixed(5)}
                         </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-250 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                        No map coordinate pinned. (Location is text-only)
                      </div>
                    )}
                 </div>

                 {/* [ Event Date & Time ] */}
                 <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-xs font-black text-slate-950 dark:text-slate-50 uppercase tracking-widest">3. Event Date & Time</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1.5 font-bold">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Event Date</label>
                          <input 
                            type="date" 
                            required
                            value={editingEvent.date || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all text-slate-900 dark:text-white font-bold text-xs"
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5 font-bold">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Start Time</label>
                             <input 
                               type="time" 
                               required
                               value={startTime}
                               onChange={(e) => setStartTime(e.target.value)}
                               className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none text-slate-900 dark:text-white font-bold text-xs"
                             />
                          </div>
                          <div className="space-y-1.5 font-bold">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Timezone</label>
                             <select 
                               value={timezone}
                               onChange={(e) => setTimezone(e.target.value)}
                               className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none text-slate-900 dark:text-white font-bold text-xs"
                             >
                                <option value="WIB">WIB (GMT+7)</option>
                                <option value="WITA">WITA (GMT+8)</option>
                                <option value="WIT">WIT (GMT+9)</option>
                             </select>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* [ Event Configuration ] */}
                 <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-none">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                       <Users className="w-4 h-4 text-indigo-500" />
                       <h4 className="text-xs font-black text-slate-950 dark:text-slate-50 uppercase tracking-widest">4. Event Configuration</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-bold">
                        <div className="space-y-1.5 font-bold">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Status</label>
                            <select 
                              value={editingEvent.status || 'DRAFT'}
                              onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as any })}
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none text-slate-900 dark:text-white font-bold text-xs"
                            >
                              <option value="DRAFT">Draft</option>
                              <option value="LIVE">Live</option>
                              <option value="ENDED">Ended</option>
                            </select>
                        </div>
                        <div className="space-y-1.5 font-bold">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Visibility</label>
                            <select 
                              value={editingEvent.visibility || 'PUBLIC'}
                              onChange={(e) => setEditingEvent({ ...editingEvent, visibility: e.target.value as any })}
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none text-slate-900 dark:text-white font-bold text-xs"
                            >
                              <option value="PUBLIC">Public</option>
                              <option value="PREMIUM">Premium</option>
                            </select>
                        </div>
                        <div className="space-y-1.5 font-bold">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Max tickets / user</label>
                            <input 
                              type="number" 
                              required
                              min="1"
                              value={editingEvent.maxTicketsPerUser ?? 5}
                              onChange={(e) => setEditingEvent({ ...editingEvent, maxTicketsPerUser: parseInt(e.target.value) || 5 })}
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none text-slate-900 dark:text-white font-bold text-xs"
                            />
                        </div>
                    </div>

                    {/* Standard base pricing and capacity controls when NO ticket tiers are defined */}
                    {(!editingEvent.ticketTiers || editingEvent.ticketTiers.length === 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-2xl border border-indigo-150 dark:border-indigo-900/10">
                         <div className="space-y-1.5 font-bold">
                            <label className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest ml-1 block">Base Price (IDR)</label>
                            <input 
                              type="number" 
                              required
                              min="0"
                              placeholder="e.g. 150000"
                              value={editingEvent.price ?? 0}
                              onChange={(e) => setEditingEvent({ ...editingEvent, price: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-indigo-150 dark:border-indigo-900 shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all font-bold text-xs text-indigo-600 dark:text-indigo-400"
                            />
                         </div>
                         <div className="space-y-1.5 font-bold">
                            <label className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest ml-1 block">Total Attendance Limit</label>
                            <input 
                              type="number" 
                              required
                              min="1"
                              placeholder="e.g. 500"
                              value={editingEvent.capacity ?? 0}
                              onChange={(e) => setEditingEvent({ ...editingEvent, capacity: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-indigo-155 dark:border-indigo-900 shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all font-bold text-xs text-indigo-600 dark:text-indigo-400"
                            />
                         </div>
                      </div>
                    )}
                 </div>

                 {/* TICKET TIERS MANAGEMENT */}
                 <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                       <div>
                          <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Ticket Tiers</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none mt-1">Define multi-tier access packages</p>
                       </div>
                       <button 
                         type="button"
                         onClick={() => setEditingEvent({
                           ...editingEvent,
                           ticketTiers: [
                             ...(editingEvent.ticketTiers || []),
                             { id: uuidv4(), eventId: editingEvent?.id || '', name: '', price: 0, quantity: 50, sold: 0, isFeatured: false }
                           ]
                         })}
                         className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-indigo-600 hover:text-white group"
                       >
                          Add Tier Node
                       </button>
                    </div>

                    <div className="space-y-4">
                       {editingEvent.ticketTiers && editingEvent.ticketTiers.length > 0 ? (
                         editingEvent.ticketTiers.map((tier, idx) => (
                           <div key={tier.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl relative group">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newTiers = [...(editingEvent.ticketTiers || [])];
                                  newTiers.splice(idx, 1);
                                  setEditingEvent({ ...editingEvent, ticketTiers: newTiers });
                                }}
                                className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                 <X className="w-4 h-4" />
                              </button>
                              
                              <div className="grid gap-4">
                                 <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tier Alpha Designation</label>
                                    <input 
                                      type="text" 
                                      value={tier.name}
                                      placeholder="e.g. Early Bird, VIP Access"
                                      onChange={(e) => {
                                        const newTiers = [...(editingEvent.ticketTiers || [])];
                                        newTiers[idx] = { ...tier, name: e.target.value };
                                        setEditingEvent({ ...editingEvent, ticketTiers: newTiers });
                                      }}
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none text-[11px] font-black italic"
                                    />
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                       <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Value Unit (IDR)</label>
                                       <input 
                                         type="number" 
                                         value={tier.price}
                                         onChange={(e) => {
                                           const newTiers = [...(editingEvent.ticketTiers || [])];
                                           newTiers[idx] = { ...tier, price: parseInt(e.target.value) || 0 };
                                           setEditingEvent({ ...editingEvent, ticketTiers: newTiers });
                                         }}
                                         className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none text-[11px] font-black italic"
                                       />
                                    </div>
                                    <div className="space-y-1">
                                       <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Allocation</label>
                                       <input 
                                         type="number" 
                                         value={tier.quantity}
                                         onChange={(e) => {
                                           const newTiers = [...(editingEvent.ticketTiers || [])];
                                           newTiers[idx] = { ...tier, quantity: parseInt(e.target.value) || 0 };
                                           setEditingEvent({ ...editingEvent, ticketTiers: newTiers });
                                         }}
                                         className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none text-[11px] font-black italic"
                                       />
                                    </div>
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Descriptor Node</label>
                                    <input 
                                      type="text" 
                                      value={tier.description || ''}
                                      placeholder="What does this package include?"
                                      onChange={(e) => {
                                        const newTiers = [...(editingEvent.ticketTiers || [])];
                                        newTiers[idx] = { ...tier, description: e.target.value };
                                        setEditingEvent({ ...editingEvent, ticketTiers: newTiers });
                                      }}
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none text-[10px] font-semibold italic"
                                    />
                                 </div>
                              </div>
                           </div>
                         ))
                       ) : (
                         <div className="p-8 border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-[2rem] text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Standard Protocol Only • No Sub-Nodes Detected</p>
                         </div>
                       )}
                    </div>
                 </div>

                  <div className="space-y-1.5 pt-6 border-t border-slate-100 dark:border-slate-800">
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
                                value={(editingEvent.image && editingEvent.image.startsWith('data:')) ? '' : (editingEvent.image || '')}
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
               className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-800"
             >
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-rose-50 dark:ring-rose-950/10">
                   <Trash2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Event?</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">This action will remove the event from public listings while preserving transaction history.</p>
                <div className="flex gap-3">
                   <button onClick={() => setShowConfirmDelete(null)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl active:scale-95 transition-all outline-none border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700">Cancel</button>
                   <button onClick={() => { deleteEvent(showConfirmDelete); setShowConfirmDelete(null); }} className="flex-1 py-3.5 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/20 active:scale-95 transition-all outline-none hover:bg-rose-700 hover:shadow-rose-600/35">Delete Event</button>
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
              if (loc.venue) {
                setVenueName(loc.venue);
              }
              if (loc.city) {
                setCityName(loc.city);
              }
              if (loc.address) {
                setFullAddress(loc.address);
              }
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
