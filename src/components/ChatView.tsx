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
  if(viewMode === 'mobile-minimized') return <div className="bg-surface/90 backdrop-blur rounded-full p-3 flex justify-between shadow-xl mb-4 mx-4 pointer-events-auto border"><div onClick={onMinimize} className="font-bold px-2 flex-1 dark:text-white">{info.name}</div><div className="flex gap-2"><button onClick={onMinimize}><Maximize2 size={16} className="dark:text-white"/></button><button onClick={(e)=>{e.stopPropagation();onClose();}} className="text-red-500"><X size={16}/></button></div></div>;

  return (
    <div className={`flex flex-col h-full ${drive?'bg-black/80 text-white':'bg-surface/95 dark:bg-gray-900'} backdrop-blur pointer-events-auto rounded-t-3xl md:rounded-none`}>
      <div className="p-3 border-b flex justify-between items-center dark:border-gray-700">
         <div onClick={onMinimize} className="font-bold text-lg flex-1 cursor-pointer dark:text-white">{info.name}</div>
         <div className="flex gap-3"><button onClick={()=>setDrive(!drive)}>{drive?<Eye/>:<EyeOff className="dark:text-white"/>}</button><button onClick={()=>setTrans(!trans)} className={trans?'text-blue-500':'dark:text-white'}><Languages/></button><button onClick={(e)=>{e.stopPropagation();onClose();}} className="text-red-500"><X/></button></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
         {msgs.map(m => {
             const me = m.sender === currentUser.id;
             return <div key={m.id} className={`flex ${me?'justify-end':'justify-start'}`}><div className={`p-3 rounded-2xl max-w-[80%] ${me?'bg-green-600 text-white':'bg-gray-100 dark:bg-gray-800 dark:text-white'}`}>{m.type==='text'&&<div>{m.text}{m.translatedText&&<div className="text-xs opacity-75 border-t mt-1">{m.translatedText}</div>}</div>}{m.type==='image'&&<img src={m.mediaData} className="rounded max-h-40"/>}{m.type==='audio'&&<audio controls src={m.mediaData} className="w-full"/>}</div></div>;
         })}
         <div ref={endRef}/>
      </div>
      <div className="p-3 border-t relative dark:border-gray-700">
          {emoji && <div className="absolute bottom-full bg-surface p-2 shadow grid grid-cols-6 gap-2 h-40 overflow-y-auto w-full">{EMOJIS.map(e=><button key={e} onClick={()=>setTxt(p=>p+e)}>{e}</button>)}</div>}
          <div className="flex gap-2 items-center">
              <button onClick={()=>setEmoji(!emoji)} className="dark:text-white"><Smile/></button>
              <label className="dark:text-white"><Paperclip/><input type="file" hidden accept="image/*,video/*" onChange={e=>upload(e,e.target.files[0].type.includes('video')?'video':'image')}/></label>
              {rec ? <button onClick={()=>{mediaRef.current?.stop(); setRec(false)}} className="text-red-500 animate-pulse"><StopCircle/></button> : <button onClick={record} className="dark:text-white"><Mic/></button>}
              <input className="flex-1 border rounded-full px-4 py-2 bg-transparent dark:text-white" value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type..."/>
              <button onClick={send} className="text-green-600"><Send/></button>
          </div>
      </div>
    </div>
  );
}
