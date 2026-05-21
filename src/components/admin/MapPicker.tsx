import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  X, 
  MapPin, 
  Check, 
  Search, 
  Loader2, 
  Navigation, 
  History, 
  ChevronRight,
  LocateFixed,
  Building,
  Home,
  Coffee,
  Music,
  ShoppingBag,
  Palmtree,
  Globe,
  Compass,
  CheckCircle,
  Keyboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { safeStorage } from '../../lib/safeStorage';

// Fix for default marker icon in Leaflet
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onSelect: (location: { address: string; lat: number; lng: number; venue?: string; city?: string }) => void;
  onClose: () => void;
}

interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
}

// Sub-component to handle map view updates and prevent grey area bug in Leaflet
function MapController({ position }: { position: L.LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      // Small timeout guarantees container layout has reflowed fully in DOM
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 300);
      map.flyTo(position, map.getZoom(), { duration: 1.2 });
      return () => clearTimeout(timer);
    }
  }, [position, map]);
  return null;
}

function LocationMarker({ 
  position, 
  setPosition, 
  isDraggable 
}: { 
  position: L.LatLng | null, 
  setPosition: (pos: L.LatLng) => void,
  isDraggable: boolean
}) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = React.useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    [setPosition],
  );

  return position === null ? null : (
    <Marker 
      draggable={isDraggable}
      eventHandlers={eventHandlers}
      position={position} 
      ref={markerRef}
    >
    </Marker>
  );
}

const getPlaceIcon = (type: string, className: string) => {
  if (className === 'amenity') {
    if (type === 'cafe' || type === 'restaurant') return <Coffee className="w-4 h-4 text-amber-500" />;
    return <Building className="w-4 h-4 text-indigo-500" />;
  }
  if (className === 'building') return <Home className="w-4 h-4 text-emerald-500" />;
  if (className === 'leisure') {
    if (type === 'concert_hall') return <Music className="w-4 h-4 text-rose-500" />;
    if (type === 'park' || type === 'garden') return <Palmtree className="w-4 h-4 text-teal-500" />;
    return <ShoppingBag className="w-4 h-4 text-cyan-500" />;
  }
  return <MapPin className="w-4 h-4 text-slate-500" />;
};

