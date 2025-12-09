import React, { useState, useEffect, useRef } from 'react';
import { dbGetAll, dbPut } from '../services/db';
import { translateText } from '../services/geminiService';
import { Send, Languages, Video, Mic, StopCircle, X, Maximize2, Minimize2, MapPin, Eye, EyeOff, Paperclip, Smile } from 'lucide-react';
const EMOJIS = ['👍','❤️','😂','😮','😢','😡','🚗','✈️','🚆','🗺️','📸','🍔'];
export default function ChatView({ chatId, currentUser, onMinimize, onClose, viewMode }: any) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [txt, setTxt] = useState('');
  const [info, setInfo] = useState<any>(null);
  const [trans, setTrans] = useState(false);
  const [drive, setDrive] = useState(false);
  const [emoji, setEmoji] = useState(false);
  const [rec, setRec] = useState(false);
  const mediaRef = useRef<any>(null);
  const endRef = useRef<any>(null);

  useEffect(() => { const i = setInterval(load, 2000); load(); return () => clearInterval(i); }, [chatId]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [msgs]);

  const load = async () => {
    dbGetAll('chats').then((c:any)=>setInfo(c.find((x:any)=>x.id===chatId)));
    const all = await dbGetAll('messages');
    const m = all.filter((x:any)=>x.chatId===chatId).sort((a:any,b:any)=>a.timestamp-b.timestamp);
    if(trans) for(let x of m) if(x.type==='text' && x.sender!==currentUser.id && !x.translatedText) x.translatedText = await translateText(x.text);
    setMsgs(m);
  };

  const send = async () => {
    if(!txt) return;
    const m = { id: Date.now(), chatId, sender: currentUser.id, type: 'text', text: txt, timestamp: Date.now() };
    await dbPut('messages', m); setTxt(''); setEmoji(false); setMsgs(p=>[...p,m]);
  };

  const upload = (e: any, type: string) => {
    const f = e.target.files[0]; const r = new FileReader(); r.readAsDataURL(f);
    r.onload = async () => { await dbPut('messages', { id: Date.now(), chatId, sender: currentUser.id, type, text: type, mediaData: r.result, timestamp: Date.now() }); setMsgs(p=>[...p,{id:Date.now(), type, mediaData:r.result}]); };
  };

  const record = async () => {
      try {
          const s = await navigator.mediaDevices.getUserMedia({audio:true});
          const m = new MediaRecorder(s); mediaRef.current=m; const c:any[]=[];
          m.ondataavailable=e=>c.push(e.data);
          m.onstop=()=>{ const r=new FileReader(); r.readAsDataURL(new Blob(c)); r.onload=async()=>{ await dbPut('messages',{id:Date.now(), chatId, sender:currentUser.id, type:'audio', text:'Audio', mediaData:r.result, timestamp:Date.now()}); load(); } };
          m.start(); setRec(true);
      } catch(e) { alert('Mic blocked'); }
  };

  if(!info) return null;
  if(viewMode === 'mobile-minimized') return <div className="bg-white dark:bg-gray-800 backdrop-blur rounded-full p-3 flex justify-between shadow-xl mb-4 mx-4 pointer-events-auto border border-gray-200 dark:border-gray-700"><div onClick={onMinimize} className="font-semibold px-2 flex-1 text-gray-900 dark:text-white">{info.name}</div><div className="flex gap-2"><button onClick={onMinimize}><Maximize2 size={18} className="text-gray-600 dark:text-gray-300"/></button><button onClick={(e)=>{e.stopPropagation();onClose();}} className="text-red-500 hover:text-red-600 transition-colors"><X size={18}/></button></div></div>;

  return (
    <div className={`flex flex-col h-full ${drive?'bg-black/90 text-white':'bg-white dark:bg-gray-950'} backdrop-blur pointer-events-auto rounded-t-3xl md:rounded-none`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-inherit">
         <div onClick={onMinimize} className="font-semibold text-lg flex-1 cursor-pointer text-gray-900 dark:text-white">{info.name}</div>
         <div className="flex gap-2 items-center">
           <button onClick={()=>setDrive(!drive)} title="Drive mode" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">{drive?<Eye className="text-gray-900 dark:text-white"/>:<EyeOff className="text-gray-600 dark:text-gray-300"/>}</button>
           <button onClick={()=>setTrans(!trans)} title="Translate" className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors ${trans?'text-blue-600 dark:text-blue-400':'text-gray-600 dark:text-gray-300'}`}><Languages/></button>
           <button onClick={(e)=>{e.stopPropagation();onClose();}} className="p-1 text-red-500 hover:text-red-600 transition-colors"><X size={20}/></button>
         </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
         {msgs.map(m => {
             const me = m.sender === currentUser.id;
             return <div key={m.id} className={`flex ${me?'justify-end':'justify-start'}`}><div className={`p-3 rounded-2xl max-w-[80%] ${me?'bg-blue-600 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'}`}>{m.type==='text'&&<div className="text-sm">{m.text}{m.translatedText&&<div className="text-xs opacity-75 border-t mt-2 pt-2">{m.translatedText}</div>}</div>}{m.type==='image'&&<img src={m.mediaData} className="rounded max-h-48 max-w-sm"/>}{m.type==='audio'&&<audio controls src={m.mediaData} className="w-full max-w-xs"/>}{m.type==='video'&&<video controls src={m.mediaData} className="rounded max-h-40 max-w-xs" />}</div></div>;
         })}
         <div ref={endRef}/>
      </div>
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 relative bg-inherit sticky bottom-0">
          {emoji && <div className="absolute bottom-full left-0 right-0 bg-gray-50 dark:bg-gray-900 p-2 shadow-lg grid grid-cols-6 gap-2 h-48 overflow-y-auto w-full rounded-t-lg border-t border-gray-200 dark:border-gray-800">{EMOJIS.map(e=><button key={e} onClick={()=>{setTxt(p=>p+e); setEmoji(false);}} className="text-2xl hover:bg-gray-200 dark:hover:bg-gray-800 p-1 rounded transition-colors">{e}</button>)}</div>}
          <div className="flex gap-2 items-center">
              <button onClick={()=>setEmoji(!emoji)} title="Emoji" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-gray-600 dark:text-gray-300"><Smile size={20}/></button>
              <label title="Attach file" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors text-gray-600 dark:text-gray-300"><Paperclip size={20}/><input type="file" hidden accept="image/*,video/*" onChange={e=>upload(e,e.target.files?.[0]?.type?.includes('video')?'video':'image')}/></label>
              {rec ? <button onClick={()=>{mediaRef.current?.stop(); setRec(false)}} className="p-2 text-red-500 hover:text-red-600 animate-pulse rounded transition-colors"><StopCircle size={20}/></button> : <button onClick={record} title="Record audio" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-gray-600 dark:text-gray-300"><Mic size={20}/></button>}
              <input className="flex-1 border border-gray-300 dark:border-gray-700 rounded-full px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type..."/>
              <button onClick={send} className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Send message"><Send size={20}/></button>
          </div>
      </div>
    </div>
  );
}
