import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Check, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  onSelect: (location: { address: string; lat: number; lng: number }) => void;
  onClose: () => void;
}

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapPicker({ initialLat, initialLng, onSelect, onClose }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLat && initialLng ? L.latLng(initialLat, initialLng) : L.latLng(-6.2088, 106.8456) // Default to Jakarta
  );
  const [address, setAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (position) {
      handleReverseGeocode(position.lat, position.lng);
    }
  }, [position]);

  const handleReverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await response.json();
      setAddress(data.display_name || `Point at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch (error) {
      console.error('Geocoding error:', error);
      setAddress(`Point at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const newPos = L.latLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
        setPosition(newPos);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleConfirm = () => {
    if (position) {
      onSelect({
        address,
        lat: position.lat,
        lng: position.lng
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 sm:p-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[80vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <MapPin className="w-5 h-5" />
             </div>
             <div>
                <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Location Picker</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Tap to drop a pin</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 z-10">
          <form onSubmit={handleSearch} className="relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
             <input 
               type="text" 
               placeholder="Search for a city, venue, or address..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-bold text-xs"
             />
          </form>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative z-0">
          <MapContainer 
            center={position || L.latLng(-6.2088, 106.8456)} 
            zoom={13} 
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>

          {/* Floating Address Bar */}
          <div className="absolute bottom-6 left-6 right-6 z-10 pointer-events-none">
             <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-3xl border border-white/20 dark:border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center gap-4 pointer-events-auto">
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Current Selection</span>
                   </div>
                   <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                     {isGeocoding ? (
                       <span className="flex items-center gap-2 text-slate-400">
                         <Loader2 className="h-3 w-3 animate-spin" />
                         Resolving address...
                       </span>
                     ) : address}
                   </p>
                </div>
                <button 
                  onClick={handleConfirm}
                  disabled={isGeocoding || !position}
                  className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  Confirm Location
                </button>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
