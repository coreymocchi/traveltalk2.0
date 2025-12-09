
import React, { useEffect, useRef, useState } from 'react';
import { User, Place, SearchResult } from '../types';
import { dbPut, dbGetAll, dbDelete } from '../services/db';
import { AlertTriangle, Search, Video, X, Shield, Construction, BadgeAlert, RefreshCw, Hand, Loader2, MapPin, Car } from 'lucide-react';

declare global {
  interface Window {
    L: any;
    travelTalkDeleteMarker: (id: string) => void;
  }
}

interface MapViewProps {
  currentUser: User;
  onRouteCalculated?: (summary: {time: number, distance: number, text: string}) => void;
  resizeTrigger?: number;
}

const MapView: React.FC<MapViewProps> = ({ currentUser, onRouteCalculated, resizeTrigger }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const routingControl = useRef<any>(null);
  const placesLayer = useRef<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Reporting State
  const [reportMode, setReportMode] = useState<Place['type'] | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDesc, setReportDesc] = useState('');
  const [reportLocation, setReportLocation] = useState<{lat: number, lng: number} | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- CRITICAL: GLOBAL MARKER DELETION HANDLER ---
  // This attaches to the window object to guarantee the popup button can call it.
  useEffect(() => {
      window.travelTalkDeleteMarker = async (id: string) => {
          if (confirm("CONFIRM: Permanently remove this marker from the map?")) {
              try {
                  await dbDelete('places', id);
                  // Force a UI refresh
                  setRefreshTrigger(prev => prev + 1); 
                  if (mapInstance.current) mapInstance.current.closePopup();
              } catch (err) {
                  console.error("Deletion failed:", err);
                  alert("System Error: Could not delete marker.");
              }
          }
      };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (mapContainer.current && !mapInstance.current && window.L) {
      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark 
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      
      const map = window.L.map(mapContainer.current, { zoomControl: false }).setView([-34.6037, -58.3816], 13);
      window.L.control.zoom({ position: 'topright' }).addTo(map);
      window.L.tileLayer(tileUrl, { attribution: '&copy; OpenStreetMap' }).addTo(map);
      
      mapInstance.current = map;
      placesLayer.current = window.L.layerGroup().addTo(map);

      map.on('click', (e: any) => {
        setShowSuggestions(false);
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 15);
             window.L.circleMarker([latitude, longitude], { 
                radius: 8, color: '#ffffff', weight: 3, fillColor: '#588157', fillOpacity: 1 
            }).addTo(map).bindPopup("<b>You are here</b>").openPopup();
        });
      }
    }
  }, []);

  // Handle Resize Events (Fixes gray areas when chat opens/closes)
  useEffect(() => {
    if (mapInstance.current) {
        setTimeout(() => {
            mapInstance.current.invalidateSize();
        }, 300);
    }
  }, [resizeTrigger]);

  // Sync Dark Mode
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && mapInstance.current) {
                const isDark = document.documentElement.classList.contains('dark');
                const tileUrl = isDark 
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
                    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
                mapInstance.current.eachLayer((layer: any) => {
                    if (layer instanceof window.L.TileLayer) layer.setUrl(tileUrl);
                });
            }
        });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => { loadPlaces(); }, [refreshTrigger, currentUser.id]);

  useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
          if (searchQuery.length > 2) performSearch(searchQuery);
          else { setSearchResults([]); setShowSuggestions(false); }
      }, 500);
      return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
      setIsSearching(true);
      try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
          const data = await res.json();
          setSearchResults(data);
          setShowSuggestions(true);
      } catch (e) { console.error(e); } 
      finally { setIsSearching(false); }
  };

  const selectSearchResult = (result: SearchResult) => {
      if (!mapInstance.current) return;
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      mapInstance.current.setView([lat, lon], 16);
      
      const marker = window.L.marker([lat, lon]).addTo(mapInstance.current);
      
      const popupContent = `
        <div class="p-2 min-w-[200px]">
            <h3 class="font-bold text-lg mb-1">${result.display_name.split(',')[0]}</h3>
            <p class="text-xs text-gray-500 mb-2">${result.display_name}</p>
            <button onclick="window.dispatchEvent(new CustomEvent('travelTalkDrive', {detail: {lat: ${lat}, lon: ${lon}}}))" class="mt-2 w-full bg-primary text-white py-2 rounded font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2">
                🚗 Drive Here
            </button>
        </div>
      `;
      
      marker.bindPopup(popupContent).openPopup();

      setSearchQuery('');
      setShowSuggestions(false);
  };
  
  // Listen for the drive event from the popup string
  useEffect(() => {
      const handler = (e: any) => {
          if (e.detail) calculateRoute([e.detail.lat, e.detail.lon]);
      };
      window.addEventListener('travelTalkDrive', handler);
      return () => window.removeEventListener('travelTalkDrive', handler);
  }, []);

  const loadPlaces = async () => {
      if (!mapInstance.current || !placesLayer.current) return;
      placesLayer.current.clearLayers();
      const places = await dbGetAll<Place>('places');

      places.forEach(place => {
          let iconChar = '📍';
          let bgColor = '#666';
          let labelText = place.type.toUpperCase().replace('_', ' ');
          
          switch(place.type) {
              case 'accident': iconChar = '💥'; bgColor = '#ea580c'; break;
              case 'camera': iconChar = '📷'; bgColor = '#1f2937'; break; 
              case 'construction': iconChar = '🚧'; bgColor = '#d97706'; break;
              case 'hazard': iconChar = '⚠️'; bgColor = '#dc2626'; break; 
              case 'police': iconChar = '👮'; bgColor = '#2563eb'; break; 
              case 'traffic': iconChar = '🚗'; bgColor = '#991b1b'; break;
              case 'traffic_stop': iconChar = '🛑'; bgColor = '#1e3a8a'; break; 
          }
          
          const icon = window.L.divIcon({
              className: 'custom-div-icon',
              html: `
                <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none;">
                    <div style="background-color: ${bgColor}; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 22px; box-shadow: 0 4px 8px rgba(0,0,0,0.4);">
                        ${iconChar}
                    </div>
                    <span style="background: rgba(0,0,0,0.8); color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; margin-top: 4px; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid rgba(255,255,255,0.3);">
                        ${labelText}
                    </span>
                </div>
              `,
              iconSize: [40, 70],
              iconAnchor: [20, 40],
              popupAnchor: [0, -40]
          });

          const marker = window.L.marker([place.lat, place.lng], { icon }).addTo(placesLayer.current);

          // We use onclick="window.travelTalkDeleteMarker" to bypass any event listener stripping.
          // This is the "Nuclear Option" for reliability.
          const popupContent = `
            <div class="p-1 min-w-[220px]">
                <div class="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span style="font-size: 1.5em; background: ${bgColor}; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: white;">${iconChar}</span> 
                    <div>
                        <div class="font-bold text-base capitalize leading-tight">${labelText}</div>
                        <div class="text-[10px] text-gray-400">Public Report</div>
                    </div>
                </div>
                
                <div class="text-sm text-gray-800 dark:text-gray-200 mb-3 font-medium bg-gray-50 dark:bg-white/5 p-2 rounded">
                    ${place.description || 'No description provided.'}
                </div>

                <div class="text-xs text-gray-400 mb-3">
                    Reported: ${new Date(place.timestamp).toLocaleDateString()}
                </div>

                <button 
                    onclick="window.travelTalkDeleteMarker('${place.id}')"
                    class="w-full bg-red-600 text-white py-3 rounded-lg text-xs font-bold hover:bg-red-700 active:bg-red-800 transition flex items-center justify-center gap-2 uppercase tracking-wide shadow-sm cursor-pointer"
                >
                    🗑️ REMOVE MARKER
                </button>
            </div>
          `;

          marker.bindPopup(popupContent);
      });
  };

  const calculateRoute = (destCoords: [number, number]) => {
    if (routingControl.current) {
        mapInstance.current.removeControl(routingControl.current);
    }
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const start = window.L.latLng(pos.coords.latitude, pos.coords.longitude);
            const end = window.L.latLng(destCoords[0], destCoords[1]);
            
            const routerUrl = `https://router.project-osrm.org/route/v1/driving`;
            const control = window.L.Routing.control({
                waypoints: [start, end],
                router: window.L.Routing.osrmv1({ serviceUrl: routerUrl }),
                lineOptions: { styles: [{ color: '#588157', opacity: 0.8, weight: 6 }] },
                showAlternatives: false,
                addWaypoints: false,
                fitSelectedRoutes: true,
                createMarker: () => null
            });

            control.on('routesfound', (e: any) => {
                const summary = e.routes[0].summary;
                const eta = Math.round(summary.totalTime / 60);
                const dist = (summary.totalDistance / 1000).toFixed(1);
                if (onRouteCalculated) {
                    onRouteCalculated({ time: summary.totalTime, distance: summary.totalDistance, text: `${eta} min (${dist} km)` });
                }
            });

            control.addTo(mapInstance.current);
            routingControl.current = control;
        });
    }
  };

  const startReporting = (type: Place['type']) => {
      setReportMode(type);
      if (mapInstance.current) {
          const mapEl = mapInstance.current.getContainer();
          mapEl.style.cursor = 'crosshair';
          
          const center = mapInstance.current.getCenter();
          const popup = window.L.popup()
            .setLatLng(center)
            .setContent(`<div class="text-center font-bold px-2 py-1">Tap location for<br/><span class="text-primary text-lg">${type?.toUpperCase().replace('_', ' ')}</span></div>`)
            .openOn(mapInstance.current);

          const onMapClick = (e: any) => {
              setReportLocation(e.latlng);
              setShowReportModal(true);
              setReportMode(type);
              
              mapInstance.current.closePopup();
              mapInstance.current.off('click', onMapClick);
              mapEl.style.cursor = '';
          };
          
          mapInstance.current.on('click', onMapClick);
      }
  };

  const submitReport = async () => {
      if (!reportLocation || !reportMode) return;
      const newPlace: Place = {
          id: `place-${Date.now()}`,
          type: reportMode,
          lat: reportLocation.lat,
          lng: reportLocation.lng,
          title: reportMode.toUpperCase().replace('_', ' '),
          description: reportDesc || 'Reported by user',
          authorId: currentUser.id, 
          upvotes: 0,
          downvotes: 0,
          timestamp: Date.now()
      };
      await dbPut('places', newPlace);
      setRefreshTrigger(p => p + 1);
      setShowReportModal(false);
      setReportDesc('');
      setReportLocation(null);
  };

  return (
    <div className="absolute inset-0 z-0 bg-gray-100 dark:bg-gray-900">
      {/* Search Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[90%] md:w-96 z-[1000]">
        <div className="bg-surface/95 backdrop-blur-md shadow-2xl rounded-2xl flex items-center px-4 py-3 border border-border transition-all focus-within:ring-2 focus-within:ring-primary/50">
             <Search className="text-gray-400" size={20}/>
             <input 
                className="bg-transparent border-none outline-none flex-1 ml-3 text-gray-800 dark:text-white placeholder:text-gray-400 font-medium"
                placeholder="Search location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
             />
             {isSearching && <Loader2 className="animate-spin text-primary" size={16}/>}
             {searchQuery && <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><X size={16}/></button>}
        </div>
        
        {showSuggestions && searchResults.length > 0 && (
            <div className="mt-2 bg-surface/95 backdrop-blur-md rounded-xl shadow-2xl border border-border overflow-hidden z-[2000] animate-in fade-in slide-in-from-top-2">
                {searchResults.map((r, i) => (
                    <div key={i} onClick={() => selectSearchResult(r)} className="p-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer border-b border-border last:border-0 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        {r.display_name}
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Manual Refresh */}
      <div className="absolute right-4 bottom-24 md:bottom-8 z-[900] flex flex-col gap-2 pointer-events-auto">
          <button onClick={() => setRefreshTrigger(p => p + 1)} className="bg-surface text-gray-700 dark:text-white p-3 rounded-full shadow-lg border border-border hover:bg-gray-100 dark:hover:bg-gray-800 transition active:scale-95" title="Refresh Markers">
              <RefreshCw size={24} />
          </button>
      </div>

      {/* Quick Report Bar - ALPHABETICAL ORDER */}
      <div className="absolute left-4 top-24 z-[900] flex flex-col gap-3 pointer-events-auto">
         <ReportBtn icon={<AlertTriangle size={18}/>} label="Accident" onClick={() => startReporting('accident')} color="bg-red-600" />
         <ReportBtn icon={<Video size={18}/>} label="Camera" onClick={() => startReporting('camera')} color="bg-gray-800" />
         <ReportBtn icon={<Construction size={18}/>} label="Construction" onClick={() => startReporting('construction')} color="bg-amber-600" />
         <ReportBtn icon={<BadgeAlert size={18}/>} label="Hazard" onClick={() => startReporting('hazard')} color="bg-orange-500" />
         <ReportBtn icon={<Shield size={18}/>} label="Police" onClick={() => startReporting('police')} color="bg-blue-600" />
         <ReportBtn icon={<Car size={18}/>} label="Traffic" onClick={() => startReporting('traffic')} color="bg-red-800" />
         <ReportBtn icon={<Hand size={18}/>} label="Traffic Stop" onClick={() => startReporting('traffic_stop')} color="bg-indigo-900" />
      </div>

      {/* Report Modal */}
      {showReportModal && (
          <div className="absolute inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-border animate-in zoom-in-95 ring-1 ring-white/10">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                        <MapPin className="text-primary"/>
                        Add Report
                      </h3>
                      <button onClick={() => setShowReportModal(false)}><X size={24} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"/></button>
                  </div>
                  <div className="mb-4">
                      <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Selected Type</label>
                      <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold text-gray-800 dark:text-gray-200 capitalize flex items-center justify-between">
                          {reportMode?.replace('_', ' ')}
                          <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                      </div>
                  </div>
                  <div className="mb-6">
                      <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Description</label>
                      <textarea 
                          className="w-full bg-bg border border-border rounded-xl p-3 h-28 resize-none focus:ring-2 focus:ring-primary outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                          placeholder="Describe the situation..."
                          value={reportDesc}
                          onChange={e => setReportDesc(e.target.value)}
                      />
                  </div>
                  <button onClick={submitReport} className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/20 active:scale-[0.98] transition hover:bg-opacity-90">
                      Confirm & Post
                  </button>
              </div>
          </div>
      )}

      <div id="map" ref={mapContainer} className="h-full w-full bg-gray-200 dark:bg-gray-800" />
    </div>
  );
};

const ReportBtn = ({ icon, label, onClick, color }: any) => (
    <div className="flex items-center gap-2 group">
        <button onClick={onClick} className={`${color} w-11 h-11 rounded-xl shadow-lg flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 border border-white/20 hover:border-white/40 ring-2 ring-transparent hover:ring-white/20`}>
            {icon}
        </button>
        <span className="bg-surface backdrop-blur-md text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap text-gray-800 dark:text-white border border-border z-[950] translate-x-[-10px] group-hover:translate-x-0 duration-200">
            {label}
        </span>
    </div>
);

export default MapView;
