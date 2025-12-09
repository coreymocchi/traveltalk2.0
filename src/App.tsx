import React, { useState, useEffect } from 'react';
import { dbGet } from './services/db';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import MapView from './components/MapView';
import SettingsView from './components/SettingsView';
import { Menu, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileState, setMobileState] = useState(1);
  const [resize, setResize] = useState(0);

  useEffect(() => { const u = localStorage.getItem('tt_user'); if(u) dbGet('users', u).then(setUser); 
    if(localStorage.getItem('theme')==='dark') document.documentElement.classList.add('dark');
  }, []);
  useEffect(() => { if(user?.theme?.primaryColor) document.documentElement.style.setProperty('--primary', user.theme.primaryColor); }, [user]);
  useEffect(() => { setTimeout(()=>setResize(r=>r+1), 300) }, [sidebarOpen, chatId, mobileState]);

  if(!user) return <Auth onLogin={(u: any)=>{setUser(u); localStorage.setItem('tt_user', u.username)}} />;

  return (
    <div className="fixed inset-0 flex bg-bg text-gray-900 dark:text-gray-100 overflow-hidden">
       <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-surface shadow-xl transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:relative'}`}>
           <Sidebar currentUser={user} currentChatId={chatId} onSelectChat={(id: string)=>{setChatId(id); setSidebarOpen(false); setMobileState(2);}} onOpenSettings={()=>{setSidebarOpen(false); setSettingsOpen(true);}} onClose={()=>setSidebarOpen(false)} />
       </div>
       <div className="flex-1 relative flex flex-col">
           <div className="absolute top-4 left-4 z-20 md:hidden"><button onClick={()=>setSidebarOpen(true)} className="bg-surface/90 p-3 rounded-full shadow text-primary"><Menu/></button></div>
           <div className="flex-1 relative"><MapView currentUser={user} resizeTrigger={resize} /></div>
           {chatId && (
               <>
                 <div className="hidden md:block w-96 border-l bg-surface absolute right-0 top-0 bottom-0 z-30 shadow-xl"><ChatView chatId={chatId} currentUser={user} viewMode="desktop" onClose={()=>setChatId(null)} /></div>
                 <div className={`md:hidden fixed inset-x-0 bottom-0 z-40 transition-transform ${mobileState===1 ? '' : 'h-[60%]'}`}>
                     {mobileState===1 ? <div className="absolute bottom-4 left-4 right-4"><ChatView chatId={chatId} currentUser={user} viewMode="mobile-minimized" onMinimize={()=>setMobileState(2)} onClose={()=>setChatId(null)}/></div> : <div className="h-full"><ChatView chatId={chatId} currentUser={user} viewMode="mobile-expanded" onMinimize={()=>setMobileState(1)} onClose={()=>setChatId(null)}/></div>}
                 </div>
               </>
           )}
       </div>
       {settingsOpen && <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"><div className="w-full max-w-lg h-[80vh] bg-bg rounded-3xl overflow-hidden relative border"><button onClick={()=>setSettingsOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-200 rounded-full z-10"><X size={20}/></button><SettingsView currentUser={user} onLogout={()=>{setUser(null); localStorage.clear();}} isDark={document.documentElement.classList.contains('dark')} toggleTheme={()=>{document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', document.documentElement.classList.contains('dark')?'dark':'light')}} onUpdate={setUser}/></div></div>}
    </div>
  );
}