export default function MapPicker({ initialLat, initialLng, onSelect, onClose }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLat && initialLng && !isNaN(initialLat) && !isNaN(initialLng) 
      ? L.latLng(initialLat, initialLng) 
      : L.latLng(-6.2088, 106.8456)
  );
  
  const [address, setAddress] = useState('');
  const [venueName, setVenueName] = useState('');
  const [cityName, setCityName] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentLocations, setRecentLocations] = useState<{address: string, lat: number, lng: number; venue?: string; city?: string}[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isDraggable, setIsDraggable] = useState(true);
  
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const lastGeocodedCoords = useRef<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load recent locations
  useEffect(() => {
    const saved = safeStorage.getItem('tiketmu_recent_locations');
    if (saved) {
      try {
        setRecentLocations(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Failed to load recent locations');
      }
    }
  }, []);

  const handleReverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await response.json();
      
      const displayName = data.display_name || `Point at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setAddress(displayName);
      
      // Detailed extraction for City
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.suburb || addr.city_district || addr.village || addr.municipality || addr.county || addr.state || '';
      setCityName(city);

      // Detailed extraction for Venue / Landmark Name
      let venue = data.name || addr.building || addr.amenity || addr.leisure || addr.shop || addr.office || addr.tourism || '';
      if (venue.toLowerCase() === city.toLowerCase() || (addr.country && venue.toLowerCase() === addr.country.toLowerCase())) {
        venue = '';
      }
      setVenueName(venue);

    } catch (error) {
      console.error('Geocoding error:', error);
      setAddress(`Point at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Perform reverse geocoding with strict coordinate changes checks to let user write manual modifications
  useEffect(() => {
    if (position) {
      const latRounded = Number(position.lat.toFixed(6));
      const lngRounded = Number(position.lng.toFixed(6));
      
      const last = lastGeocodedCoords.current;
      if (!last || last.lat !== latRounded || last.lng !== lngRounded) {
        lastGeocodedCoords.current = { lat: latRounded, lng: lngRounded };
        handleReverseGeocode(position.lat, position.lng);
      }
    }
  }, [position]);

  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    // Simple debounce
    const timer = setTimeout(() => {
      if (val === e.target.value) {
        fetchSuggestions(val);
      }
    }, 500);
    return () => clearTimeout(timer);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const firstSuggestion = suggestionsRef.current?.querySelector('button');
      (firstSuggestion as HTMLElement)?.focus();
    }
  };

  const selectSuggestion = (s: Suggestion) => {
    const newPos = L.latLng(parseFloat(s.lat), parseFloat(s.lon));
    setPosition(newPos);
    setSearchQuery(s.display_name);
    setShowSuggestions(false);
  };

  const useCurrentLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition(L.latLng(latitude, longitude));
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not retrieve your location. Please check your permissions.');
        setIsLocating(false);
      }
    );
  };

  const handleManualLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= -90 && val <= 90) {
      setPosition(L.latLng(val, position?.lng || 106.8456));
    }
  };

  const handleManualLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= -180 && val <= 180) {
      setPosition(L.latLng(position?.lat || -6.2088, val));
    }
  };

  const handleConfirm = () => {
    if (position) {
      // Save confirmed location to recent search history
      const newRecent = [
        { address, lat: position.lat, lng: position.lng, venue: venueName, city: cityName },
        ...recentLocations.filter(r => r.address !== address)
      ].slice(0, 5);
      safeStorage.setItem('tiketmu_recent_locations', JSON.stringify(newRecent));
      
      onSelect({
        address,
        lat: position.lat,
        lng: position.lng,
        venue: venueName,
        city: cityName
      });
    }
  };

  const NEARBY_CATEGORIES = [
    { label: 'Arenas / Stadium', icon: Music, type: 'stadium' },
    { label: 'Hotels', icon: Home, type: 'hotel' },
    { label: 'Cafes', icon: Coffee, type: 'cafe' },
    { label: 'Parks / Outdoor', icon: Palmtree, type: 'park' },
  ];

  const fetchNearby = async (type: string) => {
    if (!position) return;
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${type}&format=json&limit=5&lat=${position.lat}&lon=${position.lng}`);
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Nearby error:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-fade-in">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ y: "20%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "20%", opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="relative bg-white dark:bg-slate-950 overflow-hidden shadow-2xl flex flex-col border border-slate-100 dark:border-slate-800 rounded-[32px]"
        style={{
          width: 'min(96vw, 1280px)',
          maxWidth: '1280px',
          height: 'min(92vh, 980px)',
          maxHeight: '92vh',
        }}
      >
        {/* Sticky Header */}
        <div className="p-3 sm:p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <MapPin className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
             </div>
             <div className="min-w-0">
                <h3 className="text-sm sm:text-base md:text-lg font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate">Interactive Map Picker</h3>
                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mt-0.5 sm:mt-1">Configure premium, real-time geocoding data</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={useCurrentLocation}
              disabled={isLocating}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-800"
              title="Use Current GPS coords"
            >
              {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
              <span className="font-black text-[9px] uppercase tracking-widest hidden sm:inline">My Location</span>
            </button>
            <button onClick={onClose} className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">
              <X className="w-4 h-4 sm:w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Search Panel */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850 z-20 shrink-0">
          <div className="relative group max-w-2xl mx-auto" ref={suggestionsRef}>
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
             <input 
               type="text" 
               placeholder="Search event building, landmark, venue, city (e.g., GBK Senayan)..."
               value={searchQuery}
               onChange={handleSearchChange}
               onKeyDown={handleSearchKeyDown}
               onFocus={() => searchQuery.length >= 3 && setShowSuggestions(true)}
               className="w-full pl-11 pr-11 py-2 sm:py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold text-xs shadow-sm dark:text-white"
             />
             {searchQuery && (
               <button 
                onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
               >
                 <X className="w-3.5 h-3.5" />
               </button>
             )}

             {/* Auto-suggest Search results list */}
             <AnimatePresence>
               {showSuggestions && suggestions.length > 0 && (
                 <motion.div 
                   initial={{ opacity: 0, y: 8 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 8 }}
                   className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-150 dark:border-slate-800 overflow-hidden z-50 max-h-48 sm:max-h-60 overflow-y-auto"
                 >
                     <div className="p-1">
                       {suggestions.map((s) => (
                         <button
                           key={s.place_id}
                           onClick={() => selectSuggestion(s)}
                           className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-850/60 rounded-lg transition-colors flex gap-2.5 group"
                         >
                           <div className="p-1.5 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50">
                             {getPlaceIcon(s.type, s.class)}
                           </div>
                           <div className="flex flex-col min-w-0 justify-center">
                             <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-snug">{s.display_name}</span>
                             <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">{s.class}: {s.type.replace(/_/g, ' ')}</span>
                           </div>
                         </button>
                       ))}
                     </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Quick Categories & Recent items row */}
          <div className="flex flex-col gap-1.5 max-w-2xl mx-auto mt-2">
            {recentLocations.length > 0 && searchQuery === '' && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 hide-scrollbar">
                <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="flex gap-1.5">
                  {recentLocations.map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPosition(L.latLng(loc.lat, loc.lng));
                        setSearchQuery(loc.address);
                        setVenueName(loc.venue || loc.address.split(',')[0]);
                        setCityName(loc.city || '');
                        setAddress(loc.address);
                      }}
                      className="flex-none px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <MapPin className="w-2.5 h-2.5 text-indigo-500/80" />
                      {loc.venue || loc.address.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {searchQuery === '' && (
              <div className="flex items-center gap-3 overflow-x-auto pb-0.5 hide-scrollbar">
                 <LocateFixed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                 <div className="flex gap-1.5">
                   {NEARBY_CATEGORIES.map((cat) => (
                     <button
                       key={cat.type}
                       onClick={() => fetchNearby(cat.type)}
                       className="flex-none px-2.5 py-1 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/45 border border-indigo-100/50 dark:border-indigo-900/30 rounded-lg text-[9px] font-bold text-indigo-600 dark:text-indigo-400 transition-all flex items-center gap-1.5 whitespace-nowrap"
                     >
                       <cat.icon className="w-2.5 h-2.5" />
                       {cat.label}
                     </button>
                   ))}
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Immersive Map Container */}
        <div className="flex-1 min-h-[160px] sm:min-h-[260px] md:min-h-[320px] relative z-0 border-b border-slate-100 dark:border-slate-850">
          <MapContainer 
            center={position || L.latLng(-6.2088, 106.8456)} 
            zoom={15} 
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController position={position} />
            <LocationMarker position={position} setPosition={setPosition} isDraggable={isDraggable} />
          </MapContainer>

          {/* Floating Map Pin controls */}
          <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
             <button 
              onClick={() => setIsDraggable(!isDraggable)}
              className={`p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 transition-all ${isDraggable ? 'text-indigo-600 dark:text-indigo-400 scale-105 ring-2 ring-indigo-500/10' : 'text-slate-400'}`}
              title={isDraggable ? "Lock Pin position" : "Unlock Pin to allow dragging"}
             >
                <LocateFixed className="w-4 h-4" />
             </button>
          </div>

          {/* Floating live status overlay */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
             <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white border border-slate-700/50 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                GPS Active
             </div>
          </div>
        </div>

        {/* Bento Grid Dynamic Input Card - Large split view or immersive columns */}
        <div className="bg-white dark:bg-slate-950 p-4 sm:p-5 md:p-6 shrink-0 z-30 overflow-y-auto max-h-[42vh] sm:max-h-[34vh] border-t border-slate-50 dark:border-slate-900">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
             
             {/* Left Column: Direct manual edits of geocoded feedback */}
             <div className="lg:col-span-8 space-y-3">
                <div className="flex items-center gap-2 mb-0.5">
                   <div className="p-1 px-2.5 bg-amber-500/10 text-amber-500 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                     Target Location Parameters
                   </div>
                   <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                     <Keyboard className="w-3 h-3" /> Overrides supported
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {/* Venue Name override */}
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">Venue / Building Name</label>
                      <div className="relative">
                         <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-550" />
                         <input 
                           type="text"
                           placeholder="Enter venue name (e.g. Istora Senayan)..."
                           value={venueName}
                           onChange={(e) => setVenueName(e.target.value)}
                           className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all text-slate-900 dark:text-slate-100 font-bold text-xs"
                         />
                      </div>
                   </div>

                   {/* City override */}
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest block ml-1">City / Region</label>
                      <div className="relative">
                         <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-550" />
                         <input 
                           type="text"
                           placeholder="Enter city (e.g. Jakarta, Sidoarjo)..."
                           value={cityName}
                           onChange={(e) => setCityName(e.target.value)}
                           className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all text-slate-900 dark:text-slate-100 font-bold text-xs"
                         />
                      </div>
                   </div>
                </div>

                {/* Full Address override */}
                <div className="space-y-1">
                   <label className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest block ml-1">Full Described Address</label>
                   <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-550" />
                      <input 
                        type="text"
                        placeholder="Enter full address details..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all text-slate-700 dark:text-slate-300 font-medium text-xs leading-relaxed"
                      />
                   </div>
                </div>

                {/* Coordinate Inputs - manual edits directly updates coordinate pin on leaflet! */}
                <div className="pt-1">
                   <div className="bg-slate-50/80 dark:bg-slate-900/40 p-2 sm:p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="flex flex-col gap-0.5 col-span-1">
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Target Latitude</label>
                         <input 
                           type="number"
                           step="any"
                           value={position?.lat || ''}
                           onChange={handleManualLatChange}
                           className="bg-transparent border-none p-0 text-xs font-black font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
                         />
                      </div>
                      <div className="w-px h-full bg-slate-200 dark:bg-slate-800 hidden sm:block self-center"></div>
                      <div className="flex flex-col gap-0.5 col-span-1">
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Target Longitude</label>
                         <input 
                           type="number"
                           step="any"
                           value={position?.lng || ''}
                           onChange={handleManualLngChange}
                           className="bg-transparent border-none p-0 text-xs font-black font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
                         />
                      </div>
                   </div>
                </div>
             </div>

             {/* Right Column: Actions / Info confirmation */}
             <div className="lg:col-span-4 lg:border-l lg:border-slate-100 lg:dark:border-slate-800 lg:pl-5 space-y-4 h-full flex flex-col justify-between self-stretch">
                <div className="hidden sm:block">
                   <div className="flex items-center gap-1.5 text-emerald-500">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Live Coordinate Sync</span>
                   </div>
                   <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                     {isGeocoding ? (
                       <span className="text-amber-500 font-bold flex items-center gap-1.5 animate-pulse">
                         <Loader2 className="w-3 h-3 animate-spin" /> Geocoding location details...
                       </span>
                     ) : (
                       "Pin coordinate matches live OpenStreetMap reverse boundaries securely."
                     )}
                   </p>
                </div>

                <div className="space-y-2 pt-1 lg:pt-3">
                   <button 
                    onClick={handleConfirm}
                    disabled={isGeocoding || !position}
                    className="w-full py-3 sm:py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-[0_8px_20px_-4px_rgba(79,70,229,0.35)] active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 group"
                   >
                     <span>Confirm Location</span>
                     <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                   </button>
                   <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold text-center uppercase tracking-widest">
                     Synchronizes City, Venue, & Address
                   </p>
                </div>
             </div>

          </div>
        </div>
      </motion.div>
      
      {/* Scroll indicator handle bar for mobile */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-[210] sm:hidden pointer-events-none">
         <div className="w-10 h-1 bg-slate-350/50 rounded-full"></div>
      </div>
    </div>
  );
}
