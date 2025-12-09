import React, { useEffect, useRef, useState } from 'react';
import { dbGetAll, dbPut, dbDelete } from '../services/db';
import { AlertTriangle, Video, Construction, Shield, Hand, Search, X, RefreshCw, MapPin, MapPinOff, Car, BadgeAlert, Loader2 } from 'lucide-react';
declare global { interface Window { L: any; travelTalkDeleteMarker: (id: string) => void; } }
export default function MapView({ currentUser, onRoute, resizeTrigger }: any) {
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [q, setQ] = useState('');
  const [res, setRes] = useState<any[]>([]);
  const [ref, setRef] = useState(0);
  const [gps, setGps] = useState(true);
  const [repMode, setRepMode] = useState<string|null>(null);
  const [showRep, setShowRep] = useState(false);
  const [repDesc, setRepDesc] = useState('');
  const [repLoc, setRepLoc] = useState<any>(null);

  useEffect(() => {
    window.travelTalkDeleteMarker = async (id) => { if(confirm('Delete marker?')) { await dbDelete('places', id); setRef(p=>p+1); mapRef.current?.closePopup(); } };
    if(!mapRef.current && window.L) {
        const m = window.L.map('map', {zoomControl: false}).setView([40.71, -74.00], 13);
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(m);
        mapRef.current = m;
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
          const marker = window.L.marker([p.lat, p.lng], {icon: div}).addTo(m);
          marker.on('popupopen', () => {
            const btn = document.querySelector('[data-marker-' + p.id + ']');
            if(btn) btn.addEventListener('click', async () => { if(confirm('Delete marker?')) { await dbDelete('places', p.id); setRef(r=>r+1); m.closePopup(); } });
          });
          const popup = '<b>' + p.title + '</b><br>' + p.description + '<br><button data-marker-' + p.id + ' style="background:red;color:white;width:100%;margin-top:5px;padding:5px;border-radius:4px;cursor:pointer">DELETE</button>';
          marker.bindPopup(popup);
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

  const search = async () => { const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + q); setRes(await r.json()); };

  return (
    <div className="absolute inset-0 bg-gray-200">
      <div id="map" className="w-full h-full dark:bg-gray-800"></div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-80 z-[1000] bg-white dark:bg-gray-800 rounded-xl shadow p-2">
         <div className="flex"><input className="flex-1 outline-none bg-transparent dark:text-white" placeholder="Search..." value={q} onChange={e=>setQ(e.target.value)} /><button onClick={search}><Search className="dark:text-white"/></button></div>
         {res.length > 0 && <div className="max-h-40 overflow-auto border-t mt-2 bg-white dark:bg-gray-800">{res.map((r,i)=><div key={i} onClick={()=>{mapRef.current.setView([r.lat,r.lon],16); setRes([])}} className="p-2 border-b cursor-pointer hover:bg-gray-100 dark:text-white">{r.display_name}</div>)}</div>}
      </div>
      <div className="absolute left-4 top-24 z-[900] flex flex-col gap-2">
         <button onClick={()=>startRep('accident')} className="bg-red-600 text-white p-2 rounded shadow font-bold text-xs">💥 Accident</button>
         <button onClick={()=>startRep('police')} className="bg-blue-600 text-white p-2 rounded shadow font-bold text-xs">👮 Police</button>
         <button onClick={()=>startRep('camera')} className="bg-gray-800 text-white p-2 rounded shadow font-bold text-xs">📷 Camera</button>
         <button onClick={()=>startRep('traffic')} className="bg-red-800 text-white p-2 rounded shadow font-bold text-xs">🚗 Traffic</button>
         <button onClick={()=>startRep('hazard')} className="bg-orange-500 text-white p-2 rounded shadow font-bold text-xs">⚠️ Hazard</button>
         <button onClick={()=>startRep('construction')} className="bg-amber-500 text-white p-2 rounded shadow font-bold text-xs">🚧 Work</button>
      </div>
      <div className="absolute right-4 bottom-24 flex flex-col gap-3 z-[900]">
          <button onClick={() => setGps(!gps)} className={`p-3 rounded-full shadow ${gps ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{gps ? <MapPin /> : <MapPinOff />}</button>
          <button onClick={()=>setRef(p=>p+1)} className="bg-white p-3 rounded-full shadow"><RefreshCw/></button>
      </div>
      {showRep && <div className="absolute inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4"><div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-sm"><h3 className="font-bold mb-4 dark:text-white">Report {repMode}</h3><textarea className="w-full border p-2 rounded h-24 mb-4 dark:bg-gray-800 dark:text-white" placeholder="Details..." value={repDesc} onChange={e=>setRepDesc(e.target.value)}/><div className="flex gap-2"><button onClick={()=>setShowRep(false)} className="flex-1 bg-gray-200 p-2 rounded">Cancel</button><button onClick={saveRep} className="flex-1 bg-primary text-white p-2 rounded">Submit</button></div></div></div>}
    </div>
  );
}
