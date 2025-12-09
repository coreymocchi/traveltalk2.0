import React, { useEffect, useRef, useState } from 'react';
import { dbGetAll, dbPut, dbDelete } from '../services/db';
import { AlertTriangle, Video, Construction, Shield, Hand, Search, X, RefreshCw, MapPin, MapPinOff, Car, BadgeAlert, Loader2 } from 'lucide-react';
declare global { interface Window { L: any; travelTalkDeleteMarker: (id: string) => void; } }
export default function MapView({ currentUser, onRoute, resizeTrigger }: any) {
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [q, setQ] = useState('');
  const [res, setRes] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [ref, setRef] = useState(0);
  const [gps, setGps] = useState(true);
  const [repMode, setRepMode] = useState<string|null>(null);
  const [showRep, setShowRep] = useState(false);
  const [repDesc, setRepDesc] = useState('');
  const [repLoc, setRepLoc] = useState<any>(null);

  useEffect(() => {
    if(!mapRef.current && window.L) {
        const m = window.L.map('map', {zoomControl: false}).setView([40.71, -74.00], 13);
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(m);
        mapRef.current = m;
        // Attach global click handler for marker delete buttons
        m.getContainer().addEventListener('click', (e: any) => {
          if(e.target.classList.contains('tt-delete-marker')) {
            const id = e.target.getAttribute('data-id');
            dbDelete('places', id).then(() => { setRef(p=>p+1); m.closePopup(); });
          }
        });
    }
  }, []);

  useEffect(() => { if(mapRef.current) setTimeout(()=>mapRef.current.invalidateSize(), 300); }, [resizeTrigger]);

  useEffect(() => {
      if(!mapRef.current || !navigator.geolocation) return;
      let id: number;
      if (gps) {
          id = navigator.geolocation.watchPosition(p => {
              const { latitude: lat, longitude: lng } = p.coords;
              if (userMarkerRef.current) userMarkerRef.current.setLatLng([lat, lng]);
              else { userMarkerRef.current = window.L.circleMarker([lat, lng], { radius: 8, color: '#fff', fillColor: '#2563eb', fillOpacity: 1 }).addTo(mapRef.current).bindPopup("You"); mapRef.current.setView([lat, lng], 15); }
          });
      } else if (userMarkerRef.current) { mapRef.current.removeLayer(userMarkerRef.current); userMarkerRef.current = null; }
      return () => navigator.geolocation.clearWatch(id);
  }, [gps]);

  useEffect(() => {
    if(!mapRef.current) return;
    const m = mapRef.current;
    m.eachLayer((l: any) => l instanceof window.L.Marker && m.removeLayer(l));
    dbGetAll('places').then((places: any) => {
        places.forEach((p: any) => {
             let icon = '📍', bg='gray';
             if(p.type==='police'){icon='👮';bg='blue'} else if(p.type==='accident'){icon='💥';bg='red'} else if(p.type==='camera'){icon='📷';bg='black'}
          const html = '<div style="background:' + bg + ';width:36px;height:36px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 3px 6px rgba(0,0,0,0.3)">' + icon + '</div>';
          const div = window.L.divIcon({ className: 'custom-div-icon', html });
          const popup = '<b>' + p.title + '</b><br>' + p.description + '<br><button class="tt-delete-marker" data-id="' + p.id + '" style="background:red;color:white;width:100%;margin-top:5px;padding:5px;border-radius:4px;cursor:pointer;border:none;font-weight:bold">DELETE</button>';
          window.L.marker([p.lat, p.lng], {icon: div}).addTo(m).bindPopup(popup);
        });
    });
  }, [ref]);

  const startRep = (type: string) => {
      setRepMode(type);
      const m = mapRef.current;
      m.getContainer().style.cursor = 'crosshair';
      m.once('click', (e: any) => { setRepLoc(e.latlng); setShowRep(true); m.getContainer().style.cursor = ''; });
        alert('Tap map for ' + type);
  };

    const saveRep = async () => {
      await dbPut('places', {id: 'p-' + Date.now(), type:repMode, title:repMode?.toUpperCase(), description:repDesc, lat:repLoc.lat, lng:repLoc.lng, authorId:currentUser.id, timestamp:Date.now()});
      setRef(p=>p+1); setShowRep(false); setRepDesc('');
    };

  const search = async () => { 
    if(!q.trim()) return;
    setSearching(true);
    try {
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(q)); 
      const results = await r.json();
      setRes(results);
    } catch(err) {
      console.error('Search error:', err);
      setRes([]);
    }
    setSearching(false);
  };

  return (
    <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900">
      <div id="map" className="w-full h-full dark:bg-gray-800"></div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-80 z-[1000] bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 border border-gray-200 dark:border-gray-700">
         <div className="flex gap-2"><input className="flex-1 outline-none bg-transparent dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400" placeholder="Search locations..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}/><button onClick={search} disabled={searching} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"><Search size={20} className="text-gray-600 dark:text-gray-300"/></button></div>
         {searching && <div className="text-center py-3 text-sm text-gray-500 dark:text-gray-400">Searching...</div>}
         {res.length > 0 && <div className="max-h-48 overflow-y-auto border-t mt-2 bg-white dark:bg-gray-800 rounded-md" style={{backgroundColor: 'var(--bg)'}}>{res.map((r,i)=><div key={i} onClick={()=>{mapRef.current.setView([r.lat,r.lon],16); setRes([])}} className="p-3 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm transition-colors last:border-b-0">{r.display_name}</div>)}</div>}
      </div>
      <div className="absolute left-4 top-24 z-[900] flex flex-col gap-2">
         <button onClick={()=>startRep('accident')} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded shadow font-bold text-xs transition-colors">💥 Accident</button>
         <button onClick={()=>startRep('police')} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded shadow font-bold text-xs transition-colors">👮 Police</button>
         <button onClick={()=>startRep('camera')} className="bg-gray-800 hover:bg-gray-900 text-white p-2 rounded shadow font-bold text-xs transition-colors">📷 Camera</button>
         <button onClick={()=>startRep('traffic')} className="bg-red-800 hover:bg-red-900 text-white p-2 rounded shadow font-bold text-xs transition-colors">🚗 Traffic</button>
         <button onClick={()=>startRep('hazard')} className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded shadow font-bold text-xs transition-colors">⚠️ Hazard</button>
         <button onClick={()=>startRep('construction')} className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded shadow font-bold text-xs transition-colors">🚧 Work</button>
      </div>
      <div className="absolute right-4 bottom-24 flex flex-col gap-3 z-[900]">
          <button onClick={() => setGps(!gps)} className={`p-3 rounded-full shadow transition-colors ${gps ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`} title={gps ? "GPS on" : "GPS off"}>{gps ? <MapPin /> : <MapPinOff />}</button>
          <button onClick={()=>setRef(p=>p+1)} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" title="Refresh markers"><RefreshCw/></button>
      </div>
      {showRep && <div className="absolute inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4"><div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-sm shadow-2xl"><h3 className="font-bold mb-4 text-gray-900 dark:text-white text-lg">Report {repMode?.toUpperCase()}</h3><textarea className="w-full border border-gray-300 dark:border-gray-700 p-3 rounded h-24 mb-4 dark:bg-gray-800 dark:text-white bg-white text-gray-900" placeholder="Details..." value={repDesc} onChange={e=>setRepDesc(e.target.value)}/><div className="flex gap-2"><button onClick={()=>setShowRep(false)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button><button onClick={saveRep} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors font-semibold">Submit</button></div></div></div>}
    </div>
  );
}
