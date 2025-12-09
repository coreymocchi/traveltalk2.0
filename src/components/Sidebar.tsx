import React, { useState, useEffect } from 'react';
import { User, Chat, Message } from '../types';
import { dbGetAll, dbPut, dbDelete } from '../services/db';
import { Search, Users, X, Check, Settings, Trash2 } from 'lucide-react';

export default function Sidebar({ currentUser, currentChatId, onSelectChat, onOpenSettings, onClose }: any) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [q, setQ] = useState('');
  const [res, setRes] = useState<User[]>([]);
  const [showGroup, setShowGroup] = useState(false);
  const [gName, setGName] = useState('');
  const [selected, setSelected] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => { const i = setInterval(load, 3000); load(); return () => clearInterval(i); }, [currentUser.id]);
  useEffect(() => { if(showGroup) dbGetAll<User>('users').then(u => setAllUsers(u.filter(x => x.id !== currentUser.id))); }, [showGroup]);

  const load = async () => {
    const all = await dbGetAll<Chat>('chats');
    const msgs = await dbGetAll<Message>('messages');
    setChats(all.filter(c => c.participants.includes(currentUser.id)).map(c => {
       const last = msgs.filter(m => m.chatId === c.id).sort((a,b) => b.timestamp - a.timestamp)[0];
       return { ...c, lastMessage: last ? (last.type === 'text' ? last.text : `Sent ${last.type}`) : 'No messages', lastMessageTs: last?.timestamp || 0 };
    }).sort((a,b) => b.lastMessageTs - a.lastMessageTs));
  };

  const search = async (val: string) => {
    setQ(val); if(val.length < 1) return setRes([]);
    setRes((await dbGetAll<User>('users')).filter(u => u.id !== currentUser.id && u.username.includes(val.toLowerCase())));
  };

  const startChat = async (u: User) => {
    const id = `private-${[currentUser.id, u.id].sort().join('-')}`;
    if(!chats.find(c => c.id === id)) await dbPut('chats', { id, name: u.name, type: 'private', participants: [currentUser.id, u.id], lastMessageTs: Date.now() });
    onSelectChat(id); setQ(''); setRes([]);
  };

  const createGroup = async () => {
    if(!gName || selected.length === 0) return;
    const id = `group-${Date.now()}`;
    await dbPut('chats', { id, name: gName, type: 'group', participants: [currentUser.id, ...selected.map(u=>u.id)], admins: [currentUser.id], lastMessageTs: Date.now() });
    setShowGroup(false); load(); onSelectChat(id);
  };

  const del = async (e:any, id:string) => { e.stopPropagation(); if(confirm('Delete?')) await dbDelete('chats', id); load(); };
  const toggleUser = (u: User) => setSelected(p => p.find(s=>s.id===u.id) ? p.filter(s=>s.id!==u.id) : [...p,u]);

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      <div className="p-4 flex justify-between items-center border-b border-border">
        <h2 className="font-bold text-xl dark:text-white">Messages</h2>
        <div className="flex gap-2">
           <button onClick={()=>setShowGroup(!showGroup)} className="p-2 bg-gray-100 rounded-full"><Users size={16}/></button>
           {onClose && <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={16}/></button>}
        </div>
      </div>
      {showGroup && <div className="p-4 bg-gray-50 border-b space-y-2"><input className="w-full p-2 border rounded" placeholder="Group Name" onChange={e=>setGName(e.target.value)}/><div className="max-h-32 overflow-y-auto space-y-1">{allUsers.map(u=><div key={u.id} onClick={()=>toggleUser(u)} className={`p-2 border rounded flex justify-between cursor-pointer ${selected.find(s=>s.id===u.id)?'bg-green-100 border-green-500':''}`}>{u.name} {selected.find(s=>s.id===u.id)&&<Check size={14}/>}</div>)}</div><button onClick={createGroup} className="w-full bg-primary text-white p-2 rounded">Create</button></div>}
      <div className="p-3"><input className="w-full p-2 bg-bg border rounded-xl" placeholder="Search users..." value={q} onChange={e=>search(e.target.value)}/></div>
      <div className="flex-1 overflow-y-auto">
        {res.map(u=><div key={u.id} onClick={()=>startChat(u)} className="p-3 hover:bg-gray-100 cursor-pointer border-b"><div className="font-bold">{u.name}</div><div className="text-xs">@{u.username}</div></div>)}
        {chats.map(c=><div key={c.id} onClick={()=>onSelectChat(c.id)} className={`p-4 cursor-pointer relative group border-b ${currentChatId===c.id?'bg-primary text-white':'hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800'}`}><div className="font-bold">{c.name}</div><div className="text-xs opacity-70 truncate">{c.lastMessage}</div><button onClick={(e)=>del(e,c.id)} className="absolute right-2 top-4 opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={16}/></button></div>)}
      </div>
      <div className="p-4 border-t"><button onClick={onOpenSettings} className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl flex gap-2 justify-center dark:text-white"><Settings size={18}/> Settings</button></div>
    </div>
  );
}
